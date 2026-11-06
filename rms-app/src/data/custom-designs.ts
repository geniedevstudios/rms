import type { Product } from "../types/product";
import { siteContent } from "../content/content";
export type CustomDesign = Product & { leadDays: number };
export const consultationFee = 300;

function activeDesigns(): CustomDesign[] {
  return siteContent.customDesigns
    .filter((design) => design.status === "active")
    .map((design) => ({ ...design, leadDays: design.leadDays || 21 }));
}

export const customDesigns: CustomDesign[] = new Proxy([] as CustomDesign[], {
  get(_target, property) {
    const list = activeDesigns();
    const value = Reflect.get(list, property, list);
    return typeof value === "function" ? value.bind(list) : value;
  },
});
