import { createContext, useContext, type ReactNode } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import type { Order } from "../../types/order";
import type { CartItem } from "../../types/cart";
import { createOrder, isOrders } from "./orders.logic";

type OrdersContextValue = {
  orders: Order[];
  placeOrder: (items: CartItem[], id: string, email: string) => Order | null;
};
const OrdersContext = createContext<OrdersContextValue | null>(null);
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = usePersistentState<Order[]>(
    "rms-orders",
    [],
    isOrders,
  );
  const placeOrder = (items: CartItem[], id: string, email: string) => {
    const order = createOrder(items, id, new Date().toISOString(), email);
    if (order) setOrders((current) => [order, ...current]);
    return order;
  };
  return (
    <OrdersContext.Provider value={{ orders, placeOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}
export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used inside OrdersProvider");
  return context;
}
