import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ShoppingBag,
  Calendar,
  Package,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useContent } from "../../app/content.context";
import { api } from "../../lib/api";
import { PageHeading, formatDate } from "../../components/ui";

import { Revenue } from "../revenue/revenue";
import { InventoryNotice } from "./inventory-notice";
import { inventoryNotices } from "./inventory";
import {
  money,
  validRevenueOrders,
  type PaidOrder,
} from "../revenue/revenue.model";
type Consultation = { id: string; status?: string };

export function Overview({ navigate }: { navigate: (page: string) => void }) {
  const { state, content, pending } = useContent();
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const notices = inventoryNotices(content.products);
  const received = validRevenueOrders(orders).reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const freshOrders = orders.filter(
    (order) => order.status === "confirmed",
  ).length;
  const freshConsults = consultations.filter(
    (item) => item.status === "requested",
  ).length;
  useEffect(() => {
    let stop = false;
    setOrdersLoading(true);
    setOrdersError("");
    void api<PaidOrder[]>("orders")
      .then((next) => {
        if (!stop) setOrders(next);
      })
      .catch(() => {
        if (!stop)
          setOrdersError("Revenue could not be loaded. Please try again.");
      })
      .finally(() => {
        if (!stop) setOrdersLoading(false);
      });
    void api<Consultation[]>("consultations")
      .then((next) => {
        if (!stop) setConsultations(next);
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [refresh]);

  return (
    <>
      <PageHeading
        eyebrow="YOUR BRAND, BEAUTIFULLY IN HAND"
        title="A little perspective."
        description="What has come in, and what is waiting for you."
      />
      <div className="stats-grid">
        <button className="stat" onClick={() => setInventoryOpen(true)}>
          <div>
            <span>Inventory notice</span>
            <Package size={17} />
          </div>
          <strong>{String(notices.length).padStart(2, "0")}</strong>
          <small>
            Two or fewer left
            <ArrowUpRight size={14} />
          </small>
        </button>
        <button
          className="stat stat-money"
          onClick={() => setRevenueOpen(true)}
        >
          <div>
            <span>Revenue</span>
            <ShoppingBag size={17} />
          </div>
          <strong>
            {ordersLoading
              ? "Loading…"
              : ordersError
                ? "Unavailable"
                : money(received)}
          </strong>
          <small>
            Weekly, monthly & yearly
            <ArrowUpRight size={14} />
          </small>
        </button>
        <button className="stat" onClick={() => navigate("orders")}>
          <div>
            <span>New orders</span>
            <ShoppingBag size={17} />
          </div>
          <strong>{String(freshOrders).padStart(2, "0")}</strong>
          <small>
            Waiting to be prepared
            <ArrowUpRight size={14} />
          </small>
        </button>
        <button className="stat" onClick={() => navigate("consultations")}>
          <div>
            <span>New consultations</span>
            <Calendar size={17} />
          </div>
          <strong>{String(freshConsults).padStart(2, "0")}</strong>
          <small>
            Appointment requests
            <ArrowUpRight size={14} />
          </small>
        </button>
      </div>
      <section className="panel next-panel overview-band">
        <span className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</span>
        <h2>A fresh point of view.</h2>
        <p>
          New imagery. A story worth telling. Bring your next chapter into
          focus.
        </p>
        <button className="quick-action" onClick={() => navigate("media")}>
          <span className="action-icon">
            <ShoppingBag size={19} />
          </span>
          <span>
            <strong>Refresh your imagery</strong>
            <small>Upload photographs and films</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <button className="quick-action" onClick={() => navigate("journal")}>
          <span className="action-icon">
            <Calendar size={19} />
          </span>
          <span>
            <strong>Tell a new story</strong>
            <small>Write for the RMS journal</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <button className="quick-action" onClick={() => navigate("products")}>
          <span className="action-icon">
            <Package size={19} />
          </span>
          <span>
            <strong>Consider the collection</strong>
            <small>Manage your pieces</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
      </section>
      <div className="overview-lower">
        <section className="panel">
          <div className="panel-heading">
            <h2>Recently in your studio</h2>
            <span className="muted">LATEST ACTIVITY</span>
          </div>
          {state.activity.length ? (
            state.activity.slice(0, 4).map((a) => (
              <div className="activity" key={a.id}>
                <Clock3 size={15} />
                <span>{a.message}</span>
                <time>{formatDate(a.at)}</time>
              </div>
            ))
          ) : (
            <div className="quiet-note">
              <span className="activity-dot" />
              <div>
                <strong>Your studio is ready.</strong>
                <p>
                  Start with the storefront’s existing imagery, pieces, and
                  stories. Your changes will appear here.
                </p>
              </div>
            </div>
          )}
        </section>
        <section className="publish-note">
          <CheckCircle2 size={22} />
          <h3>
            {pending
              ? "A new chapter is taking shape."
              : "Everything has its place."}
          </h3>
          <p>
            {pending
              ? "Your changes stay in the studio until you publish. Take your time. Make it yours."
              : "The storefront matches this studio."}
          </p>
          <span>LAST PUBLISHED</span>
          <small>{formatDate(state.publishedAt)}</small>
        </section>
      </div>
      {inventoryOpen && (
        <InventoryNotice
          products={content.products}
          onClose={() => setInventoryOpen(false)}
          onOpenCatalogue={() => {
            setInventoryOpen(false);
            navigate("products");
          }}
        />
      )}
      {revenueOpen && (
        <Revenue
          orders={orders}
          loading={ordersLoading}
          error={ordersError}
          onRetry={() => setRefresh((value) => value + 1)}
          onClose={() => setRevenueOpen(false)}
        />
      )}
    </>
  );
}
