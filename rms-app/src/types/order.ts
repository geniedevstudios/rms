import type { CartItem } from "./cart";

export const orderStatuses = [
  "confirmed",
  "preparing",
  "courier",
  "delivered",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  promoCode?: string;
  email?: string;
  paid?: boolean;
  status?: OrderStatus;
};
