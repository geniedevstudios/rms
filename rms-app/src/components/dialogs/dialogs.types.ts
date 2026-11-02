export type Dialog =
  | {
      type:
        | "cart"
        | "wishlist"
        | "search"
        | "account"
        | "menu"
        | "size-guide"
        | "film"
        | "copyright";
    }
  | { type: "quick-view"; productId: string }
  | { type: "help"; topic: string };
