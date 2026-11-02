import { createContext, useContext, type ReactNode } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import type { CartItem, CartItemKey } from "../../types/cart";
import {
  addCartItem,
  changeCartQuantity,
  removeCartItem,
  cartCount,
  cartSubtotal,
  isCart,
} from "./cart.logic";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItemKey) => void;
  removeItem: (item: CartItemKey) => void;
  updateQuantity: (item: CartItemKey, delta: number) => void;
  clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = usePersistentState<CartItem[]>(
    "rms-bag",
    [],
    isCart,
  );
  const value: CartContextValue = {
    items,
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    addItem: (item) => setItems((current) => addCartItem(current, item)),
    removeItem: (item) => setItems((current) => removeCartItem(current, item)),
    updateQuantity: (item, delta) =>
      setItems((current) => changeCartQuantity(current, item, delta)),
    clearCart: () => setItems([]),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
