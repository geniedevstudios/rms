import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("./revenue.model.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { buildRevenue, shiftPeriod } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const order = (date, total, extra = {}) => ({
  id: date,
  date,
  total,
  name: "Test",
  ...extra,
});

test("weeks start on Monday in Ghana and exclude adjacent periods, unpaid and invalid records", () => {
  const now = new Date("2026-11-04T12:00:00Z");
  const report = buildRevenue(
    [
      order("2026-11-01T23:59:59Z", 90),
      order("2026-11-02T00:00:00Z", 0.1),
      order("2026-11-02T23:59:59Z", 0.2),
      order("2026-11-03T00:00:00Z", 50),
      order("2026-11-04T13:00:00Z", 90),
      order("2026-11-03T10:00:00Z", 90, { paid: false }),
      order("invalid", 90),
      order("2026-11-03T11:00:00Z", -5),
    ],
    "week",
    now,
    now,
  );
  assert.equal(report.start.toISOString(), "2026-11-02T00:00:00.000Z");
  assert.equal(report.buckets.length, 7);
  assert.equal(report.total, 50.3);
  assert.equal(report.buckets[0].total, 0.3);
  assert.equal(report.peakIndex, 1);
  assert.equal(report.buckets[3].future, true);
});

test("leap month includes February 29 and excludes March 1", () => {
  const report = buildRevenue(
    [order("2024-02-29T23:59:59Z", 75), order("2024-03-01T00:00:00Z", 20)],
    "month",
    new Date("2024-02-15Z"),
    new Date("2025-01-01Z"),
  );
  assert.equal(report.total, 75);
  assert.equal(report.buckets.length, 5);
  assert.equal(report.buckets[4].label, "29–29");
  assert.equal(report.buckets[4].total, 75);
});

test("year view groups all twelve months and remains bounded by the year", () => {
  const report = buildRevenue(
    [
      order("2025-12-31T23:59:59Z", 999),
      order("2026-01-01T00:00:00Z", 12),
      order("2026-12-31T23:59:59Z", 25),
      order("2027-01-01T00:00:00Z", 999),
    ],
    "year",
    new Date("2026-06-01Z"),
    new Date("2027-02-01Z"),
  );
  assert.equal(report.total, 37);
  assert.equal(report.buckets.length, 12);
  assert.equal(report.buckets[0].total, 12);
  assert.equal(report.buckets[11].total, 25);
  assert.ok(report.ceiling >= 25);
});

test("navigation handles January and December without date overflow", () => {
  assert.equal(
    shiftPeriod("month", new Date("2026-01-31Z"), -1).toISOString(),
    "2025-12-01T00:00:00.000Z",
  );
  assert.equal(
    shiftPeriod("month", new Date("2026-01-31Z"), 1).toISOString(),
    "2026-02-01T00:00:00.000Z",
  );
  assert.equal(
    shiftPeriod("year", new Date("2026-12-31Z"), 1).toISOString(),
    "2027-01-01T00:00:00.000Z",
  );
});

test("empty reports have no invented revenue or highlighted peak", () => {
  const report = buildRevenue([], "month", new Date("2026-11-04Z"));
  assert.equal(report.total, 0);
  assert.equal(report.peakIndex, -1);
  assert.ok(report.ceiling > 0);
  assert.ok(report.buckets.every((bucket) => bucket.total === 0));
});
