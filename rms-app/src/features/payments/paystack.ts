type PaystackPopup = {
  resumeTransaction: (
    accessCode: string,
    callbacks: {
      onSuccess?: (transaction: { reference: string }) => void;
      onCancel?: () => void;
      onError?: (error: { message: string }) => void;
      onLoad?: () => void;
    },
  ) => void;
};

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopup;
  }
}

const scriptSrc = "https://js.paystack.co/v2/inline.js";
let popup: PaystackPopup | null = null;

const coverCss = `
iframe[id^="inline-checkout-"] {
  opacity: 0 !important;
  background: transparent !important;
  color-scheme: dark !important;
  transition: opacity 0.18s ease;
}
iframe[id^="inline-checkout-"].is-ready {
  opacity: 1 !important;
}
iframe[id^="inline-background-"] {
  background: rgba(0, 0, 0, 0.75) !important;
  color-scheme: dark !important;
}
`;

function coverPaystackFlash() {
  if (document.getElementById("rms-paystack-cover")) return;
  const style = document.createElement("style");
  style.id = "rms-paystack-cover";
  style.textContent = coverCss;
  document.head.appendChild(style);
}

function checkoutFrames() {
  return document.querySelectorAll<HTMLIFrameElement>(
    "iframe[id^='inline-checkout-']",
  );
}

function hideCheckoutFrame() {
  checkoutFrames().forEach((frame) => frame.classList.remove("is-ready"));
}

function showCheckoutFrame() {
  checkoutFrames().forEach((frame) => frame.classList.add("is-ready"));
}

function loadPaystack() {
  if (window.PaystackPop) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.src = scriptSrc;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paystack could not be loaded."));
    if (!existing) document.head.appendChild(script);
  });
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "The payment could not be completed.");
  }
  return payload;
}

export function preparePaystack() {
  coverPaystackFlash();
  return loadPaystack().then(() => {
    if (!window.PaystackPop) throw new Error("Paystack could not be loaded.");
    popup ??= new window.PaystackPop();
  });
}

export function paymentReference() {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `RMS-${suffix}`;
}

export async function startPaystack(input: {
  email: string;
  name: string;
  phone: string;
  items: { productId: string; size: string; quantity: number }[];
  reference: string;
}) {
  const started = await post<{ accessCode: string; reference: string }>(
    "/api/paystack/initialize",
    input,
  );
  await preparePaystack();
  const accessCode = started.accessCode;
  const reference = started.reference;
  hideCheckoutFrame();
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    popup!.resumeTransaction(accessCode, {
      onLoad: showCheckoutFrame,
      onSuccess: (transaction) => {
        if (settled) return;
        settled = true;
        resolve(transaction.reference || reference);
      },
      onCancel: () => {
        if (settled) return;
        settled = true;
        reject(new Error("Payment cancelled."));
      },
      onError: (error) => {
        showCheckoutFrame();
        if (settled) return;
        settled = true;
        reject(new Error(error.message || "Paystack could not open."));
      },
    });
  });
}

export function verifyPaystack(reference: string) {
  return post<{ reference: string; email: string; total: number }>(
    "/api/paystack/verify",
    { reference },
  );
}
