import assert from "node:assert/strict";
import test from "node:test";
import { orderFrom, orderRow } from "./records.mjs";

test("an order row keeps the original record and the columns the studio looks up", () => {
  const order = {
    id: "RMS-ABCDE12345",
    date: "2026-11-01T00:00:00.000Z",
    email: "ada@example.com",
    name: "Ada Mensah",
    phone: "0240000000",
    address: { street: "1 High Street", city: "Accra", country: "Ghana" },
    note: "Leave at the desk",
    items: [{ productId: "skirt", size: "M", quantity: 1, name: "Skirt", price: 1450 }],
    total: 1450,
    paid: true,
    status: "confirmed",
    stockTaken: false,
  };
  const row = orderRow(order);
  assert.equal(row.status, "confirmed");
  assert.equal(row.email, "ada@example.com");
  assert.equal(row.record.stockTaken, false);
  const restored = orderFrom({ ...row, total: "1450" });
  assert.equal(restored.total, 1450);
  assert.equal(restored.stockTaken, false);
  assert.equal(restored.note, "Leave at the desk");
});
