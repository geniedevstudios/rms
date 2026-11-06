import type { Product } from "../types/product";
import { siteContent } from "../content/content";

export const shopCategories = ["Pants", "Tops", "Two piece", "Skirts"] as const;

function activeProducts(): Product[] {
  return siteContent.products.filter((product) => product.status === "active");
}

/** Reads the published catalogue whenever it is used, including each piece's label. */
export const products: Product[] = new Proxy([] as Product[], {
  get(_target, property) {
    const list = activeProducts();
    const value = Reflect.get(list, property, list);
    return typeof value === "function" ? value.bind(list) : value;
  },
});

export { sizes } from "./size-guide";
