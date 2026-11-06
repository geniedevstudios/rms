export type RevenuePeriod = "week" | "month" | "year";
export type PaidOrder = {
  id: string;
  date: string;
  name: string;
  total: number;
  paid?: boolean;
  status?: string;
};
export const revenuePeriods = [
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
] as const;
export const money = (amount: number) =>
  `GH₵ ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = 86_400_000;
const utc = (year: number, month: number, date = 1) =>
  new Date(Date.UTC(year, month, date));
const dateLabel = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString("en-GB", { ...options, timeZone: "Africa/Accra" });

// Business reporting follows Ghana time (UTC), regardless of the admin's device.
export function periodStart(period: RevenuePeriod, date: Date) {
  const y = date.getUTCFullYear(),
    m = date.getUTCMonth(),
    d = date.getUTCDate();
  if (period === "year") return utc(y, 0);
  if (period === "month") return utc(y, m);
  return utc(y, m, d - ((date.getUTCDay() + 6) % 7));
}
export function shiftPeriod(
  period: RevenuePeriod,
  date: Date,
  direction: number,
) {
  const start = periodStart(period, date);
  if (period === "year") return utc(start.getUTCFullYear() + direction, 0);
  if (period === "month")
    return utc(start.getUTCFullYear(), start.getUTCMonth() + direction);
  return new Date(start.getTime() + direction * 7 * day);
}
export function validRevenueOrders(orders: PaidOrder[], now = new Date()) {
  return orders.filter(
    (order) =>
      order.paid !== false &&
      Number.isFinite(order.total) &&
      order.total >= 0 &&
      Number.isFinite(Date.parse(order.date)) &&
      Date.parse(order.date) <= now.getTime(),
  );
}
export function buildRevenue(
  orders: PaidOrder[],
  period: RevenuePeriod,
  anchor: Date,
  now = new Date(),
) {
  const start = periodStart(period, anchor);
  const end = shiftPeriod(period, start, 1);
  const rangeOrders = validRevenueOrders(orders, now)
    .filter((order) => {
      const time = Date.parse(order.date);
      return time >= start.getTime() && time < end.getTime();
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const count =
    period === "year"
      ? 12
      : period === "week"
        ? 7
        : Math.ceil((end.getTime() - start.getTime()) / day / 7);
  const buckets = Array.from({ length: count }, (_, index) => {
    const from =
      period === "year"
        ? utc(start.getUTCFullYear(), index)
        : new Date(start.getTime() + index * (period === "week" ? 1 : 7) * day);
    const to =
      period === "year"
        ? utc(start.getUTCFullYear(), index + 1)
        : new Date(
            Math.min(
              end.getTime(),
              from.getTime() + (period === "week" ? 1 : 7) * day,
            ),
          );
    const matches = rangeOrders.filter(
      (order) =>
        Date.parse(order.date) >= from.getTime() &&
        Date.parse(order.date) < to.getTime(),
    );
    return {
      label:
        period === "year"
          ? dateLabel(from, { month: "short" })
          : period === "week"
            ? dateLabel(from, { weekday: "short" })
            : `${from.getUTCDate()}–${new Date(to.getTime() - day).getUTCDate()}`,
      detail:
        period === "year"
          ? dateLabel(from, { month: "long", year: "numeric" })
          : period === "week"
            ? dateLabel(from, { day: "numeric", month: "short" })
            : `${dateLabel(from, { day: "numeric", month: "short" })} – ${dateLabel(new Date(to.getTime() - day), { day: "numeric", month: "short" })}`,
      total:
        Math.round(matches.reduce((sum, order) => sum + order.total, 0) * 100) /
        100,
      count: matches.length,
      future: from.getTime() > now.getTime(),
    };
  });
  const total =
    Math.round(rangeOrders.reduce((sum, order) => sum + order.total, 0) * 100) /
    100;
  const peak = Math.max(...buckets.map((bucket) => bucket.total));
  const magnitude = 10 ** Math.floor(Math.log10(peak || 100));
  const ceiling = [1, 2, 2.5, 5, 7.5, 10]
    .map((n) => n * magnitude)
    .find((n) => n >= (peak || 100))!;
  return {
    start,
    end,
    buckets,
    orders: rangeOrders,
    total,
    peakIndex:
      peak > 0 ? buckets.findIndex((bucket) => bucket.total === peak) : -1,
    ceiling,
    title:
      period === "year"
        ? String(start.getUTCFullYear())
        : period === "month"
          ? dateLabel(start, { month: "long", year: "numeric" })
          : `${dateLabel(start, { day: "numeric", month: "short" })} – ${dateLabel(new Date(end.getTime() - day), { day: "numeric", month: "short", year: "numeric" })}`,
  };
}
