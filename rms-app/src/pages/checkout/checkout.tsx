import {
  checkoutToken,
  saveCheckout,
  rememberCheckout,
  finishCheckoutFollowup,
  followupRequest,
} from "../../features/checkout-followup/checkout-followup";
import "./checkout.styles.css";
import { PromoCodeField, usePromoCode } from "../../features/promotions/promo-code";
import { useEffect, useRef, useState } from "react";
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
    void fetch("/api/cms/shipping/countries")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { countries?: { code: string; name: string }[] } | null) => {
        if (body?.countries?.length) setCountries(body.countries);
      })
      .catch(() => undefined);
  }, []);
  const { items: bag, subtotal, clearCart, restoreCart } = useCart();
  const promo = usePromoCode(bag, subtotal);
  const { placeOrder } = useOrders();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([
    { code: "GH", name: "Ghana" },
  ]);
  const [country, setCountry] = useState("GH");
  const [rates, setRates] = useState<
    { id: string; carrier: string; service: string; days: number | null; cedis: number }[]
  >([]);
  const [rateId, setRateId] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const abroad = country !== "GH";
  const selected = rates.find((rate) => rate.id === rateId) || null;
  const due =
    (Math.round(promo.total * 100) + Math.round((selected?.cedis || 0) * 100)) / 100;
  const formRef = useRef<HTMLFormElement>(null);
  const quoteTimer = useRef<number | undefined>(undefined);
  const pieceKey = bag.map((item) => `${item.productId}:${item.quantity}`).join("|");
  async function loadRates(form: HTMLFormElement, code: string) {
    const data = new FormData(form);
    const address = {
      street: String(data.get("street-address") || "").trim(),
      city: String(data.get("address-level2") || "").trim(),
      state: String(data.get("address-level1") || "").trim(),
      zip: String(data.get("postal-code") || "").trim(),
      country: code,
    };
    const name = `${data.get("given-name") || ""} ${data.get("family-name") || ""}`.trim();
    const phone = String(data.get("tel") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!address.street || !address.city || !address.zip || !name || !phone || !email) return;
    setQuoting(true);
    setShippingError("");
    setRates([]);
    setRateId("");
    try {
      const response = await fetch("/api/cms/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          address,
          pieces: bag.reduce((sum, item) => sum + item.quantity, 0),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Delivery prices could not be checked.");
      const next = Array.isArray(body.rates) ? body.rates : [];
      setRates(next);
      if (!next.length) setShippingError("No carrier can deliver to this address yet.");
    } catch (reason) {
      setShippingError(
        reason instanceof Error ? reason.message : "Delivery prices could not be checked.",
      );
    } finally {
      setQuoting(false);
    }
  }
  function scheduleRates(form: HTMLFormElement, code = country) {
    window.clearTimeout(quoteTimer.current);
    if (code === "GH") return;
    quoteTimer.current = window.setTimeout(() => void loadRates(form, code), 700);
  }
  useEffect(() => {
    if (!abroad || !formRef.current) return;
    scheduleRates(formRef.current, country);
  }, [pieceKey, abroad, country]);
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
      if (abroad && !rateId) throw new Error("Choose a delivery option.");
      const saved = await saveCheckout(form, items, reference, promo.quote?.promoCode, rateId);
      if (saved.total !== due)
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
          ref={formRef}
          onBlur={(event) => rememberCheckout(event.currentTarget, bag)}
          onChange={(event) => {
            rememberCheckout(event.currentTarget, bag);
            const code = String(new FormData(event.currentTarget).get("country") || country);
            scheduleRates(event.currentTarget, code);
          }}
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
                value={country}
                onChange={(value) => {
                  setCountry(value);
                  setRates([]);
                  setRateId("");
                  setShippingError("");
                }}
                options={countries.map((item) => ({ value: item.code, label: item.name }))}
              />
            </div>
          </div>
          {abroad && (
            <div className="form-row">
              <label>
                State or region
                <input name="address-level1" autoComplete="address-level1" required />
              </label>
              <label>
                Postal code
                <input name="postal-code" autoComplete="postal-code" required />
              </label>
            </div>
          )}
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
          {abroad ? (
            <div className="delivery-options">
              {rates.map((rate) => (
                <button
                  type="button"
                  key={rate.id}
                  className={`delivery-option${rate.id === rateId ? " is-selected" : ""}`}
                  onClick={() => setRateId(rate.id)}
                >
                  <span>
                    <strong>{rate.carrier}</strong>
                    <p>
                      {rate.service}
                      {rate.days ? ` · ${rate.days} day${rate.days === 1 ? "" : "s"}` : ""}
                    </p>
                  </span>
                  <strong>{money(rate.cedis)}</strong>
                </button>
              ))}
              {!rates.length && (
                <p className="delivery-status">
                  {quoting
                    ? "Checking DHL, UPS, and FedEx."
                    : shippingError || "Add the address to see delivery prices."}
                </p>
              )}
            </div>
          ) : (
            <div className="demo-delivery">
              <Check size={18} />
              <div>
                <strong>Delivery · Complimentary</strong>
                <p>Pay the order total with Paystack.</p>
              </div>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button dark full" disabled={paying || promo.busy || quoting || (abroad && !rateId)}>
            {paying ? "Waiting for Paystack" : `Pay ${money(due)}`}{" "}
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
              <span>
                {abroad
                  ? selected
                    ? `${selected.carrier} · ${money(selected.cedis)}`
                    : "Choose a carrier"
                  : "Complimentary"}
              </span>
            </div>
            <div className="checkout-total">
              <strong>Total</strong>
              <strong>{money(due)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
