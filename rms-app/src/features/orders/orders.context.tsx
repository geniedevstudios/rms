import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import type { Order, OrderStatus } from "../../types/order";
import { orderStatuses } from "../../types/order";
import type { CartItem } from "../../types/cart";
import { createOrder, isOrders } from "./orders.logic";

type OrdersContextValue = {
  orders: Order[];
  placeOrder: (items: CartItem[], id: string, email: string, payment?: Pick<Order, "total" | "subtotal" | "discount" | "promoCode">) => Order | null;
};
const OrdersContext = createContext<OrdersContextValue | null>(null);
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = usePersistentState<Order[]>(
    "rms-orders",
    [],
    isOrders,
  );
  const placeOrder: OrdersContextValue["placeOrder"] = (items, id, email, payment) => {
    const order = createOrder(items, id, new Date().toISOString(), email);
    if (order && payment) Object.assign(order, payment);
    if (order) setOrders((current) => [order, ...current]);
    return order;
  };
  const known = orders.map((order) => `${order.id}:${order.status ?? ""}`).join("|");
  useEffect(() => {
    if (!known) return;
    let cancel = false;
    void fetch("/api/cms/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: known.split("|").map((entry) => entry.split(":")[0]) }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((rows: { id: string; status: OrderStatus }[] | null) => {
        if (!rows || cancel) return;
        setOrders((current) => {
          let changed = false;
          const next = current.map((order) => {
            const match = rows.find((row) => row.id === order.id);
            if (
              !match ||
              match.status === order.status ||
              !orderStatuses.some((status) => status === match.status)
            )
              return order;
            changed = true;
            return { ...order, status: match.status };
          });
          return changed ? next : current;
        });
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [known, setOrders]);
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
