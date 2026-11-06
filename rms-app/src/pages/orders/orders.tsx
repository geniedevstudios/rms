import "./orders.styles.css";
import { ArrowRight } from "lucide-react";
import { useOrders } from "../../features/orders/orders.context";
import { orderStage } from "../../features/orders/order-progress";
import { findPiece } from "../../data/catalog";
import { resolveColourway } from "../../data/size-guide";
import { pieceLine } from "../../features/products/colour";
import { money } from "../../lib/format-currency";
import { Link } from "../../routing/link";
import { useDialogs } from "../../components/dialogs/dialogs.context";

export function Orders() {
  const { orders } = useOrders();
  const { openDialog } = useDialogs();
  return (
    <section className="orders-page section">
      <div className="page-intro">
        <span className="eyebrow">YOUR RMS</span>
        <h1>Your orders</h1>
        <p>
          {orders.length
            ? "Every piece you have chosen is kept here."
            : "When you place an order, it will be here."}
        </p>
      </div>
      {orders.length ? (
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header>
                <div>
                  <span className="eyebrow">
                    {new Date(order.date).toLocaleDateString("en-GB")}
                  </span>
                  <h2>{order.id}</h2>
                </div>
                <div className="order-card-total">
                  <strong>{money(order.total)}</strong>
                  <span>{orderStage(order).label}</span>
                </div>
              </header>
              <div className="order-pieces">
                {order.items.map((item) => {
                  const piece = findPiece(item.productId);
                  const colourway = piece ? resolveColourway(piece, item.colourwayId) : null;
                  return (
                    <div
                      className="order-piece"
                      key={`${order.id}-${item.productId}-${item.colourwayId || ""}-${item.size}`}
                    >
                      {(item.image || colourway?.image || piece?.image) && (
                        <img src={item.image || colourway?.image || piece?.image} alt={piece?.name || ""} />
                      )}
                      <div>
                        <strong>{piece?.name ?? item.productId}</strong>
                        <span>
                          {pieceLine(item.color || colourway?.color, item.size, item.quantity)}
                        </span>
                      </div>
                      {piece && <span>{money(piece.price * item.quantity)}</span>}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => openDialog({ type: "order", orderId: order.id })}
              >
                View order <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Link to="/shop" className="button dark orders-empty">
          Explore the wardrobe <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
