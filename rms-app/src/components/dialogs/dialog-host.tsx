import { type ReactNode } from "react";
import { products } from "../../data/products";
import { useCart } from "../../features/cart/cart.context";
import { useOrders } from "../../features/orders/orders.context";
import { OrderProgress } from "../../features/orders/order-progress";
import { Cart } from "../../features/cart/cart";
import { Wishlist } from "../../features/wishlist/wishlist";
import { SearchPanel } from "../../features/search/search";
import { Account } from "../../features/account/account";
import { Help } from "../../features/client-care/client-care";
import { Film } from "../../features/film/film";
import { SizeGuide } from "../../features/products/size-guide/size-guide";
import { QuickView } from "../../features/products/quick-view/quick-view";
import { MobileMenu } from "../mobile-menu/mobile-menu";
import { CopyrightNotice } from "../footer/copyright-notice";
import { Overlay } from "../overlay/overlay";
import { useDialogs } from "./dialogs.context";

/** The only place that mounts dialogs; feature logic lives with each feature. */
export function DialogHost() {
  const { dialog, openDialog, dismissDialog } = useDialogs();
  const { count } = useCart();
  const { orders } = useOrders();
  if (!dialog) return null;
  const fromMenu =
    (dialog.type === "search" ||
      dialog.type === "wishlist" ||
      dialog.type === "account") &&
    !!dialog.fromMenu;
  let title = "";
  let content: ReactNode = null;
  switch (dialog.type) {
    case "cart":
      title = `Your bag (${count})`;
      content = <Cart />;
      break;
    case "wishlist":
      title = "Saved pieces";
      content = <Wishlist />;
      break;
    case "search":
      title = "Find your next piece";
      content = <SearchPanel />;
      break;
    case "account":
      title = "Your RMS";
      content = <Account />;
      break;
    case "menu":
      title = "RIVERMINDSTYLE";
      content = <MobileMenu />;
      break;
    case "size-guide":
      title = "Find your fit";
      content = <SizeGuide />;
      break;
    case "film":
      title = "An atelier study";
      content = <Film />;
      break;
    case "help":
      title = dialog.topic;
      content = <Help topic={dialog.topic} />;
      break;
    case "copyright":
      title = "Copyright Notice";
      content = <CopyrightNotice />;
      break;
    case "order": {
      const order = orders.find((item) => item.id === dialog.orderId);
      title = "Order progress";
      content = <OrderProgress order={order} />;
      break;
    }
    case "quick-view": {
      const product = products.find(
        (product) => product.id === dialog.productId,
      );
      title = product ? "A closer look" : "Piece unavailable";
      content = product ? (
        <QuickView key={product.id} product={product} />
      ) : (
        <p>This piece is no longer available.</p>
      );
      break;
    }
  }
  const sheet =
    dialog.type === "cart" ||
    dialog.type === "search" ||
    dialog.type === "wishlist" ||
    dialog.type === "account";
  return (
    <>
      {(dialog.type === "menu" || fromMenu) && (
        <Overlay
          key="menu"
          title="RIVERMINDSTYLE"
          onClose={() => dismissDialog()}
          brand
          menu
          covered={fromMenu}
        >
          <MobileMenu />
        </Overlay>
      )}
      {dialog.type !== "menu" && (
        <Overlay
          key={dialog.type}
          title={title}
          onClose={(hash) => {
            if (!hash && fromMenu) {
              openDialog({ type: "menu" });
              return;
            }
            dismissDialog();
          }}
          wide={dialog.type === "film" || dialog.type === "quick-view"}
          popup={dialog.type === "copyright" || dialog.type === "order"}
          sheet={sheet}
        >
          {content}
        </Overlay>
      )}
    </>
  );
}
