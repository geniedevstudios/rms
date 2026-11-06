import {
  checkoutToken,
  saveCheckout,
  rememberCheckout,
  finishCheckoutFollowup,
  followupRequest,
} from "../../features/checkout-followup/checkout-followup";
import "./checkout.styles.css";
import { PromoCodeField, usePromoCode } from "../../features/promotions/promo-code";
import { useEffect, useState } from "react";
import { useCart } from "../../features/cart/cart.context";
import { useOrders } from "../../features/orders/orders.context";
import { go } from "../../routing/navigation";
import { Link } from "../../routing/link";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { findPiece } from "../../data/catalog";
import { resolveColourway } from "../../data/size-guide";
import { pieceLine } from "../../features/products/colour";
import { money } from "../../lib/format-currency";
import {
  paymentReference,
  preparePaystack,
  startPaystack,
  verifyPaystack,
} from "../../features/payments/paystack";
export function Checkout() {
  useEffect(() => {
    void preparePaystack().catch(() => undefined);
  }, []);
  const { items: bag, subtotal, clearCart, restoreCart } = useCart();
  const promo = usePromoCode(bag, subtotal);
  const { placeOrder } = useOrders();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(location.hash.split("?")[1] || "");
    const token = query.get("recovery");
    const stop = query.get("stopReminder");
    if (!token && !stop) return;
    if (stop) {
      setRecoveryNotice("Use the button below to stop cart reminders.");
      return;
    }
    let cancelled = false;
    void followupRequest("/recover", { token })
      .then((result) => {
        if (cancelled) return;
        restoreCart(
          result.items.filter((item: { productId: string }) =>
            findPiece(item.productId),
          ),
        );
        setRecoveryNotice(
          "Your saved bag is ready. Please check current prices and enter your contact details.",
        );
        history.replaceState(
          null,
          "",
          location.pathname + location.search + "#/checkout",
        );
      })
      .catch((reason) => {
        if (!cancelled) setRecoveryNotice(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const stopReminder = new URLSearchParams(
    location.hash.split("?")[1] || "",
  ).get("stopReminder");
  if (stopReminder)
    return (
      <section className="empty-page">
        <h1>Cart reminders</h1>
        <p>{recoveryNotice}</p>
        <button
          className="button dark"
          onClick={() => {
            void followupRequest("/stop", { token: stopReminder })
              .then(() =>
                setRecoveryNotice(
                  "Cart reminders have been stopped for your email.",
                ),
              )
              .catch((reason) => setRecoveryNotice(reason.message));
          }}
        >
          Stop cart reminders
        </button>
        <Link to="/shop">Return to the wardrobe</Link>
      </section>
    );
  const complete = async (form: HTMLFormElement) => {
    if (paying || promo.busy) return;
    const data = new FormData(form);
    const email = String(data.get("email") || "");
    const name =
      `${data.get("given-name") || ""} ${data.get("family-name") || ""}`.trim();
    const phone = String(data.get("tel") || "");
    const items = bag.map((item) => ({ ...item }));
    const reference = paymentReference();
    let paymentStarted = false;
    setPaying(true);
    setError("");
    try {
      const saved = await saveCheckout(form, items, reference, promo.quote?.promoCode);
      if (saved.total !== promo.total)
        throw new Error("The price has changed. Refresh your bag or reapply your promo code before paying.");
      paymentStarted = true;
      const paidReference = await startPaystack({
        email,
        name,
        phone,
        items,
        reference,
      });
      const confirmed = await verifyPaystack(paidReference);
      const order = placeOrder(items, confirmed.reference, confirmed.email, {
        total: confirmed.total, subtotal: confirmed.subtotal, discount: confirmed.discount, promoCode: confirmed.promoCode,
      });
      if (!order) throw new Error("The order could not be saved.");
      finishCheckoutFollowup();
      clearCart();
      go(`/confirmation/${order.id}`);
    } catch (reason) {
      if (paymentStarted) void followupRequest("/issue", {
        token: checkoutToken(),
        reference,
        reason: "interrupted",
      }).catch(() => undefined);
      setError(
        reason instanceof Error
          ? reason.message
          : "The payment could not be completed.",
      );
    } finally {
      setPaying(false);
    }
  };
  if (!bag.length)
    return (
      <div className="empty-page">
        <h1>Your next chapter awaits.</h1>
        <p>
          {recoveryNotice || "Add a piece to your bag to explore checkout."}
        </p>
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
          onBlur={(event) => rememberCheckout(event.currentTarget, bag)}
          onChange={(event) => rememberCheckout(event.currentTarget, bag)}
          onSubmit={(e) => {
            e.preventDefault();
            void complete(e.currentTarget);
          }}
        >
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
          <label className="checkout-reminder">
            <input type="checkbox" name="reminderConsent" /> Email me one
            reminder if I leave my bag unfinished for 24 hours.
          </label>
          {recoveryNotice && <p role="status">{recoveryNotice}</p>}
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
          <label>
            Note
            <textarea
              name="note"
              rows={4}
              maxLength={500}
              placeholder="Optional. A fit note, a delivery note, anything we should know."
            />
          </label>
          <h2>03 / Delivery & payment</h2>
          <div className="demo-delivery">
            <Check size={18} />
            <div>
              <strong>Delivery · Complimentary</strong>
              <p>Pay the order total with Paystack.</p>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button dark full" disabled={paying || promo.busy}>
            {paying ? "Waiting for Paystack" : `Pay ${money(promo.total)}`}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="checkout-summary">
          <h2>Your selection</h2>
          {bag.map((item) => {
            const p = findPiece(item.productId)!;
            const colourway = resolveColourway(p, item.colourwayId);
            return (
              <div key={`${p.id}-${item.colourwayId || ""}-${item.size}`} className="checkout-item">
                <img src={colourway?.image || p.image} alt={p.name} />
                <div>
                  <h3>{p.name}</h3>
                  <p>{pieceLine(item.color || colourway?.color, item.size, item.quantity)}</p>
                  <span>{money(p.price * item.quantity)}</span>
                </div>
              </div>
            );
          })}
          <PromoCodeField promo={promo} disabled={paying} />
          <div className="checkout-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(promo.quote?.subtotal ?? subtotal)}</span>
            </div>
            {promo.quote && <div><span>Discount · {promo.quote.promoCode}</span><span>−{money(promo.quote.discount)}</span></div>}
            <div>
              <span>Delivery</span>
              <span>Complimentary</span>
            </div>
            <div className="checkout-total">
              <strong>Total</strong>
              <strong>{money(promo.total)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
