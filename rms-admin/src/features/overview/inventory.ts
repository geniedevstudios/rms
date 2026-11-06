import type { Product } from "../../../shared/content.types";
import { attentionSizes } from "../../../shared/stock.mjs";

export type InventoryNoticeItem = {
  product: Product;
  sizes: { size: string; made: number; left: number; color: string }[];
};

export function inventoryNotices(products: Product[]): InventoryNoticeItem[] {
  return products
    .filter((product) => product.status === "active")
    .map((product) => ({ product, sizes: attentionSizes(product) }))
    .filter((notice) => notice.sizes.length > 0)
    .sort(
      (a, b) =>
        a.sizes[0].left - b.sizes[0].left ||
        a.product.name.localeCompare(b.product.name),
    );
}

export function inventoryNote(entry: { made: number; left: number }) {
  if (entry.left === 0) return `None of ${entry.made} left`;
  return `${entry.left} of ${entry.made} left`;
}
