export type CartItem = {
  productId: string;
  size: string;
  quantity: number;
  colourwayId?: string;
  color?: string;
  image?: string;
};
export type CartItemKey = Pick<CartItem, "productId" | "size" | "colourwayId">;
