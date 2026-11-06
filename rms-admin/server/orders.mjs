import { serialTask } from "./serial-task.mjs";
import { writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { HttpError } from "./content-store.mjs";
import { readJsonIfPresent } from "./studio-db.mjs";

export const orderStatuses = ["confirmed", "preparing", "courier", "delivered"];

function clip(value, max) {
  const clean = typeof value === "string" ? value.trim() : "";
  return clean.length > max ? "" : clean;
}

function imageOf(value) {
  const clean = typeof value === "string" ? value.trim() : "";
  if (!clean) return "";
  if (clean.length > 500) throw new HttpError(400, "That order could not be recorded.");
  if (clean.startsWith("/") && !clean.includes("..") && !clean.includes("\\"))
    return clean;
  try {
    const url = new URL(clean);
    if (url.protocol === "https:") return clean;
  } catch {
    /* not a url */
  }
  throw new HttpError(400, "That order could not be recorded.");
}

export function acceptOrder(body) {
  if (!body || typeof body !== "object")
    throw new HttpError(400, "That order could not be recorded.");
  const id = clip(body.id, 40);
  if (!/^RMS-[A-Z0-9]{8,24}$/.test(id))
    throw new HttpError(400, "That order could not be recorded.");
  const parsed = Date.parse(body.date);
  if (!Number.isFinite(parsed))
    throw new HttpError(400, "That order could not be recorded.");
  const email = clip(body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "Add an email for this order.");
  const name = clip(body.name, 80);
  const phone = clip(body.phone, 30);
  const street = clip(body.address?.street, 120);
  const city = clip(body.address?.city, 80);
  const country = clip(body.address?.country, 80);
  if (!name || !phone || !street || !city || !country)
    throw new HttpError(400, "Add the delivery details.");
  const note = (typeof body.note === "string" ? body.note.trim() : "").slice(0, 500);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30)
    throw new HttpError(400, "That order could not be recorded.");
  const items = body.items.map((item) => {
    const productId = clip(item?.productId, 80);
    const size = clip(item?.size, 20);
    const itemName = clip(item?.name, 80);
    const quantity = Number(item?.quantity);
    const price = Number(item?.price);
    if (
      !productId ||
      !size ||
      !itemName ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20 ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 1_000_000
    )
      throw new HttpError(400, "That order could not be recorded.");
    return {
      productId,
      size,
      quantity,
      name: itemName,
      image: imageOf(item?.image),
      price,
    };
  });
  return {
    id,
    date: new Date(parsed).toISOString(),
    email,
    name,
    phone,
    address: { street, city, country },
    note,
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    paid: true,
    status: "confirmed",
  };
}

export function createOrderStore(directory) {
  const file = resolve(directory, "orders.json");
  const mutate = serialTask();

  async function read() {
    const data = await readJsonIfPresent(file);
    return Array.isArray(data) ? data : [];
  }

  async function write(orders) {
    await mkdir(directory, { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(orders, null, 2));
    await rename(temp, file);
  }

  return {
    list: read,
    record(order) { return mutate(async () => {
      const orders = await read();
      const existing = orders.find((entry) => entry.id === order.id);
      if (existing) return { order: existing, created: false };
      const stored = { ...order, stockTaken: false };
      orders.unshift(stored);
      await write(orders);
      return { order: stored, created: true };
    }); },
    markStockTaken(id) { return mutate(async () => {
      const orders = await read();
      const order = orders.find((entry) => entry.id === id);
      if (!order || order.stockTaken !== false) return;
      order.stockTaken = true;
      await write(orders);
    }); },
    setStatus(id, status) { return mutate(async () => {
      const orders = await read();
      const order = orders.find((entry) => entry.id === id);
      if (!order) throw new HttpError(404, "That order is not in the studio.");
      order.status = status;
      await write(orders);
      return order;
    }); },
    async statuses(ids) {
      const wanted = new Set(ids.filter((id) => typeof id === "string"));
      const orders = await read();
      return orders
        .filter((order) => wanted.has(order.id))
        .map((order) => ({ id: order.id, status: order.status }));
    },
  };
}
