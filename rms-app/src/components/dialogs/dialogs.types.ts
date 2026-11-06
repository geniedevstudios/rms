export type Dialog =
  | {
      type: "cart" | "menu" | "film" | "copyright";
    }
  | {
      type: "search" | "wishlist" | "account";
      fromMenu?: boolean;
    }
  | { type: "quick-view"; productId: string }
  | { type: "size-guide"; fromProductId?: string }
  | { type: "order"; orderId: string }
  | { type: "help"; topic: string };
