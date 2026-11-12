import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Modal, PageHeading, Thumb } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";

type OrderStatus = "confirmed" | "preparing" | "courier" | "delivered";

type StudioOrder = {
  id: string;
  date: string;
  email: string;
  name: string;
  phone: string;
  address: { street: string; city: string; country: string; state?: string; zip?: string };
  note?: string;
  items: {
    productId: string;
    size: string;
    quantity: number;
    name: string;
    image: string;
    price: number;
    color?: string;
    colourwayId?: string;
  }[];
  total: number;
  discount?: number;
  promoCode?: string;
  status: OrderStatus;
  shipping?: {
    carrier?: string;
    service?: string;
    cedis?: number;
    trackingNumber?: string;
    trackingUrl?: string;
    labelUrl?: string;
    status?: string;
    error?: string;
  };
};

const stages: { id: OrderStatus; label: string }[] = [
  { id: "confirmed", label: "Payment confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "courier", label: "With the courier" },
  { id: "delivered", label: "Delivered" },
];

const money = (amount: number) =>
  `GH₵ ${amount.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;

function when(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudioOrders() {
  const [orders, setOrders] = useState<StudioOrder[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const next = await api<StudioOrder[]>("orders");
        if (!stop) {
          setOrders(next);
          setProblem("");
        }
      } catch (reason) {
        if (!stop)
          setProblem(
            reason instanceof Error
              ? reason.message
              : "The orders could not be loaded.",
          );
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 20000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const open = orders.find((order) => order.id === openId) || null;

  async function setStatus(order: StudioOrder, status: OrderStatus) {
    setSaving(true);
    setProblem("");
    try {
      const saved = await api<StudioOrder>(`orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((entry) => (entry.id === saved.id ? saved : entry)),
      );
    } catch (reason) {
      setProblem(
        reason instanceof Error
          ? reason.message
          : "The order could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="ORDERS"
        title="Orders, as they arrive."
        description="Move each paid order along as it is prepared, collected, and delivered."
      />
      {problem && <p className="error">{problem}</p>}
      {!orders.length ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">TODAY</div>
              <h2>Nothing to send yet.</h2>
            </div>
          </div>
          <p className="order-empty">
            Paid orders appear here, with the address ready for delivery.
          </p>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">IN THE STUDIO</div>
              <h2>
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Pieces</th>
                  <th>Total</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const pieces = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );
                  const stage =
                    stages.find((entry) => entry.id === order.status)?.label ||
                    "Payment confirmed";
                  return (
                    <tr key={order.id} onClick={() => setOpenId(order.id)}>
                      <td>
                        <button
                          className="product-name"
                          onClick={() => setOpenId(order.id)}
                        >
                          <Thumb
                            src={order.items[0]?.image || ""}
                            alt={order.items[0]?.name || ""}
                          />
                          <span>
                            <strong>{order.id}</strong>
                            <small>{when(order.date)}</small>
                          </span>
                        </button>
                      </td>
                      <td>{order.name}</td>
                      <td>
                        {pieces} {pieces === 1 ? "piece" : "pieces"}
                      </td>
                      <td>{money(order.total)}</td>
                      <td>
                        <span className="badge">{stage}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {open && (
        <Modal title={open.name} onClose={() => setOpenId(null)} wide>
          <div className="order-sheet">
            <div className="order-meta">
              <span className="eyebrow">{open.id}</span>
              <span>{when(open.date)}</span>
              <span className="badge">
                {stages.find((stage) => stage.id === open.status)?.label ||
                  "Payment confirmed"}
              </span>
            </div>
            <div className="order-sheet-grid">
              <section className="order-pieces">
                {open.items.map((item) => (
                  <div
                    className="order-line"
                    key={`${item.productId}-${item.size}`}
                  >
                    <Thumb src={item.image} alt={item.name} />
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {[item.color, item.size, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span>{money(item.price * item.quantity)}</span>
                  </div>
                ))}
                {!!open.discount && <div className="order-total"><span>Discount · {open.promoCode}</span><span>−{money(open.discount)}</span></div>}
                {!!open.shipping?.cedis && (
                  <div className="order-total">
                    <span>Delivery · {open.shipping.carrier}</span>
                    <span>{money(open.shipping.cedis)}</span>
                  </div>
                )}
                <div className="order-total">
                  <span>Total</span>
                  <strong>{money(open.total)}</strong>
                </div>
              </section>
              <aside className="order-side">
                <section className="order-card">
                  <span className="eyebrow">Delivery</span>
                  <strong>{open.name}</strong>
                  <span>{open.email}</span>
                  <span>{open.phone}</span>
                  <span>
                    {open.address.street}, {open.address.city}
                    {open.address.state ? `, ${open.address.state}` : ""}
                    {open.address.zip ? ` ${open.address.zip}` : ""},{" "}
                    {open.address.country}
                  </span>
                  {open.shipping?.carrier && (
                    <span>
                      {open.shipping.carrier}
                      {open.shipping.service ? ` · ${open.shipping.service}` : ""}
                    </span>
                  )}
                  {open.shipping?.trackingUrl && (
                    <a href={open.shipping.trackingUrl} target="_blank" rel="noopener noreferrer">
                      Track {open.shipping.trackingNumber || "the parcel"}
                    </a>
                  )}
                  {open.shipping?.labelUrl && (
                    <a href={open.shipping.labelUrl} target="_blank" rel="noopener noreferrer">
                      Open the label
                    </a>
                  )}
                  {open.shipping?.status === "unbought" && open.shipping.error && (
                    <span>{open.shipping.error}</span>
                  )}
                </section>
                <section
                  className={`order-card order-note${open.note ? "" : " is-empty"}`}
                >
                  <span className="eyebrow">Note</span>
                  <p>{open.note || "No note with this order."}</p>
                </section>
                <section className="order-card order-progress">
                  <span className="eyebrow">Progress</span>
                  <SelectMenu
                    label="Progress"
                    value={open.status}
                    disabled={saving}
                    onChange={(value) =>
                      void setStatus(open, value as OrderStatus)
                    }
                    options={stages.map((stage) => ({
                      value: stage.id,
                      label: stage.label,
                    }))}
                  />
                </section>
              </aside>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
