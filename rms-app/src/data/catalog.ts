import { siteContent } from "../content/content";
import { customDesigns } from "./custom-designs";
import { products } from "./products";
import type { Product } from "../types/product";

export function findPiece(id: string): Product | undefined {
  return [...siteContent.products, ...siteContent.customDesigns].find(
    (piece) => piece.id === id && piece.status === "active",
  );
}

export const pieces: Product[] = [...products, ...customDesigns];
