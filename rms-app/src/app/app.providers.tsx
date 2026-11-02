import type { ReactNode } from "react";
import { CartProvider } from "../features/cart/cart.context";
import { WishlistProvider } from "../features/wishlist/wishlist.context";
import { OrdersProvider } from "../features/orders/orders.context";
import { DialogProvider } from "../components/dialogs/dialogs.context";
import { ToastProvider } from "../components/toast/toast.context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DialogProvider>
        <CartProvider>
          <WishlistProvider>
            <OrdersProvider>{children}</OrdersProvider>
          </WishlistProvider>
        </CartProvider>
      </DialogProvider>
    </ToastProvider>
  );
}
