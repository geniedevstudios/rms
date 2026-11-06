import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  acceptConsultation,
  createConsultationStore,
  fromStored,
  toStored,
} from "./consultations.mjs";
import { notificationMessage } from "./notifications/templates.mjs";

const booking = {
  id: "CST-ABCDEF123456",
  name: "Ada Mensah",
  email: "ada@example.com",
  phone: "0244000000",
  service: "Styling consultation",
  meeting: "Online meeting",
  vision: "A quiet navy set",
  appointment: "2026-12-02",
};

test("a consultation keeps the chosen day and the availability note", () => {
  const accepted = acceptConsultation(booking, new Date("2026-11-06T10:00:00.000Z"));
  assert.equal(accepted.appointment, "2026-12-02");
  assert.equal(accepted.fee, 300);
  const stored = fromStored(toStored({ ...accepted, paid: true }));
  assert.equal(stored.vision, "A quiet navy set");
  assert.equal(stored.paid, true);
  assert.equal(stored.appointment, "2026-12-02");
  const message = notificationMessage(
    "consultation",
    stored,
    "customer",
    { storefrontUrl: "https://rivermindstyle.com", adminUrl: "https://admin.example.com" },
  );
  assert.match(message.text, /not yet a confirmed appointment/);
  assert.match(message.text, /reschedule this day based on availability/);
  assert.match(message.text, /2 December 2026/);
  const later = acceptConsultation(
    { ...booking, appointment: "2030-06-15" },
    new Date("2026-11-06T10:00:00.000Z"),
  );
  assert.equal(later.appointment, "2030-06-15");
  assert.throws(
    () => acceptConsultation({ ...booking, appointment: "2026-11-05" }, new Date("2026-11-06T10:00:00.000Z")),
    /coming day/,
  );
  assert.throws(
    () => acceptConsultation({ ...booking, appointment: "2036-01-01" }, new Date("2026-11-06T10:00:00.000Z")),
    /coming day/,
  );
});

test("the studio can approve or move a paid appointment", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "rms-consult-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createConsultationStore(directory);
  const accepted = acceptConsultation(booking, new Date("2026-11-06T10:00:00.000Z"));
  await store.save({ ...accepted, paid: false });
  assert.equal((await store.list()).length, 0);
  await store.save({ ...accepted, paid: true, paymentReference: accepted.id });
  const approved = await store.approve(accepted.id, "2026-12-02T10:00");
  assert.equal(approved.status, "confirmed");
  assert.equal(approved.rescheduled, false);
  assert.equal(approved.scheduledAt, "2026-12-02T10:00:00.000Z");
  assert.equal(approved.appointment, "2026-12-02");
  const confirmed = notificationMessage(
    "consultation-confirmed",
    approved,
    "customer",
    { storefrontUrl: "https://rivermindstyle.com", adminUrl: "https://admin.example.com" },
  );
  assert.match(confirmed.text, /2 December 2026/);
  assert.match(confirmed.text, /10:00/);
  await assert.rejects(() => store.approve(accepted.id, "2026-12-04T10:00"), /day they asked for/);
  const moved = await store.reschedule(accepted.id, "2026-12-04T14:30");
  assert.equal(moved.rescheduled, true);
  assert.equal(moved.scheduledAt, "2026-12-04T14:30:00.000Z");
  const mail = notificationMessage(
    "consultation-rescheduled",
    moved,
    "customer",
    { storefrontUrl: "https://rivermindstyle.com", adminUrl: "https://admin.example.com" },
  );
  assert.match(mail.text, /4 December 2026/);
  assert.match(mail.text, /2:30/);
  assert.equal((await store.list()).length, 1);
});
