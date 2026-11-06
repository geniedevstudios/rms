import { findPiece } from "../../data/catalog.ts";
import { sizes } from "../../data/products.ts";
import { isSizeAvailable, pieceColourways, resolveColourway } from "../../data/size-guide";
import { quantityCap } from "../../../../rms-admin/shared/stock.mjs";
import type { CartItem, CartItemKey } from "../../types/cart.ts";

export const MAX_ITEM_QUANTITY = 10;
export const cartItemKey = (item: CartItemKey) => {
  const piece = findPiece(item.productId);
  const lead = piece ? pieceColourways(piece)[0]?.id ?? "" : "";
  return `${item.productId}:${item.colourwayId || lead}:${item.size}`;
};
const matches = (item: CartItemKey, target: CartItemKey) =>
  cartItemKey(item) === cartItemKey(target);

export function isCartItemKey(item: CartItemKey): boolean {
  const piece = findPiece(item.productId);
  return (
    Boolean(piece) &&
    // Keep older XS bags and order history readable; new selections use the current chart.
    (sizes.includes(item.size) || item.size === "XS") &&
    (!item.colourwayId || Boolean(resolveColourway(piece, item.colourwayId)))
  );
}

export function addCartItem(items: CartItem[], item: CartItemKey): CartItem[] {
  const piece = findPiece(item.productId);
  const colourway = piece ? resolveColourway(piece, item.colourwayId) : null;
  if (!isCartItemKey(item) || !piece || !colourway || !isSizeAvailable(colourway, item.size)) return items;
  const line = { ...item, colourwayId: colourway.id };
  const existing = items.find((current) => matches(current, line));
  const cap = quantityCap(colourway, item.size, MAX_ITEM_QUANTITY);
  if ((existing?.quantity ?? 0) >= cap) return items;
  return existing
    ? items.map((current) =>
        matches(current, line)
          ? { ...current, quantity: current.quantity + 1, colourwayId: colourway.id }
          : current,
      )
    : [...items, { ...line, quantity: 1 }];
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
            quantity: Math.min(
              quantityCap(
                resolveColourway(findPiece(current.productId), current.colourwayId),
                current.size,
                MAX_ITEM_QUANTITY,
              ),
              current.quantity + delta,
            ),
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
