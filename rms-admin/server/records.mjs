import { HttpError } from "./content-store.mjs";
import {
  approveConsultation,
  fromStored,
  rescheduleConsultation,
  toStored,
} from "./consultations.mjs";

function unavailable(error) {
  return new HttpError(
    502,
    "The studio records could not be reached. " +
      String(error?.message || "Try again.").slice(0, 160),
  );
}

export function orderRow(order) {
  return {
    id: order.id,
    placed_at: order.date,
    email: order.email,
    name: order.name,
    phone: order.phone || "",
    status: order.status,
    total: order.total ?? 0,
    paid: order.paid !== false,
    items: order.items || [],
    address: order.address || {},
    record: order,
  };
}

export function orderFrom(row) {
  const order = row.record && typeof row.record === "object" ? { ...row.record } : {};
  order.id = row.id;
  order.date = row.placed_at;
  order.email = row.email;
  order.name = row.name;
  order.status = row.status;
  order.total = Number(row.total);
  order.paid = row.paid;
  order.items = row.items;
  order.address = row.address;
  return order;
}

const consultationColumns = "id, date, name, email, phone, service, meeting, vision, status";

function consultationRow(item) {
  const stored = toStored(fromStored(item));
  return {
    id: stored.id,
    date: stored.date,
    name: stored.name,
    email: stored.email,
    phone: stored.phone,
    service: stored.service,
    meeting: stored.meeting,
    vision: stored.vision || "",
    status: stored.status,
  };
}

function consultationFrom(row) {
  return fromStored({
    id: row.id,
    date: row.date,
    name: row.name,
    email: row.email,
    phone: row.phone,
    service: row.service,
    meeting: row.meeting,
    vision: row.vision || "",
    status: row.status,
  });
}

function timestamp(value) {
  const parsed = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function jobRow(job) {
  return {
    id: job.id,
    kind: job.kind,
    audience: job.audience,
    state: job.state,
    email: job.email || null,
    token: job.token || null,
    payload: job,
    updated_at: new Date().toISOString(),
  };
}

function checkoutRow(checkout) {
  return {
    token: checkout.token,
    email: checkout.email || null,
    completed: Boolean(checkout.completed),
    cancelled: Boolean(checkout.cancelled),
    document: checkout,
    updated_at: timestamp(checkout.updated),
  };
}

async function removeMissing(client, table, column, keep) {
  const { data, error } = await client.from(table).select(column);
  if (error) throw unavailable(error);
  const gone = (data || []).map((row) => row[column]).filter((id) => !keep.has(id));
  if (!gone.length) return;
  const { error: deleteError } = await client.from(table).delete().in(column, gone);
  if (deleteError) throw unavailable(deleteError);
}

export function createRecords(client) {
  if (!client) return null;

  return {
    catalogue: {
      async load() {
        const { data, error } = await client
          .from("catalogue")
          .select("document")
          .eq("id", "draft")
          .maybeSingle();
        if (error) throw unavailable(error);
        return data?.document ?? null;
      },
      async save(document) {
        const { error } = await client.from("catalogue").upsert({
          id: "draft",
          document,
          updated_at: new Date().toISOString(),
        });
        if (error) throw unavailable(error);
      },
    },
    profile: {
      async load() {
        const { data, error } = await client
          .from("studio_profile")
          .select("name, image")
          .eq("id", "owner")
          .maybeSingle();
        if (error) throw unavailable(error);
        return data ? { name: data.name, image: data.image || "" } : null;
      },
      async save(profile) {
        const { error } = await client.from("studio_profile").upsert({
          id: "owner",
          name: profile.name,
          image: profile.image || "",
        });
        if (error) throw unavailable(error);
      },
    },
    sessions: {
      async load() {
        const { data, error } = await client.from("studio_sessions").select("token, email, expires_at");
        if (error) throw unavailable(error);
        return (data || []).map((row) => ({
          token: row.token,
          email: row.email,
          expires: Date.parse(row.expires_at),
        }));
      },
      async save(list) {
        const sessions = Array.isArray(list) ? list : [];
        await removeMissing(client, "studio_sessions", "token", new Set(sessions.map((item) => item.token)));
        if (!sessions.length) return;
        const { error } = await client.from("studio_sessions").upsert(
          sessions.map((session) => ({
            token: session.token,
            email: session.email,
            expires_at: new Date(session.expires).toISOString(),
          })),
        );
        if (error) throw unavailable(error);
      },
    },
    admins: {
      async load() {
        const people = await client.from("studio_admins").select("email, name, password, image, created_at");
        const invites = await client.from("studio_invites").select("email, token_hash, expires_at, created_at");
        if (people.error) throw unavailable(people.error);
        if (invites.error) throw unavailable(invites.error);
        return {
          people: (people.data || []).map((person) => ({
            email: person.email,
            name: person.name,
            password: person.password,
            image: person.image || "",
            createdAt: person.created_at,
          })),
          invites: (invites.data || []).map((invite) => ({
            email: invite.email,
            tokenHash: invite.token_hash,
            expiresAt: Date.parse(invite.expires_at),
            createdAt: invite.created_at,
          })),
        };
      },
      async save(data) {
        const people = Array.isArray(data.people) ? data.people : [];
        const invites = Array.isArray(data.invites) ? data.invites : [];
        await removeMissing(client, "studio_admins", "email", new Set(people.map((person) => person.email)));
        await removeMissing(client, "studio_invites", "email", new Set(invites.map((invite) => invite.email)));
        if (people.length) {
          const { error } = await client.from("studio_admins").upsert(
            people.map((person) => ({
              email: person.email,
              name: person.name,
              password: person.password,
              image: person.image || "",
              created_at: person.createdAt || new Date().toISOString(),
            })),
          );
          if (error) throw unavailable(error);
        }
        if (invites.length) {
          const { error } = await client.from("studio_invites").upsert(
            invites.map((invite) => ({
              email: invite.email,
              token_hash: invite.tokenHash,
              expires_at: new Date(invite.expiresAt).toISOString(),
              created_at: invite.createdAt || new Date().toISOString(),
            })),
          );
          if (error) throw unavailable(error);
        }
      },
    },
    mail: {
      async load() {
        const jobs = await client.from("mail_jobs").select("payload");
        const checkouts = await client.from("checkouts").select("document");
        const opted = await client.from("mail_opt_outs").select("email");
        if (jobs.error) throw unavailable(jobs.error);
        if (checkouts.error) throw unavailable(checkouts.error);
        if (opted.error) throw unavailable(opted.error);
        return {
          jobs: (jobs.data || []).map((row) => row.payload),
          checkouts: (checkouts.data || []).map((row) => row.document),
          optedOut: (opted.data || []).map((row) => row.email),
        };
      },
      async save(data) {
        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        const checkouts = Array.isArray(data.checkouts) ? data.checkouts : [];
        const opted = Array.isArray(data.optedOut) ? data.optedOut : [];
        await removeMissing(client, "mail_jobs", "id", new Set(jobs.map((job) => job.id)));
        await removeMissing(client, "checkouts", "token", new Set(checkouts.map((item) => item.token)));
        await removeMissing(client, "mail_opt_outs", "email", new Set(opted));
        if (jobs.length) {
          const { error } = await client.from("mail_jobs").upsert(jobs.map(jobRow));
          if (error) throw unavailable(error);
        }
        if (checkouts.length) {
          const { error } = await client.from("checkouts").upsert(checkouts.map(checkoutRow));
          if (error) throw unavailable(error);
        }
        if (opted.length) {
          const { error } = await client.from("mail_opt_outs").upsert(opted.map((email) => ({ email })));
          if (error) throw unavailable(error);
        }
      },
    },
    orders: {
      async list() {
        const { data, error } = await client
          .from("orders")
          .select("id, placed_at, email, name, phone, status, total, paid, items, address, record")
          .order("placed_at", { ascending: false });
        if (error) throw unavailable(error);
        return (data || []).map(orderFrom);
      },
      async record(order) {
        const { data: existing, error: readError } = await client
          .from("orders")
          .select("id, placed_at, email, name, phone, status, total, paid, items, address, record")
          .eq("id", order.id)
          .maybeSingle();
        if (readError) throw unavailable(readError);
        if (existing) return { order: orderFrom(existing), created: false };
        const stored = { ...order, stockTaken: false };
        const { error } = await client.from("orders").insert(orderRow(stored));
        if (error) throw unavailable(error);
        return { order: stored, created: true };
      },
      async markStockTaken(id) {
        const { data, error } = await client
          .from("orders")
          .select("id, placed_at, email, name, phone, status, total, paid, items, address, record")
          .eq("id", id)
          .maybeSingle();
        if (error) throw unavailable(error);
        const order = data ? orderFrom(data) : null;
        if (!order || order.stockTaken !== false) return;
        order.stockTaken = true;
        const { error: writeError } = await client.from("orders").update(orderRow(order)).eq("id", id);
        if (writeError) throw unavailable(writeError);
      },
      async setStatus(id, status) {
        const { data, error } = await client
          .from("orders")
          .select("id, placed_at, email, name, phone, status, total, paid, items, address, record")
          .eq("id", id)
          .maybeSingle();
        if (error) throw unavailable(error);
        if (!data) throw new HttpError(404, "That order is not in the studio.");
        const order = { ...orderFrom(data), status };
        const { error: writeError } = await client.from("orders").update(orderRow(order)).eq("id", id);
        if (writeError) throw unavailable(writeError);
        return order;
      },
      async statuses(ids) {
        const wanted = ids.filter((id) => typeof id === "string");
        if (!wanted.length) return [];
        const { data, error } = await client.from("orders").select("id, status").in("id", wanted);
        if (error) throw unavailable(error);
        return data || [];
      },
    },
    consultations: {
      async list() {
        const { data, error } = await client
          .from("consultations")
          .select(consultationColumns)
          .order("date", { ascending: false });
        if (error) throw unavailable(error);
        return (data || []).map(consultationFrom).filter((item) => item.paid !== false);
      },
      async find(id) {
        const { data, error } = await client
          .from("consultations")
          .select(consultationColumns)
          .eq("id", id)
          .maybeSingle();
        if (error) throw unavailable(error);
        return data ? consultationFrom(data) : null;
      },
      async save(item) {
        const { error } = await client.from("consultations").upsert(consultationRow(item));
        if (error) throw unavailable(error);
        return consultationFrom(consultationRow(item));
      },
      async record(item) {
        const existing = await this.find(item.id);
        if (existing) return existing;
        return this.save(item);
      },
      async setStatus(id, status) {
        const current = await this.find(id);
        if (!current) throw new HttpError(404, "That consultation is not in the studio.");
        return this.save({ ...current, status });
      },
      async approve(id, scheduledAt) {
        return this.save(approveConsultation(await this.find(id), scheduledAt));
      },
      async reschedule(id, scheduledAt) {
        return this.save(rescheduleConsultation(await this.find(id), scheduledAt));
      },
    },
  };
}
