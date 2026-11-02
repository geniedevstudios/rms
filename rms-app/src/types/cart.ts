export type CartItem = { productId: string; size: string; quantity: number };
export type CartItemKey = Pick<CartItem, "productId" | "size">;
