import { useCartFollowup } from "../checkout-followup/checkout-followup";
import { useAccount } from "../account/account.context";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
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
  restoreCart: (items: CartItem[]) => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { customer, ready } = useAccount();
  const [items, setItems] = usePersistentState<CartItem[]>(
    "rms-bag",
    [],
    isCart,
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const synced = useRef("");
  useEffect(() => {
    if (!ready || !customer) {
      synced.current = "";
      return;
    }
    let stop = false;
    const email = customer.email;
    (async () => {
      const response = await fetch("/api/cms/account/cart");
      const body = await response.json();
      if (stop || !response.ok) return;
      if (isCart(body.items) && body.items.length) setItems(body.items);
      else if (itemsRef.current.length) {
        await fetch("/api/cms/account/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsRef.current }),
        });
      }
      if (!stop) synced.current = email;
    })();
    return () => {
      stop = true;
    };
  }, [ready, customer, setItems]);
  useEffect(() => {
    if (!customer || synced.current !== customer.email) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/cms/account/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [items, customer]);
  useCartFollowup(items);
  const value: CartContextValue = {
    items,
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    addItem: (item) => setItems((current) => addCartItem(current, item)),
    removeItem: (item) => setItems((current) => removeCartItem(current, item)),
    updateQuantity: (item, delta) =>
      setItems((current) => changeCartQuantity(current, item, delta)),
    clearCart: () => setItems([]),
    restoreCart: (next) => { if (isCart(next)) setItems(next); },
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
