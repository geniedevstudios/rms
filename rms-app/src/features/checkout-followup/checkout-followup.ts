import { useEffect } from "react";
import type { CartItem } from "../../types/cart";
const key = "rms-checkout-followup";
export function checkoutToken() {
  let token = localStorage.getItem(key);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
      n.toString(16).padStart(2, "0"),
    ).join("");
    localStorage.setItem(key, token);
  }
  return token;
}
export async function followupRequest(path: string, data: unknown) {
  const response = await fetch("/api/cms/checkouts" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.error || "Checkout could not be saved. Please try again.",
    );
  return body;
}
export function saveCheckout(
  form: HTMLFormElement,
  items: CartItem[],
  reference?: string,
  promoCode = "",
) {
  clearTimeout(pendingDrafts.get(form));
  const data = new FormData(form);
  return followupRequest("", {
    token: checkoutToken(),
    email: String(data.get("email") || ""),
    name: `${data.get("given-name") || ""} ${data.get("family-name") || ""}`.trim(),
    phone: String(data.get("tel") || ""),
    address: {
      street: String(data.get("street-address") || ""),
      city: String(data.get("address-level2") || ""),
      country: String(data.get("country") || "Ghana"),
    },
    note: String(data.get("note") || ""),
    reminderConsent: data.get("reminderConsent") === "on",
    items,
    reference,
    promoCode,
  });
}
export function finishCheckoutFollowup() {
  localStorage.removeItem(key);
  localStorage.removeItem("rms-checkout-contact");
}
// Keep a known checkout current when its bag changes, including emptying it.
export function useCartFollowup(items: CartItem[]) {
  useEffect(() => {
    let lastSent = 0;
    const update = () => {
      if (Date.now() - lastSent < 60000) return;
      const activeToken = localStorage.getItem(key);
      const activeContact = localStorage.getItem("rms-checkout-contact");
      if (!activeToken || !activeContact) return;
      lastSent = Date.now();
      try {
        void followupRequest(
          "",
          items.length
            ? { ...JSON.parse(activeContact), token: activeToken, items }
            : { token: activeToken, cancel: true },
        ).catch(() => undefined);
      } catch {
        /* stale local draft */
      }
    };
    const timer = setTimeout(update, 1000);
    window.addEventListener("pointerdown", update, { passive: true });
    window.addEventListener("keydown", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", update);
      window.removeEventListener("keydown", update);
    };
  }, [items]);
}
const pendingDrafts = new WeakMap<
  HTMLFormElement,
  ReturnType<typeof setTimeout>
>();
export function rememberCheckout(form: HTMLFormElement, items: CartItem[]) {
  clearTimeout(pendingDrafts.get(form));
  pendingDrafts.set(
    form,
    setTimeout(() => recordDraft(form, items), 800),
  );
}
function recordDraft(form: HTMLFormElement, items: CartItem[]) {
  if (!form.isConnected) return;
  const email = form.querySelector<HTMLInputElement>('[name="email"]');
  if (!email?.value || !email.validity.valid || !items.length) return;
  const data = new FormData(form);
  // Only retain the minimum contact information needed for bag activity updates.
  const contact = {
    email: email.value,
    name: `${data.get("given-name") || ""} ${data.get("family-name") || ""}`.trim(),
    reminderConsent: data.get("reminderConsent") === "on",
  };
  localStorage.setItem("rms-checkout-contact", JSON.stringify(contact));
  void saveCheckout(form, items).catch(() => undefined);
}
