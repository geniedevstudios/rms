import { useRef, useState } from "react";
import type { CartItem } from "../../types/cart";
import { followupRequest } from "../checkout-followup/checkout-followup";
import { money } from "../../lib/format-currency";
import "./promotions.styles.css";

type Quote = { subtotal: number; discount: number; total: number; promoCode: string };
export function usePromoCode(items: CartItem[], subtotal: number) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<{ quote: Quote; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = JSON.stringify(items);
  const currentKey = useRef(key);
  currentKey.current = key;
  const request = useRef(0);
  const quote = applied?.key === key ? applied.quote : null;
  async function apply() {
    const id = ++request.current;
    if (!input.trim()) { setError("Enter a promo code."); return; }
    setBusy(true); setError("");
    try {
      const next: Quote = await followupRequest("/quote", { items, promoCode: input.trim() });
      if (id !== request.current || currentKey.current !== key) return;
      setApplied({ quote: next, key }); setInput(next.promoCode);
    } catch (reason) {
      if (id === request.current) { setApplied(null); setError((reason as Error).message); }
    } finally { if (id === request.current) setBusy(false); }
  }
  function remove() { request.current++; setApplied(null); setInput(""); setError(""); setBusy(false); }
  return { input, setInput, quote, busy, error, apply, remove, total: quote?.total ?? subtotal,
    changed: !!applied && applied.key !== key };
}

export function PromoCodeField({ promo, disabled }: { promo: ReturnType<typeof usePromoCode>; disabled: boolean }) {
  return <fieldset className="checkout-promo" disabled={disabled || promo.busy}>
    <label htmlFor="promo-code">Promo code</label>
    <div className="checkout-promo-entry"><input id="promo-code" autoComplete="off" maxLength={32} placeholder="Enter your code" value={promo.input}
      onChange={e => promo.setInput(e.target.value.toUpperCase())}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void promo.apply(); } }} />
      <button type="button" className="button dark" onClick={() => void promo.apply()}>{promo.busy ? "Checking…" : "Apply"}</button></div>
    {promo.quote && <p role="status">{promo.quote.promoCode} applied · You save {money(promo.quote.discount)}. <button type="button" className="text-link" onClick={promo.remove}>Remove</button></p>}
    {promo.changed && <p role="status">Your bag changed. Apply the code again to check the discount.</p>}
    {promo.error && <p className="form-error" role="alert">{promo.error}</p>}
  </fieldset>;
}
