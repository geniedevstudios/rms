export type Dialog =
  | {
      type: "cart" | "menu" | "size-guide" | "film" | "copyright";
    }
  | {
      type: "search" | "wishlist" | "account";
      fromMenu?: boolean;
    }
  | { type: "quick-view"; productId: string }
  | { type: "order"; orderId: string }
  | { type: "help"; topic: string };
