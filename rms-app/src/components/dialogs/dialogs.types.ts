export type Dialog =
  | {
      type: "cart" | "menu" | "copyright";
    }
  | { type: "film"; place?: "home" | "about" }
  | {
      type: "search" | "wishlist" | "account";
      fromMenu?: boolean;
    }
  | { type: "quick-view"; productId: string }
  | { type: "size-guide"; fromProductId?: string }
  | { type: "care-guide" }
  | { type: "order"; orderId: string }
  | { type: "help"; topic: string };
