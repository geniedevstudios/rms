import { siteContent } from "../content/content";
import type { Collection } from "../../../rms-admin/shared/content.types";
export type { Collection };

function publishedCollections() {
  return siteContent.collections.filter((collection) => collection.status === "published");
}

export const collections: Collection[] = new Proxy([] as Collection[], {
  get(_target, property) {
    const list = publishedCollections();
    const value = Reflect.get(list, property, list);
    return typeof value === "function" ? value.bind(list) : value;
  },
});
