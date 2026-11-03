import "./confirmation.styles.css";
import { type Order } from "../../types/order";
import { Check, ArrowRight } from "lucide-react";
import { money } from "../../lib/format-currency";
import { findPiece } from "../../data/catalog";
import { Link } from "../../routing/link";
export function Confirmation({ order }: { order?: Order }) {
  return (
    <section className="confirmation section">
      <div className="confirmation-icon">
        <Check size={26} />
      </div>
      <span className="eyebrow">
        {order ? "YOUR ORDER IS CONFIRMED" : "ORDER NOT FOUND"}
      </span>
      <h1>{order ? "A beautiful choice." : "Let’s find your next piece."}</h1>
      <p>
        {order
          ? "Thank you. Your payment is confirmed."
          : "This order could not be found."}
      </p>
      {order && (
        <div className="confirmation-details">
          <span>{order.id}</span>
          <strong>{money(order.total)}</strong>
          {order.items.map((item) => {
            const p = findPiece(item.productId)!;
            return (
              <div className="confirmation-item" key={`${p.id}-${item.size}`}>
                <img src={p.image} alt={p.name} />
                <div>
                  <strong>{p.name}</strong>
                  <span>
                    {p.color} / {item.size} / Qty {item.quantity}
                  </span>
                </div>
                <span>{money(p.price * item.quantity)}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="confirmation-actions">
        {order && (
          <Link to="/orders" className="text-link">
            Your orders
          </Link>
        )}
        <Link to="/shop" className="button dark">
          Continue exploring <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
