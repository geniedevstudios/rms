import { serialTask } from "./serial-task.mjs";
import { writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { HttpError } from "./content-store.mjs";
import { readJsonIfPresent } from "./studio-db.mjs";

export const consultationStatuses = ["requested", "confirmed", "completed"];
export const consultationServices = ["Styling consultation", "Bespoke tailoring"];
export const consultationFee = 300;
const meetings = ["Online meeting", "Atelier visit"];
const mark = "rms-booking:";
const times = ["00", "15", "30", "45"];

function clip(value, max) {
  const clean = typeof value === "string" ? value.trim() : "";
  return clean.length > max ? "" : clean;
}

export function accraToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, date] = value.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, date));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== date
  )
    return "";
  return value;
}

export function acceptScheduled(value, now = new Date()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new HttpError(400, "Choose a coming day and time.");
  const day = parseDay(value.slice(0, 10));
  const hour = Number(value.slice(11, 13));
  const minute = value.slice(14, 16);
  if (!day || hour < 9 || hour > 17 || !times.includes(minute))
    throw new HttpError(400, "Choose a studio time between 9:00 and 17:45.");
  const stamp = Date.parse(`${value}:00.000Z`);
  if (!Number.isFinite(stamp) || stamp < now.getTime() + 30 * 60 * 1000)
    throw new HttpError(400, "Choose a coming day and time.");
  return new Date(stamp).toISOString();
}

export function acceptConsultation(body, now = new Date()) {
  if (!body || typeof body !== "object")
    throw new HttpError(400, "That consultation could not be recorded.");
  const id = clip(body.id, 40);
  if (!/^CST-[A-Z0-9]{8,24}$/.test(id))
    throw new HttpError(400, "That consultation could not be recorded.");
  const email = clip(body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "Add an email for this consultation.");
  const name = clip(body.name, 80);
  const phone = clip(body.phone, 30);
  const service = clip(body.service, 80);
  const meeting = clip(body.meeting, 40);
  const appointment = parseDay(body.appointment);
  const today = accraToday(now);
  const start = Number(today.slice(0, 4));
  const year = Number(appointment.slice(0, 4));
  if (!appointment || appointment < today || year < start || year >= start + 10)
    throw new HttpError(400, "Choose a coming day.");
  if (!name || !phone || !consultationServices.includes(service) || !meetings.includes(meeting))
    throw new HttpError(400, "Add the appointment details.");
  return {
    id,
    appointment,
    requestedAt:
      typeof body.requestedAt === "string" && Number.isFinite(Date.parse(body.requestedAt))
        ? new Date(body.requestedAt).toISOString()
        : now.toISOString(),
    scheduledAt: typeof body.scheduledAt === "string" ? body.scheduledAt : "",
    name,
    email,
    phone,
    service,
    meeting,
    vision: (typeof body.vision === "string" ? body.vision.trim() : "").slice(0, 500),
    status: consultationStatuses.includes(body.status) ? body.status : "requested",
    fee: consultationFee,
    paymentReference: clip(body.paymentReference, 40),
    paid: body.paid === true,
    rescheduled: body.rescheduled === true,
    accessCode: clip(body.accessCode, 80),
  };
}

export function sameBooking(left, right) {
  return ["appointment", "email", "name", "phone", "service", "meeting", "vision"].every(
    (key) => left?.[key] === right?.[key],
  );
}

export function toStored(item) {
  const meta = {
    note: item.vision || "",
    requestedAt: item.requestedAt || item.date || new Date().toISOString(),
    appointment: item.appointment || "",
    scheduledAt: item.scheduledAt || "",
    fee: item.fee || consultationFee,
    paymentReference: item.paymentReference || "",
    paid: item.paid === true,
    rescheduled: item.rescheduled === true,
    accessCode: item.accessCode || "",
  };
  return {
    id: item.id,
    date: meta.scheduledAt || (meta.appointment ? `${meta.appointment}T09:00:00.000Z` : meta.requestedAt),
    name: item.name,
    email: item.email,
    phone: item.phone,
    service: item.service,
    meeting: item.meeting,
    vision: mark + JSON.stringify(meta),
    status: item.status || "requested",
  };
}

export function fromStored(item) {
  if (!item || typeof item !== "object") return item;
  const raw = typeof item.vision === "string" ? item.vision : "";
  if (!raw.startsWith(mark)) return { ...item, vision: raw };
  try {
    const meta = JSON.parse(raw.slice(mark.length));
    return {
      ...item,
      vision: meta.note || "",
      requestedAt: meta.requestedAt || "",
      appointment: meta.appointment || "",
      scheduledAt: meta.scheduledAt || "",
      fee: meta.fee || consultationFee,
      paymentReference: meta.paymentReference || "",
      paid: meta.paid === true,
      rescheduled: meta.rescheduled === true,
      accessCode: meta.accessCode || "",
    };
  } catch {
    return { ...item, vision: raw };
  }
}

export function approveConsultation(item, scheduledAt, now = new Date()) {
  if (!item) throw new HttpError(404, "That consultation is not in the studio.");
  if (item.paid === false) throw new HttpError(400, "This appointment has not been paid.");
  if (item.status === "completed")
    throw new HttpError(400, "This appointment is already complete.");
  if (!parseDay(item.appointment))
    throw new HttpError(400, "This request has no day to approve.");
  const when = acceptScheduled(scheduledAt, now);
  if (when.slice(0, 10) !== item.appointment)
    throw new HttpError(400, "Choose a time on the day they asked for.");
  return { ...item, status: "confirmed", rescheduled: false, scheduledAt: when };
}

export function rescheduleConsultation(item, scheduledAt, now = new Date()) {
  if (!item) throw new HttpError(404, "That consultation is not in the studio.");
  if (item.paid === false) throw new HttpError(400, "This appointment has not been paid.");
  if (item.status === "completed")
    throw new HttpError(400, "This appointment is already complete.");
  return {
    ...item,
    status: "confirmed",
    rescheduled: true,
    scheduledAt: acceptScheduled(scheduledAt, now),
  };
}

export function createConsultationStore(directory) {
  const file = resolve(directory, "consultations.json");
  const mutate = serialTask();

  async function read() {
    const data = await readJsonIfPresent(file);
    return Array.isArray(data) ? data.map(fromStored) : [];
  }

  async function write(items) {
    await mkdir(directory, { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(items.map(toStored), null, 2));
    await rename(temp, file);
  }

  return {
    list() {
      return mutate(async () => (await read()).filter((item) => item.paid !== false));
    },
    find(id) {
      return mutate(async () => (await read()).find((item) => item.id === id) || null);
    },
    save(item) {
      return mutate(async () => {
        const items = await read();
        const index = items.findIndex((entry) => entry.id === item.id);
        if (index === -1) items.unshift(item);
        else items[index] = item;
        await write(items);
        return fromStored(toStored(item));
      });
    },
    record(item) {
      return mutate(async () => {
        const items = await read();
        const existing = items.find((entry) => entry.id === item.id);
        if (existing) return existing;
        items.unshift(item);
        await write(items);
        return fromStored(toStored(item));
      });
    },
    setStatus(id, status) {
      return mutate(async () => {
        const items = await read();
        const item = items.find((entry) => entry.id === id);
        if (!item) throw new HttpError(404, "That consultation is not in the studio.");
        item.status = status;
        await write(items);
        return fromStored(toStored(item));
      });
    },
    approve(id, scheduledAt) {
      return mutate(async () => {
        const items = await read();
        const index = items.findIndex((entry) => entry.id === id);
        const next = approveConsultation(items[index], scheduledAt);
        items[index] = next;
        await write(items);
        return fromStored(toStored(next));
      });
    },
    reschedule(id, scheduledAt) {
      return mutate(async () => {
        const items = await read();
        const index = items.findIndex((entry) => entry.id === id);
        const next = rescheduleConsultation(items[index], scheduledAt);
        items[index] = next;
        await write(items);
        return fromStored(toStored(next));
      });
    },
  };
}
