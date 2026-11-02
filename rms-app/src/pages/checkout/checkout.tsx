import "./checkout.styles.css";
import { useCart } from "../../features/cart/cart.context";
import { useOrders } from "../../features/orders/orders.context";
import { go } from "../../routing/navigation";
import { Link } from "../../routing/link";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { findPiece } from "../../data/catalog";
import { money } from "../../lib/format-currency";
export function Checkout() {
  const { items: bag, subtotal, clearCart } = useCart();
  const { placeDemoOrder } = useOrders();
  const complete = () => {
    const order = placeDemoOrder(bag);
    if (!order) return;
    clearCart();
    go(`/confirmation/${order.id}`);
  };
  if (!bag.length)
    return (
      <div className="empty-page">
        <h1>Your next chapter awaits.</h1>
        <p>Add a piece to your bag to explore checkout.</p>
        <Link to="/shop" className="button dark">
          Explore the wardrobe <ArrowRight size={16} />
        </Link>
      </div>
    );
  return (
    <section className="checkout section">
      <Link to="/shop" className="text-link">
        <ArrowLeft size={15} /> Continue shopping
      </Link>
      <div className="page-intro">
        <span className="eyebrow">ONE STEP CLOSER</span>
        <h1>Make it yours.</h1>
      </div>
      <div className="checkout-layout">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            complete();
          }}
        >
          <div className="demo-banner">
            <span>PREVIEW CHECKOUT</span>
            <p>
              Try the experience with sample details. No payment is collected
              and no order is sent. Your contact and address details are not
              saved.
            </p>
          </div>
          <h2>01 / Contact</h2>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <h2>02 / Delivery details</h2>
          <div className="form-row">
            <label>
              First name
              <input name="given-name" autoComplete="given-name" required />
            </label>
            <label>
              Last name
              <input name="family-name" autoComplete="family-name" required />
            </label>
          </div>
          <label>
            Street address
            <input
              name="street-address"
              autoComplete="street-address"
              required
            />
          </label>
          <div className="form-row">
            <label>
              City
              <input
                name="address-level2"
                autoComplete="address-level2"
                required
              />
            </label>
            <div className="field">
              <label htmlFor="checkout-country">Country</label>
              <SelectMenu
                id="checkout-country"
                name="country"
                label="Country"
                autoComplete="country-name"
                defaultValue="Ghana"
                options={[{ value: "Ghana", label: "Ghana" }]}
              />
            </div>
          </div>
          <label>
            Phone number
            <input
              name="tel"
              type="tel"
              autoComplete="tel"
              required
              minLength={7}
              placeholder="+233"
            />
          </label>
          <h2>03 / Delivery & payment</h2>
          <div className="demo-delivery">
            <Check size={18} />
            <div>
              <strong>Sample delivery · Complimentary</strong>
              <p>
                Delivery fees and payment methods will be available at launch.
              </p>
            </div>
          </div>
          <button type="submit" className="button dark full">
            Place demo order <ArrowRight size={17} />
          </button>
          <p className="demo-caption">
            This creates a sample order in this browser only.
          </p>
        </form>
        <aside className="checkout-summary">
          <h2>Your selection</h2>
          {bag.map((item) => {
            const p = findPiece(item.productId)!;
            return (
              <div key={`${p.id}-${item.size}`} className="checkout-item">
                <img src={p.image} alt={p.name} />
                <div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.color} / {item.size} / Qty {item.quantity}
                  </p>
                  <span>{money(p.price * item.quantity)}</span>
                </div>
              </div>
            );
          })}
          <div className="checkout-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div>
              <span>Demo delivery</span>
              <span>Complimentary</span>
            </div>
            <div className="checkout-total">
              <strong>Total</strong>
              <strong>{money(subtotal)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
