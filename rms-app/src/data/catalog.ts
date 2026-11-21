import { siteContent } from "../content/content";
import { customDesigns } from "./custom-designs";
import { products } from "./products";
import type { Product } from "../types/product";

/** Finds a live piece by its handle, or by an earlier handle it has been renamed from. */
export function findPiece(id: string): Product | undefined {
  const live = [...siteContent.products, ...siteContent.customDesigns].filter(
    (piece) => piece.status === "active",
  );
  return (
    live.find((piece) => piece.id === id) ??
    live.find((piece) => piece.previousIds?.includes(id))
  );
}

/** The current handle for a stored one; unknown handles come back unchanged. */
export function canonicalPieceId(id: string): string {
  return findPiece(id)?.id ?? id;
}

export const pieces: Product[] = [...products, ...customDesigns];
