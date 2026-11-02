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
        {order ? "YOUR DEMO ORDER IS COMPLETE" : "ORDER NOT FOUND"}
      </span>
      <h1>{order ? "A beautiful choice." : "Let’s find your next piece."}</h1>
      <p>
        {order
          ? "Thank you for exploring RivermindStyle. This is a preview confirmation; no payment was taken and nothing will be shipped."
          : "This sample order is not available in this browser."}
      </p>
      {order && (
        <div className="confirmation-details">
          <span>{order.id}</span>
          <strong>{money(order.total)}</strong>
          {order.items.map((item) => {
            const p = findPiece(item.productId)!;
            return (
              <div className="confirmation-item" key={`${p.id}-${item.size}`}>
                <span>
                  {p.name} · {item.size} × {item.quantity}
                </span>
                <span>{money(p.price * item.quantity)}</span>
              </div>
            );
          })}
        </div>
      )}
      <Link to="/shop" className="button dark">
        Continue exploring <ArrowRight size={16} />
      </Link>
    </section>
  );
}
