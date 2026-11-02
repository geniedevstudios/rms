import { createContext, useContext, type ReactNode } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import type { Order } from "../../types/order";
import type { CartItem } from "../../types/cart";
import { createDemoOrder, isOrders } from "./orders.logic";

type OrdersContextValue = {
  orders: Order[];
  placeDemoOrder: (items: CartItem[]) => Order | null;
};
const OrdersContext = createContext<OrdersContextValue | null>(null);
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = usePersistentState<Order[]>(
    "rms-orders",
    [],
    isOrders,
  );
  const placeDemoOrder = (items: CartItem[]) => {
    const order = createDemoOrder(
      items,
      `RMS-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      new Date().toISOString(),
    );
    if (order) setOrders((current) => [order, ...current]);
    return order;
  };
  return (
    <OrdersContext.Provider value={{ orders, placeDemoOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}
export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used inside OrdersProvider");
  return context;
}
