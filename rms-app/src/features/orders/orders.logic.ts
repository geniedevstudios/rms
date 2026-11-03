import { orderStatuses, type Order } from "../../types/order.ts";
import type { CartItem } from "../../types/cart.ts";
import { cartSubtotal, isCart } from "../cart/cart.logic.ts";

export function isOrders(value: unknown): value is Order[] {
  return (
    Array.isArray(value) &&
    value.every(
      (order) =>
        order &&
        typeof order === "object" &&
        typeof order.id === "string" &&
        typeof order.date === "string" &&
        Number.isFinite(Date.parse(order.date)) &&
        Number.isFinite(order.total) &&
        order.total >= 0 &&
        isCart(order.items) &&
        (order.email === undefined || typeof order.email === "string") &&
        (order.paid === undefined || typeof order.paid === "boolean") &&
        (order.status === undefined ||
          orderStatuses.some((status) => status === order.status)),
    )
  );
}

/** The order snapshots the paid bag. The street address stays out of browser storage. */
export function createOrder(
  items: CartItem[],
  id: string,
  date: string,
  email?: string,
): Order | null {
  if (!items.length || !isCart(items)) return null;
  return {
    id,
    date,
    email,
    paid: true,
    status: "confirmed",
    items: items.map((item) => ({ ...item })),
    total: cartSubtotal(items),
  };
}
