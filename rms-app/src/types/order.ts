import type { CartItem } from "./cart";
export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
};
