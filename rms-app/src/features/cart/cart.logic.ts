import { findPiece } from "../../data/catalog.ts";
import { sizes } from "../../data/products.ts";
import type { CartItem, CartItemKey } from "../../types/cart.ts";

export const MAX_ITEM_QUANTITY = 10;
export const cartItemKey = (item: CartItemKey) =>
  `${item.productId}:${item.size}`;
const matches = (item: CartItemKey, target: CartItemKey) =>
  cartItemKey(item) === cartItemKey(target);

export function isCartItemKey(item: CartItemKey): boolean {
  return (
    Boolean(findPiece(item.productId)) &&
    sizes.includes(item.size)
  );
}

export function addCartItem(items: CartItem[], item: CartItemKey): CartItem[] {
  if (!isCartItemKey(item)) return items;
  const existing = items.find((current) => matches(current, item));
  if (existing?.quantity === MAX_ITEM_QUANTITY) return items;
  return existing
    ? items.map((current) =>
        matches(current, item)
          ? { ...current, quantity: current.quantity + 1 }
          : current,
      )
    : [...items, { ...item, quantity: 1 }];
}

export function removeCartItem(
  items: CartItem[],
  item: CartItemKey,
): CartItem[] {
  return items.filter((current) => !matches(current, item));
}

export function changeCartQuantity(
  items: CartItem[],
  item: CartItemKey,
  delta: number,
): CartItem[] {
  if (!Number.isInteger(delta)) return items;
  return items
    .map((current) =>
      matches(current, item)
        ? {
            ...current,
            quantity: Math.min(MAX_ITEM_QUANTITY, current.quantity + delta),
          }
        : current,
    )
    .filter((current) => current.quantity > 0);
}

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => {
    const product = findPiece(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

export function isCart(value: unknown): value is CartItem[] {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !isCartItemKey(item) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_ITEM_QUANTITY
    )
      return false;
    const key = cartItemKey(item);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}
