import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { Modal } from "../../components/ui";
import {
  buildRevenue,
  money,
  periodStart,
  revenuePeriods,
  shiftPeriod,
  type PaidOrder,
  type RevenuePeriod,
} from "./revenue.model";
import "./revenue.styles.css";

type Props = {
  orders: PaidOrder[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
};
const compact = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

export function Revenue({ orders, loading, error, onRetry, onClose }: Props) {
  const [period, setPeriod] = useState<RevenuePeriod>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<number | null>(null);
  const now = new Date();
  const report = buildRevenue(orders, period, anchor, now);
  const activeIndex = selected ?? report.peakIndex;
  const active = report.buckets[activeIndex];
  const current = report.start.getTime() >= periodStart(period, now).getTime();
  function move(direction: number) {
    setAnchor(shiftPeriod(period, anchor, direction));
    setSelected(null);
  }
  return (
    <Modal title="Revenue" onClose={onClose} wide>
      <section className="revenue-report" aria-label="Revenue report">
        <div className="revenue-controls">
          <span className="revenue-caption">
            <TrendingUp size={18} /> YOUR BUSINESS, IN VIEW
          </span>
          <div
            className="revenue-periods"
            role="group"
            aria-label="Revenue period"
          >
            {revenuePeriods.map((item) => (
              <button
                key={item.id}
                aria-pressed={period === item.id}
                onClick={() => {
                  setPeriod(item.id);
                  setAnchor(now);
                  setSelected(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="revenue-date-nav">
          <button
            className="icon-button"
            aria-label={`Previous ${period}`}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <strong aria-live="polite">{report.title}</strong>
          <button
            className="icon-button"
            aria-label={`Next ${period}`}
            disabled={current}
            onClick={() => move(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {loading ? (
          <p role="status" className="revenue-notice">
            Loading your revenue…
          </p>
        ) : error ? (
          <div className="revenue-notice" role="alert">
            <p>{error}</p>
            <button className="button secondary" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="revenue-summary">
              <div>
                <span>Amount received{current ? " so far" : ""}</span>
                <strong>{money(report.total)}</strong>
              </div>
              <div className="revenue-order-count">
                <strong>{report.orders.length}</strong>
                <span>
                  {report.orders.length === 1 ? "paid order" : "paid orders"}
                </span>
              </div>
            </div>
            <div
              className="revenue-chart"
              aria-label={`Revenue in ${report.title}, in Ghana cedis`}
            >
              <div className="revenue-scale" aria-hidden="true">
                {[4, 3, 2, 1, 0].map((tick) => (
                  <span key={tick}>{compact((report.ceiling * tick) / 4)}</span>
                ))}
              </div>
              <div className="revenue-plot">
                <div className="revenue-grid" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((tick) => (
                    <i key={tick} />
                  ))}
                </div>
                <div className={`revenue-bars revenue-bars-${period}`}>
                  {report.buckets.map((bucket, index) => (
                    <button
                      key={bucket.detail}
                      className={`revenue-column ${index === activeIndex ? "is-selected" : ""}`}
                      aria-label={`${bucket.detail}: ${bucket.future ? "Upcoming" : `${money(bucket.total)}, ${bucket.count} paid ${bucket.count === 1 ? "order" : "orders"}`}`}
                      aria-pressed={index === activeIndex}
                      onClick={() => setSelected(index)}
                    >
                      <span className="revenue-bar-space">
                        <span
                          className={`revenue-bar ${bucket.total === 0 ? "is-zero" : ""}`}
                          style={{
                            height: `${(bucket.total / report.ceiling) * 100}%`,
                          }}
                        >
                          {index === activeIndex && bucket.total > 0 && (
                            <span className="revenue-bar-value">
                              {compact(bucket.total)}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="revenue-bar-label">{bucket.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="revenue-selection" aria-live="polite">
              {active ? (
                <>
                  <span>
                    {selected === null ? "Highest revenue · " : ""}
                    {active.detail}
                  </span>
                  <strong>
                    {active.future ? "Upcoming" : money(active.total)}
                  </strong>
                  <span>
                    {active.count} {active.count === 1 ? "order" : "orders"}
                  </span>
                </>
              ) : (
                <span>
                  No paid orders in this period. Revenue will appear here as
                  orders arrive.
                </span>
              )}
            </div>
            <p className="revenue-footnote">
              GHS · Ghana time ·{" "}
              {period === "week"
                ? "Daily totals, Monday to Sunday."
                : period === "month"
                  ? "Totals grouped into seven-day intervals."
                  : "Monthly totals, January to December."}{" "}
              Select a bar for its details.
            </p>
            {!!report.orders.length && (
              <details className="revenue-orders">
                <summary>
                  View {report.orders.length} paid{" "}
                  {report.orders.length === 1 ? "order" : "orders"}
                </summary>
                <ul>
                  {report.orders.map((order) => (
                    <li key={order.id}>
                      <span>
                        <strong>{order.name}</strong>
                        <small>
                          {order.id} ·{" "}
                          {new Date(order.date).toLocaleDateString("en-GB", {
                            timeZone: "Africa/Accra",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </small>
                      </span>
                      <strong>{money(order.total)}</strong>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>
    </Modal>
  );
}
