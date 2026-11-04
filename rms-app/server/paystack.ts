import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";

type CartItem = { productId: string; size: string; quantity: number };
type CartModule = {
  isCart: (value: unknown) => value is CartItem[];
  cartSubtotal: (items: CartItem[]) => number;
};

const pending = new Map<string, { amount: number; email: string }>();

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const readJson = (req: IncomingMessage) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString() || "{}";
        const value = JSON.parse(text);
        resolve(value && typeof value === "object" ? value : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

async function initialize(
  secret: string,
  cart: CartModule,
  body: Record<string, unknown>,
  res: ServerResponse,
) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  const name = typeof body.name === "string" ? body.name.slice(0, 80) : "";
  const phone = typeof body.phone === "string" ? body.phone.slice(0, 30) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    send(res, 400, { error: "Enter a valid email address." });
    return;
  }
  if (!/^RMS-[A-Z0-9-]{8,40}$/.test(reference)) {
    send(res, 400, { error: "The order reference is not valid." });
    return;
  }
  if (!cart.isCart(body.items)) {
    send(res, 400, { error: "The bag could not be checked out." });
    return;
  }
  const cedis = cart.cartSubtotal(body.items);
  if (cedis <= 0) {
    send(res, 400, { error: "The bag is empty." });
    return;
  }
  const amount = Math.round(cedis * 100);
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: String(amount),
      currency: "GHS",
      reference,
      metadata: {
        custom_fields: [
          { display_name: "Customer", variable_name: "customer", value: name },
          { display_name: "Phone", variable_name: "phone", value: phone },
        ],
      },
    }),
  });
  const payload = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { access_code?: string };
  };
  if (!response.ok || !payload.status || !payload.data?.access_code) {
    send(res, 502, {
      error: payload.message || "Paystack could not start the payment.",
    });
    return;
  }
  pending.set(reference, { amount, email });
  send(res, 200, { accessCode: payload.data.access_code, reference });
}

async function verify(
  secret: string,
  body: Record<string, unknown>,
  res: ServerResponse,
) {
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  const expected = pending.get(reference);
  if (!expected) {
    send(res, 400, { error: "Start the payment again." });
    return;
  }
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const payload = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; currency?: string; amount?: number };
  };
  const data = payload.data;
  const confirmed =
    response.ok &&
    payload.status &&
    data?.status === "success" &&
    data.currency === "GHS" &&
    Number(data.amount) === expected.amount;
  if (!confirmed) {
    send(res, 402, { error: "The payment was not confirmed." });
    return;
  }
  pending.delete(reference);
  send(res, 200, {
    reference,
    email: expected.email,
    total: expected.amount / 100,
  });
}

export function paystackApi(secret: string, contentOrigin = "http://127.0.0.1:5175"): Plugin {
  const handle = async (
    server: ViteDevServer,
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url?.split("?")[0];
    if (url !== "/api/paystack/initialize" && url !== "/api/paystack/verify") {
      next();
      return;
    }
    if (!secret) {
      send(res, 503, { error: "Paystack is not configured." });
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "Method not allowed." });
      return;
    }
    try {
      const body = await readJson(req);
      if (url === "/api/paystack/initialize") {
        const content = await server.ssrLoadModule("/src/content/content.ts");
        await content.loadPublishedContent(contentOrigin, true);
      }
      const cart = (await server.ssrLoadModule(
        "/src/features/cart/cart.logic.ts",
      )) as CartModule;
      if (url === "/api/paystack/initialize") await initialize(secret, cart, body, res);
      else await verify(secret, body, res);
    } catch {
      if (!res.headersSent) {
        send(res, 500, { error: "The payment could not be completed." });
      }
    }
  };
  return {
    name: "rms-paystack",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(server, req, res, next);
      });
    },
  };
}
