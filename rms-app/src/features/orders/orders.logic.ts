import type { Order } from "../../types/order.ts";
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
        isCart(order.items),
    )
  );
}

/** A demo order snapshots the bag; contact and address fields never enter storage. */
export function createDemoOrder(
  items: CartItem[],
  id: string,
  date: string,
): Order | null {
  if (!items.length || !isCart(items)) return null;
  return {
    id,
    date,
    items: items.map((item) => ({ ...item })),
    total: cartSubtotal(items),
  };
}
