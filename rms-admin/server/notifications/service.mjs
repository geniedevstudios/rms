import { writeFile, rename, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { HttpError } from "../content-store.mjs";
import { serialTask } from "../serial-task.mjs";
import { buildNotificationMessage } from "./message.mjs";
import { quoteCheckout } from "../promotions.mjs";
import { countryCode, countryName } from "../shippo.mjs";
import { consultationFee } from "../consultations.mjs";
import { readJsonIfPresent } from "../studio-db.mjs";
const HOUR = 3600000;
const TOKEN = /^[a-f0-9]{64}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function publicUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
export function notificationConfig(env = process.env) {
  return {
    senders: {
      order:
        env.RESEND_ORDERS_FROM ||
        "RIVERMINDSTYLE <orders@rivermindstyle.com>",
      consultation:
        env.RESEND_CONSULTATION_FROM ||
        "RIVERMINDSTYLE <consultation@rivermindstyle.com>",
      "consultation-confirmed":
        env.RESEND_CONSULTATION_FROM ||
        "RIVERMINDSTYLE <consultation@rivermindstyle.com>",
      "consultation-rescheduled":
        env.RESEND_CONSULTATION_FROM ||
        "RIVERMINDSTYLE <consultation@rivermindstyle.com>",
      failed:
        env.RESEND_PAYMENTS_FROM ||
        "RIVERMINDSTYLE <payments@rivermindstyle.com>",
      interrupted:
        env.RESEND_PAYMENTS_FROM ||
        "RIVERMINDSTYLE <payments@rivermindstyle.com>",
      abandoned:
        env.RESEND_CARE_FROM || "RIVERMINDSTYLE <care@rivermindstyle.com>",
      verification:
        env.RESEND_VERIFICATION_FROM ||
        "RIVERMINDSTYLE <verification@rivermindstyle.com>",
    },
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM,
    adminEmail: env.RMS_NOTIFICATION_EMAIL || env.RMS_ADMIN_EMAIL,
    storefrontUrl: env.RMS_STOREFRONT_URL || "http://127.0.0.1:5173",
    adminUrl: env.RMS_ADMIN_URL || "http://127.0.0.1:5175",
    linksReady:
      publicUrl(env.RMS_STOREFRONT_URL) && publicUrl(env.RMS_ADMIN_URL),
    paystackSecret: env.PAYSTACK_SECRET_KEY,
    enabled: env.RMS_EMAIL_AUTOMATION_ENABLED !== "false",
  };
}
function emptyNotifications() {
  return { jobs: [], checkouts: [], optedOut: [] };
}
export function createNotifications({
  directory,
  config,
  contentStore,
  orderBook,
  remote = null,
  fetchImpl = fetch,
  now = () => Date.now(),
  shippo = null,
}) {
  const file = resolve(directory, "notifications.json");
  const serial = serialTask();
  let running = false;
  async function read() {
    if (remote) {
      const saved = await remote.load();
      if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
      return emptyNotifications();
    }
    return (await readJsonIfPresent(file)) || emptyNotifications();
  }
  async function write(data) {
    if (remote) return remote.save(data);
    await mkdir(directory, { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data), { mode: 0o600 });
    await rename(temp, file);
  }
  function enqueue(data, kind, record) {
    for (const audience of ["customer", "admin"]) {
      if (
        kind === "abandoned" &&
        audience === "customer" &&
        (!record.reminderConsent || data.optedOut.includes(record.email))
      )
        continue;
      if (
        audience === "admin" &&
        (kind === "consultation-confirmed" || kind === "consultation-rescheduled")
      )
        continue;
      const to = audience === "admin" ? config.adminEmail : record.email;
      if (!to || !emailPattern.test(to)) continue;
      const stamp =
        kind === "consultation-confirmed" || kind === "consultation-rescheduled"
          ? `:${record.scheduledAt || ""}`
          : "";
      const id = `${kind}:${record.id || record.token}${stamp}:${audience}`;
      if (data.jobs.some((job) => job.id === id)) continue;
      if (["failed", "interrupted"].includes(kind) && data.jobs.some(job => ["failed", "interrupted"].includes(job.kind) && job.record?.id === record.id && job.audience === audience)) continue;
      data.jobs.push({
        id,
        kind,
        audience,
        record,
        token: record.token,
        email: record.email,
        to,
        state: "pending",
        attempts: 0,
        created: now(),
        next: now(),
      });
    }
  }
  async function verify(reference) {
    if (!config.paystackSecret)
      throw new HttpError(
        503,
        "Payment verification is not configured. Please contact the studio.",
      );
    const response = await fetchImpl(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${config.paystackSecret}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.status || !result.data)
      throw new HttpError(
        503,
        "Payment status could not be checked. Please try again.",
      );
    return result.data;
  }
  function matches(payment, order) {
    return (
      payment.currency === "GHS" &&
      Number(payment.amount) === Math.round(order.total * 100) &&
      String(payment.customer?.email || "").toLowerCase() ===
        order.email.toLowerCase()
    );
  }
  function suppress(data, email) {
    data.checkouts
      .filter((c) => c.email === email)
      .forEach((c) => {
        c.completed = true;
      });
    data.jobs
      .filter(
        (j) =>
          j.email === email &&
          ["abandoned", "failed", "interrupted"].includes(j.kind) &&
          j.state === "pending",
      )
      .forEach((j) => {
        j.state = "cancelled";
      });
  }
  async function persistOrder(data, order) {
    const recorded = await orderBook.record(order);
    if (
      (recorded.created || recorded.order.stockTaken === false) &&
      typeof contentStore.takeStock === "function"
    ) {
      await contentStore.takeStock(recorded.order.id, recorded.order.items);
      await orderBook.markStockTaken(recorded.order.id);
    }
    const saved = { ...recorded.order };
    delete saved.stockTaken;
    suppress(data, saved.email);
    enqueue(data, "order", saved);
    await write(data);
    return saved;
  }
  const service = {
    async quote(body) {
      const { published } = await contentStore.read();
      const { items, ...totals } = quoteCheckout(published, body, now());
      return totals;
    },
    initialize(token, reference) {
      return serial(async () => {
        if (!config.paystackSecret) throw new HttpError(503, "Payment is not configured.");
        const data = await read();
        const checkout = data.checkouts.find(c => c.token === token && !c.completed && !c.cancelled);
        const attempt = checkout?.references?.find(a => a.reference === reference);
        if (!attempt) throw new HttpError(400, "Start checkout again.");
        if (attempt.accessCode) return { accessCode: attempt.accessCode, reference };
        const order = attempt.order;
        // Recheck offers before starting payment; initiated payments keep their quoted amount.
        const { published } = await contentStore.read();
        const current = quoteCheckout(published, order, now());
        const delivery = Math.round(Number(order.shipping?.cedis || 0) * 100);
        const total = (Math.round(current.total * 100) + delivery) / 100;
        if (total !== order.total || now() - order.updated > 15 * 60000)
          throw new HttpError(400, "Your checkout has changed. Review your bag and try again.");
        if (order.total <= 0) throw new HttpError(400, "Add pieces to your bag.");
        const response = await fetchImpl("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: { Authorization: `Bearer ${config.paystackSecret}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({ email: order.email, amount: String(Math.round(order.total * 100)), currency: "GHS", reference,
            metadata: { custom_fields: [
              { display_name: "Customer", variable_name: "customer", value: order.name },
              { display_name: "Promo code", variable_name: "promo_code", value: order.promoCode || "" },
            ] } }),
        });
        const result = await response.json();
        if (!response.ok || !result.status || !result.data?.access_code)
          throw new HttpError(502, "Payment could not be started. Please try again.");
        attempt.accessCode = result.data.access_code;
        await write(data);
        return { accessCode: attempt.accessCode, reference };
      });
    },
    async complete(token, reference) {
      const snapshot = await serial(
        async () =>
          (await read()).checkouts
            .find((c) => c.token === token)
            ?.references?.find((a) => a.reference === reference)?.order,
      );
      if (!snapshot)
        throw new HttpError(
          400,
          "This payment does not belong to this checkout.",
        );
      return this.order({
        ...snapshot,
        id: reference,
        date: new Date(now()).toISOString(),
      });
    },
    async order(order) {
      const savedCheckout = await serial(
        async () =>
          (await read()).checkouts
            .flatMap((c) => c.references || [])
            .find((attempt) => attempt.reference === order.id)?.order,
      );
      if (!savedCheckout || savedCheckout.email !== order.email.toLowerCase())
        throw new HttpError(
          400,
          "Start checkout again so the studio can safely record this order.",
        );
      order = {
        ...order,
        ...savedCheckout,
        id: order.id,
        paid: true,
        status: "confirmed",
      };
      const payment = await verify(order.id);
      if (payment.status !== "success" || !matches(payment, order))
        throw new HttpError(
          402,
          "Payment has not been confirmed for this order.",
        );
      let saved = await serial(async () => persistOrder(await read(), order));
      if (saved.shipping?.rateId && shippo?.enabled) {
        try {
          const label = await shippo.buy(saved.shipping.rateId);
          saved = { ...saved, shipping: { ...saved.shipping, ...label } };
        } catch (error) {
          saved = {
            ...saved,
            shipping: {
              ...saved.shipping,
              status: "unbought",
              error: error.status ? error.message : "The delivery label could not be bought.",
            },
          };
        }
        if (typeof orderBook.update === "function") {
          try {
            saved = await orderBook.update(saved);
          } catch {
            /* The paid order is already recorded. */
          }
        }
      }
      void service.tick({ deliverOnly: true }).catch(() => {});
      return saved;
    },
    async startConsultation(booking) {
      if (!config.paystackSecret) throw new HttpError(503, "Payment is not configured.");
      const response = await fetchImpl("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.paystackSecret}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          email: booking.email,
          amount: String(consultationFee * 100),
          currency: "GHS",
          reference: booking.id,
          metadata: { consultation_id: booking.id },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.status || !result.data?.access_code)
        throw new HttpError(502, "Payment could not be started. Please try again.");
      return { accessCode: result.data.access_code, reference: booking.id };
    },
    async confirmConsultationPayment(reference, booking) {
      const payment = await verify(reference);
      const paid =
        payment.status === "success" &&
        payment.currency === "GHS" &&
        Number(payment.amount) === consultationFee * 100 &&
        String(payment.customer?.email || "").toLowerCase() === booking.email;
      if (!paid)
        throw new HttpError(402, "Payment has not been confirmed for this appointment.");
      return payment;
    },
    async event(kind, record) {
      await serial(async () => {
        const data = await read();
        enqueue(data, kind, record);
        await write(data);
      });
      void service.tick({ deliverOnly: true }).catch(() => {});
    },
    async issue(token, reference, reason) {
      await serial(async () => {
        const data = await read();
        const c = data.checkouts.find((c) => c.token === token && !c.completed);
        const attempt = c?.references?.find((a) => a.reference === reference);
        if (!attempt) throw new HttpError(400, "Checkout session not found.");
        attempt.issue = reason === "cancelled" ? "cancelled" : "interrupted";
        attempt.nextCheck = 0;
        await write(data);
      });
      void service.tick().catch(() => {});
      return { recorded: true };
    },
    checkout(body) {
      return serial(async () => {
        if (!TOKEN.test(body?.token || ""))
          throw new HttpError(400, "Invalid checkout session.");
        const data = await read();
        let current = data.checkouts.find((c) => c.token === body.token);
        if (current?.completed) return { completed: true };
        if (body.cancel) {
          if (current) {
            current.cancelled = true;
            current.updated = now();
            await write(data);
          }
          return { saved: true };
        }
        const email = String(body.email || "")
          .trim()
          .toLowerCase();
        if (!emailPattern.test(email) || email.length > 254)
          throw new HttpError(400, "Enter a valid email.");
        const { published } = await contentStore.read();
        const quote = quoteCheckout(published, body, now());
        const destination = body.address || {};
        const code = countryCode(destination.country);
        let shipping = null;
        if (body.reference && !code) throw new HttpError(400, "Choose a delivery country.");
        if (code && code !== "GH") {
          if (!body.reference) {
            /* A draft can be saved before a carrier is chosen. */
          } else if (!shippo?.enabled) {
            throw new HttpError(503, "Delivery prices are not available yet.");
          } else {
            shipping = shippo.quoted(body.rateId, destination, quote.items.reduce((sum, item) => sum + item.quantity, 0));
            if (!shipping) throw new HttpError(400, "Choose a delivery option again.");
          }
        }
        const total = (Math.round(quote.total * 100) + Math.round(Number(shipping?.cedis || 0) * 100)) / 100;
        if (body.reference && !/^RMS-[A-Z0-9]{8,24}$/.test(body.reference))
          throw new HttpError(400, "Invalid payment reference.");
        if (body.reference && data.checkouts.some(c => c.references?.some(a => a.reference === body.reference)))
          throw new HttpError(400, "Start a new payment attempt.");
        if (current && current.email !== email) {
          current.cancelled = true;
          data.jobs
            .filter((j) => j.token === current.token && j.state === "pending")
            .forEach((j) => (j.state = "cancelled"));
        }
        const snapshot = {
          token: body.token,
          email,
          name: String(body.name || current?.name || "").slice(0, 80),
          phone: String(body.phone ?? current?.phone ?? "").slice(0, 30),
          address: {
            street: String(
              body.address?.street ?? current?.address?.street ?? "",
            ).slice(0, 120),
            city: String(
              body.address?.city ?? current?.address?.city ?? "",
            ).slice(0, 80),
            state: String(
              body.address?.state ?? current?.address?.state ?? "",
            ).slice(0, 80),
            zip: String(
              body.address?.zip ?? current?.address?.zip ?? "",
            ).slice(0, 20),
            country: countryName(code) || String(
              body.address?.country ?? current?.address?.country ?? "Ghana",
            ).slice(0, 80),
          },
          note: String(body.note ?? current?.note ?? "").slice(0, 500),
          reminderConsent: body.reminderConsent === true,
          ...quote,
          total,
          ...(shipping ? { shipping } : {}),
          updated: now(),
          cancelled: false,
        };
        if (!current) {
          current = { created: now(), references: [] };
          data.checkouts.push(current);
        }
        Object.assign(current, snapshot);
        if (
          body.reference &&
          !current.references.some(
            (attempt) => attempt.reference === body.reference,
          )
        )
          current.references.push({
            reference: body.reference,
            order: { ...snapshot },
          });
        data.jobs
          .filter(
            (j) =>
              j.token === body.token &&
              j.kind === "abandoned" &&
              j.state === "pending",
          )
          .forEach((j) => (j.next = now() + 24 * HOUR));
        await write(data);
        return { saved: true, subtotal: quote.subtotal, discount: quote.discount, total, promoCode: quote.promoCode, delivery: shipping?.cedis || 0 };
      });
    },
    recover(token) {
      return serial(async () => {
        const data = await read();
        const c = data.checkouts.find(
          (c) =>
            c.token === token &&
            !c.completed &&
            now() - c.created < 30 * 24 * HOUR,
        );
        if (!c)
          throw new HttpError(404, "This saved bag is no longer available.");
        return {
          items: c.items.map(({ productId, size, quantity }) => ({
            productId,
            size,
            quantity,
          })),
        };
      });
    },
    optOut(token) {
      return serial(async () => {
        const data = await read();
        const c = data.checkouts.find((c) => c.token === token);
        if (!c)
          throw new HttpError(
            404,
            "This reminder link is no longer available.",
          );
        if (!data.optedOut.includes(c.email)) data.optedOut.push(c.email);
        data.jobs
          .filter(
            (j) =>
              j.kind === "abandoned" &&
              j.to === c.email &&
              j.state === "pending",
          )
          .forEach((j) => (j.state = "cancelled"));
        await write(data);
        return { stopped: true };
      });
    },
    async tick({ deliverOnly = false } = {}) {
      if (running) return;
      running = true;
      try {
        await serial(async () => {
          const data = await read();
          // Persisted sessions let payment reconciliation and reminders survive closed tabs/restarts.
          for (const c of deliverOnly ? [] : data.checkouts) {
            if (
              c.completed ||
              c.cancelled ||
              now() - c.created > 30 * 24 * HOUR
            )
              continue;
            let uncertain = false;
            const sendingReminder =
              (!c.reminded && !c.failed && now() - c.updated >= 24 * HOUR) ||
              data.jobs.some(
                (j) =>
                  j.token === c.token &&
                  ["abandoned", "failed", "interrupted"].includes(j.kind) &&
                  j.state === "pending" &&
                  j.next <= now(),
              );
            for (const attempt of c.references || []) {
              const { reference, order: snapshot } = attempt;
              if (attempt.nextCheck > now() && !sendingReminder) {
                if (!["failed", "abandoned"].includes(attempt.status))
                  uncertain = true;
                continue;
              }
              attempt.checks = (attempt.checks || 0) + 1;
              attempt.nextCheck =
                now() +
                Math.min(
                  15 * 60000,
                  60000 * 2 ** Math.min(attempt.checks - 1, 4),
                );
              try {
                const payment = await verify(reference);
                attempt.status = payment.status;
                if (
                  payment.status === "success" &&
                  matches(payment, snapshot)
                ) {
                  if (
                    snapshot.name &&
                    snapshot.phone &&
                    snapshot.address.street &&
                    snapshot.address.city
                  )
                    await persistOrder(data, {
                      ...snapshot,
                      id: reference,
                      date: payment.paid_at || new Date(now()).toISOString(),
                      paid: true,
                      status: "confirmed",
                    });
                  else suppress(data, c.email);
                  break;
                }
                if (payment.status === "failed" && matches(payment, snapshot)) {
                  enqueue(data, "failed", { ...snapshot, id: reference });
                  c.failed = true;
                } else if (
                  attempt.issue &&
                  matches(payment, snapshot) &&
                  ["abandoned", "pending", "ongoing"].includes(payment.status)
                ) {
                  enqueue(data, "interrupted", { ...snapshot, id: reference });
                  c.failed = true;
                }
                if (!["failed", "abandoned"].includes(payment.status))
                  uncertain = true;
              } catch {
                uncertain = true;
                if (attempt.issue) {
                  enqueue(data, "interrupted", { ...snapshot, id: reference });
                  c.failed = true;
                }
              }
            }
            if (
              !c.completed &&
              !c.failed &&
              !uncertain &&
              !c.reminded &&
              now() - c.updated >= 24 * HOUR
            ) {
              enqueue(data, "abandoned", c);
              c.reminded = true;
            }
          }
          await write(data);
          if (
            !config.enabled ||
            config.linksReady === false ||
            !config.apiKey ||
            !config.from ||
            !config.adminEmail
          )
            return;
          for (const job of data.jobs
            .filter((j) => j.state === "pending" && j.next <= now())
            .slice(0, 20)) {
            // Never repeat an ambiguous send after Resend's 24-hour idempotency window.
            if (job.firstAttempt && now() - job.firstAttempt >= 23 * HOUR) {
              job.state = "review";
              await write(data);
              continue;
            }
            const c =
              job.token && data.checkouts.find((c) => c.token === job.token);
            if (
              (["abandoned", "failed", "interrupted"].includes(job.kind) &&
                c?.completed) ||
              (job.kind === "abandoned" &&
                (c?.cancelled ||
                  (job.to === job.email &&
                    (!c?.reminderConsent ||
                      data.optedOut.includes(job.email)))))
            ) {
              job.state = "cancelled";
              await write(data);
              continue;
            }
            try {
              job.message ||= await buildNotificationMessage(
                job.kind,
                job.record,
                job.audience,
                config,
                directory,
              );
              if (job.firstAttempt && !job.from) {
                job.from = config.from;
                job.replyTo = config.adminEmail;
              }
              job.from ||= config.senders?.[job.kind] || config.from;
              job.replyTo ||=
                job.audience === "admin"
                  ? job.record.email
                  : job.from.match(/<([^>]+)>/)?.[1] || job.from;
              job.firstAttempt ||= now();
              job.attempts++;
              await write(data);
              const response = await fetchImpl(
                "https://api.resend.com/emails",
                {
                  method: "POST",
                  signal: AbortSignal.timeout(15000),
                  headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json",
                    "Idempotency-Key": createHash("sha256")
                      .update(job.id)
                      .digest("hex"),
                  },
                  body: JSON.stringify({
                    from: job.from,
                    to: [job.to],
                    reply_to: job.replyTo,
                    subject: job.message.subject,
                    html: job.message.html,
                    text: job.message.text,
                    attachments: job.message.attachments,
                  }),
                },
              );
              if (!response.ok) {
                const error = new Error("Email provider rejected the request.");
                error.status = response.status;
                error.retryAfter =
                  Number(response.headers?.get("retry-after")) || 0;
                throw error;
              }
              job.providerId = (await response.json()).id;
              job.state = "sent";
              job.sent = now();
              delete job.error;
            } catch (error) {
              job.error = error.status
                ? `Email provider returned HTTP ${error.status}.`
                : `Email delivery could not finish (${error.name || "Error"}).`;
              job.next =
                now() +
                Math.max(
                  (error.retryAfter || 0) * 1000,
                  Math.min(HOUR, 5000 * 2 ** Math.min(job.attempts, 9)),
                );
            }
            // Pace requests conservatively and honour Retry-After rather than bursting through the provider limit.
            if (fetchImpl === fetch)
              await new Promise((resolve) => setTimeout(resolve, 650));
            await write(data);
          }
        });
      } finally {
        running = false;
      }
    },
    settled() {
      return serial(async () => {});
    },
    status() {
      return serial(async () => {
        const data = await read();
        return {
          configured: Boolean(
            config.apiKey && config.from && config.adminEmail,
          ),
          enabled: config.enabled,
          linksReady: config.linksReady !== false,
          paymentsReady: Boolean(config.paystackSecret),
          pending: data.jobs.filter((j) => j.state === "pending").length,
          review: data.jobs.filter((j) => j.state === "review").length,
          sent: data.jobs.filter((j) => j.state === "sent").length,
        };
      });
    },
  };
  return service;
}
