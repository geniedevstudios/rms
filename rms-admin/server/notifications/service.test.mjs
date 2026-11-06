import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createNotifications } from "./service.mjs";
import { createOrderStore } from "../orders.mjs";
const HOUR = 3600000;
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "rms-emails-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let time = Date.parse("2026-11-04T12:00:00Z");
  let paymentStatus = "failed";
  let failMail = false;
  const sent = [];
  const config = {
    enabled: true,
    apiKey: "fake",
    from: "RMS <shop@example.test>",
    adminEmail: "studio@example.test",
    storefrontUrl: "https://shop.example.test",
    adminUrl: "https://studio.example.test",
    paystackSecret: "fake",
  };
  const orderBook = createOrderStore(directory);
  const options = {
    directory,
    config,
    orderBook,
    contentStore: {
      read: async () => ({
        published: {
          products: [
            {
              id: "dress",
              name: "Dress",
              price: 100,
              status: "active",
              image: "/dress.jpg",
            },
          ],
          customDesigns: [],
        },
      }),
    },
    now: () => time,
    fetchImpl: async (url, options) => {
      if (url.startsWith("https://api.paystack.co/"))
        return {
          ok: true,
          json: async () => ({
            status: true,
            data: {
              status: paymentStatus,
              currency: "GHS",
              amount: 10000,
              customer: { email: "customer@example.test" },
              paid_at: new Date(time).toISOString(),
            },
          }),
        };
      assert.equal(url, "https://api.resend.com/emails");
      if (failMail) throw new Error("offline");
      sent.push({
        ...JSON.parse(options.body),
        key: options.headers["Idempotency-Key"],
      });
      return { ok: true, json: async () => ({ id: `mail-${sent.length}` }) };
    },
  };
  const service = createNotifications(options);
  const tick = service.tick.bind(service);
  service.tick = async (...args) => {
    await tick(...args);
    await service.settled();
  };
  const checkout = {
    token: "a".repeat(64),
    email: "customer@example.test",
    name: "Ada <script>",
    phone: "+23300000000",
    address: { street: "1 Studio Road", city: "Accra", country: "Ghana" },
    items: [{ productId: "dress", size: "M", quantity: 1 }],
    reminderConsent: true,
  };
  return {
    service,
    options,
    orderBook,
    checkout,
    sent,
    advance: (ms) => (time += ms),
    payment: (status) => (paymentStatus = status),
    fail: (value) => (failMail = value),
    data: async () =>
      JSON.parse(await readFile(join(directory, "notifications.json"), "utf8")),
  };
}
test("24-hour reminder sends customer and admin once, survives restart, and escapes content", async (t) => {
  const f = await fixture(t);
  await f.service.checkout(f.checkout);
  f.advance(24 * HOUR - 1);
  await f.service.tick();
  assert.equal(f.sent.length, 0);
  f.advance(1);
  await f.service.tick();
  assert.equal(f.sent.length, 2);
  assert.ok(f.sent[0].html.includes("Ada &lt;script&gt;"));
  assert.ok(f.sent[0].text.includes("recovery="));
  await createNotifications(f.options).tick();
  assert.equal(f.sent.length, 2);
});
test("activity restarts the clock and empty carts do not send reminders", async (t) => {
  const f = await fixture(t);
  await f.service.checkout(f.checkout);
  f.advance(23 * HOUR);
  await f.service.checkout(f.checkout);
  f.advance(2 * HOUR);
  await f.service.tick();
  assert.equal(f.sent.length, 0);
  await f.service.checkout({ token: f.checkout.token, cancel: true });
  f.advance(30 * HOUR);
  await f.service.tick();
  assert.equal(f.sent.length, 0);
});
test("reminders respect consent and opt-out without suppressing the admin alert", async (t) => {
  const f = await fixture(t);
  await f.service.checkout({ ...f.checkout, reminderConsent: false });
  f.advance(24 * HOUR);
  await f.service.tick();
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].to[0], "studio@example.test");
  const g = await fixture(t);
  await g.service.checkout(g.checkout);
  await g.service.optOut(g.checkout.token);
  g.advance(24 * HOUR);
  await g.service.tick();
  assert.equal(g.sent.length, 1);
});
test("failed payments notify both parties once, but pending payments do not", async (t) => {
  const f = await fixture(t);
  await f.service.checkout({ ...f.checkout, reference: "RMS-ABCDEF123456" });
  f.payment("pending");
  await f.service.tick();
  assert.equal(f.sent.length, 0);
  f.payment("failed");
  f.advance(60000);
  await f.service.tick();
  assert.equal(f.sent.length, 2);
  assert.ok(f.sent[0].subject.includes("make it yours"));
  await f.service.tick();
  assert.equal(f.sent.length, 2);
});
test("server reconciles successful payments, cancels reminders and never duplicates receipts", async (t) => {
  const f = await fixture(t);
  await f.service.checkout({ ...f.checkout, reference: "RMS-ABCDEF123456" });
  f.payment("success");
  await f.service.tick();
  assert.equal(f.sent.length, 2);
  assert.ok(f.sent[0].subject.includes("confirmed"));
  const orders = await f.orderBook.list();
  assert.equal(orders.length, 1);
  assert.equal(orders[0].total, 100);
  await f.service.order({ ...orders[0], total: 1 });
  await f.service.tick();
  assert.equal(f.sent.length, 2);
  f.advance(25 * HOUR);
  await f.service.tick();
  assert.equal(f.sent.length, 2);
});
test("consultation retry deduplicates both emails and failed sends retry durably", async (t) => {
  const f = await fixture(t);
  const request = {
    id: "CST-123456789ABC",
    email: "customer@example.test",
    name: "Ada",
    service: "Bespoke",
    meeting: "Online meeting",
  };
  f.fail(true);
  await f.service.event("consultation", request);
  await f.service.event("consultation", request);
  await f.service.tick();
  assert.equal(f.sent.length, 0);
  f.fail(false);
  f.advance(HOUR);
  await createNotifications(f.options).tick();
  assert.equal(f.sent.length, 2);
  assert.ok(f.sent[0].text.includes("not yet a confirmed appointment"));
});
test("payment snapshots stay stable if the customer changes the bag after starting payment", async (t) => {
  const f = await fixture(t);
  await f.service.checkout({ ...f.checkout, reference: "RMS-ABCDEF123456" });
  await f.service.checkout({
    ...f.checkout,
    items: [{ productId: "dress", size: "L", quantity: 2 }],
  });
  f.payment("success");
  await f.service.tick();
  assert.equal((await f.orderBook.list())[0].total, 100);
});
test("recovery returns only cart items and ambiguous sends stop before the provider dedupe expires", async (t) => {
  const f = await fixture(t);
  await f.service.checkout(f.checkout);
  assert.deepEqual(Object.keys(await f.service.recover(f.checkout.token)), [
    "items",
  ]);
  f.advance(24 * HOUR);
  f.fail(true);
  await f.service.tick();
  f.advance(24 * HOUR);
  await f.service.tick();
  assert.equal((await f.service.status()).review, 2);
});
test("checkout verification is bound to its token and persists before returning success", async (t) => {
  const f = await fixture(t);
  await f.service.checkout({ ...f.checkout, reference: "RMS-ABCDEF123456" });
  f.payment("success");
  await assert.rejects(() =>
    f.service.complete("b".repeat(64), "RMS-ABCDEF123456"),
  );
  const order = await f.service.complete(f.checkout.token, "RMS-ABCDEF123456");
  assert.equal(order.total, 100);
  assert.equal((await f.orderBook.list()).length, 1);
});
test("cancelled checkout sends an accurately labelled interruption; successful payments never get that follow-up", async (t) => {
  const f = await fixture(t);
  await f.service.checkout({ ...f.checkout, reference: "RMS-ABCDEF123456" });
  f.payment("abandoned");
  await f.service.issue(f.checkout.token, "RMS-ABCDEF123456", "cancelled");
  await f.service.settled();
  assert.equal(f.sent.length, 2);
  assert.ok(f.sent[0].text.includes("closed before we could confirm"));
  assert.ok(!f.sent[0].text.includes("payment attempt as unsuccessful"));
  const g = await fixture(t);
  await g.service.checkout({ ...g.checkout, reference: "RMS-ABCDEF123456" });
  g.payment("success");
  await g.service.issue(g.checkout.token, "RMS-ABCDEF123456", "cancelled");
  await g.service.settled();
  assert.equal(g.sent.length, 2);
  assert.ok(g.sent[0].subject.includes("Order confirmed"));
});
test("emails use the matching department sender, logo attachment, product image and details", async (t) => {
  const f = await fixture(t);
  f.options.config.senders = {
    order: "RMS Orders <orders@example.test>",
    consultation: "RMS Consultation <consultation@example.test>",
  };
  await f.service.checkout({ ...f.checkout, reference: "RMS-ABCDEF123456" });
  f.payment("success");
  await f.service.complete(f.checkout.token, "RMS-ABCDEF123456");
  await f.service.settled();
  assert.equal(f.sent[0].from, "RMS Orders <orders@example.test>");
  assert.equal(f.sent[0].reply_to, "orders@example.test");
  assert.equal(f.sent[1].reply_to, "customer@example.test");
  assert.ok(f.sent[0].html.includes("https://shop.example.test/dress.jpg"));
  assert.ok(f.sent[0].html.includes("SIZE M"));
  assert.ok(
    f.sent[0].attachments.some((a) => a.content_id === "invitation-hero"),
  );
});
test("new consultation emails dispatch without waiting for the periodic worker", async (t) => {
  const f = await fixture(t);
  await f.service.event("consultation", {
    id: "CST-FAST12345678",
    email: "customer@example.test",
    name: "Ada",
    service: "Bespoke",
    meeting: "Online meeting",
  });
  await f.service.settled();
  assert.equal(f.sent.length, 2);
});
