import { customDesigns } from "./custom-designs";
import { products } from "./products";
import type { Product } from "../types/product";

export function findPiece(id: string): Product | undefined {
  return (
    products.find((product) => product.id === id) ??
    customDesigns.find((design) => design.id === id)
  );
}

export const pieces: Product[] = [...products, ...customDesigns];
