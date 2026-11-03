import "./order-progress.styles.css";
import { orderStatuses, type Order, type OrderStatus } from "../../types/order";
import { findPiece } from "../../data/catalog";
import { money } from "../../lib/format-currency";

const stages: { id: OrderStatus; label: string; note: string }[] = [
  {
    id: "confirmed",
    label: "Payment confirmed",
    note: "Your payment has been received.",
  },
  {
    id: "preparing",
    label: "Preparing",
    note: "Your pieces are being prepared.",
  },
  {
    id: "courier",
    label: "With the courier",
    note: "Your order has been handed to the courier.",
  },
  {
    id: "delivered",
    label: "Delivered",
    note: "Your order has arrived.",
  },
];

export function orderStage(order: Order) {
  const status = order.status ?? (order.paid ? "confirmed" : undefined);
  return stages.find((stage) => stage.id === status) ?? stages[0];
}

export function OrderProgress({ order }: { order?: Order }) {
  if (!order) return <p className="order-progress-missing">This order could not be found.</p>;
  const current = orderStatuses.indexOf(orderStage(order).id);
  return (
    <div className="order-progress">
      <div className="order-progress-meta">
        <div>
          <span className="eyebrow">
            {new Date(order.date).toLocaleDateString("en-GB")}
          </span>
          <strong>{order.id}</strong>
        </div>
        <span>{money(order.total)}</span>
      </div>
      <div className="order-progress-pieces">
        {order.items.map((item) => {
          const piece = findPiece(item.productId);
          return (
            <div key={`${item.productId}-${item.size}`}>
              {piece && <img src={piece.image} alt="" />}
              <span>
                {piece?.name ?? item.productId}
                <small>
                  {item.size} / Qty {item.quantity}
                </small>
              </span>
            </div>
          );
        })}
      </div>
      <ol className="order-steps">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className={
              index < current ? "is-done" : index === current ? "is-current" : ""
            }
          >
            <span className="mark" />
            <div>
              <strong>{stage.label}</strong>
              {index === current && <p>{stage.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
