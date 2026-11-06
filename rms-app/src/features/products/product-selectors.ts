import { products } from "../../data/products.ts";
import { pieceColourways } from "../../data/size-guide";
import type { Product } from "../../types/product.ts";

function colourNames(product: Product) {
  return pieceColourways(product)
    .map((way) => way.color.trim())
    .filter(Boolean);
}

export type ProductFilters = {
  category: string;
  color: string;
  maxPrice: string;
  newEdit: boolean;
  sort: string;
};

export function filterProducts(
  filters: ProductFilters,
  catalog: Product[] = products,
): Product[] {
  const list = (
    filters.newEdit ? catalog.filter((product) => product.newArrival) : catalog
  ).filter(
    (product) =>
      (filters.category === "All pieces" ||
        product.category === filters.category) &&
      (filters.color === "All colours" || colourNames(product).includes(filters.color)) &&
      (filters.maxPrice === "all" || product.price <= Number(filters.maxPrice)),
  );
  if (filters.sort === "low") list.sort((a, b) => a.price - b.price);
  if (filters.sort === "high") list.sort((a, b) => b.price - a.price);
  return list;
}

export function searchProducts(
  query: string,
  catalog: Product[] = products,
): Product[] {
  const term = query.trim().toLowerCase();
  return catalog.filter((product) =>
    `${product.name} ${product.category} ${colourNames(product).join(" ")}`
      .toLowerCase()
      .includes(term),
  );
}
