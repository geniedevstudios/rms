import { canonicalPieceId, findPiece } from "../../data/catalog.ts";

/** Swaps handles of renamed pieces for their current ones, dropping duplicates. */
export function moveWishlistIds(ids: string[]): string[] {
  const moved = ids.map(canonicalPieceId);
  return moved.every((id, index) => id === ids[index]) ? ids : [...new Set(moved)];
}

export function isWishlist(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    new Set(value).size === value.length &&
    value.every(
      (id) =>
        typeof id === "string" && Boolean(findPiece(id)),
    )
  );
}
export function toggleWishlistItem(items: string[], id: string): string[] {
  if (!findPiece(id)) return items;
  return items.includes(id)
    ? items.filter((item) => item !== id)
    : [...items, id];
}
