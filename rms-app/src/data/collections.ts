import { siteContent } from "../content/content";
import type { Collection } from "../shared/content.types";
export type { Collection };

function publishedCollections() {
  return siteContent.collections.filter((collection) => collection.status === "published");
}

export function collectionTitle(collection: Collection) {
  return collection.title
    .map((line) => line.text.trim())
    .filter(Boolean)
    .join(" ");
}

/** The published collection this piece belongs to. A piece listed in more than one shows the latest. */
export function collectionForProduct(productId: string) {
  return publishedCollections()
    .filter((collection) => collection.productIds.includes(productId))
    .at(-1);
}

export const collections: Collection[] = new Proxy([] as Collection[], {
  get(_target, property) {
    const list = publishedCollections();
    const value = Reflect.get(list, property, list);
    return typeof value === "function" ? value.bind(list) : value;
  },
});
