import { useEffect, useLayoutEffect, useRef } from "react";
import { showRouteIntro } from "../intro";
import { ArrowRight } from "lucide-react";
import { useRoute } from "../routing/use-route";
import { Link } from "../routing/link";
import { customPath, productPath } from "../routing/navigation";
import { products } from "../data/products";
import { customDesigns } from "../data/custom-designs";
import { useOrders } from "../features/orders/orders.context";
import { Home } from "../pages/home/home";
import { Shop } from "../pages/shop/shop";
import { ProductPage } from "../pages/product/product";
import { Checkout } from "../pages/checkout/checkout";
import { Confirmation } from "../pages/confirmation/confirmation";
import { readAppointment } from "../pages/confirmation/appointment";
import { Orders } from "../pages/orders/orders";
import { Collection } from "../pages/collection/collection";
import { Custom } from "../pages/custom/custom";
import { CustomDesignPage } from "../pages/custom/custom-design";
import { About } from "../pages/about/about";
import { Journal } from "../pages/journal/journal";
import { Contact, Delivery, Privacy, Terms } from "../pages/legal/legal";
import { AccountPage } from "../pages/account/account-page";
import { SavedPage } from "../pages/saved/saved-page";

export function AppRoutes() {
  const route = useRoute();
  const previousRoute = useRef(route);
  useLayoutEffect(() => {
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    showRouteIntro();
  }, [route]);
  const [pathname, search = ""] = route.split("?");
  const params = new URLSearchParams(search);
  const product = products.find(
    (product) => pathname === productPath(product.id),
  );
  const customDesign = customDesigns.find(
    (design) => pathname === customPath(design.id),
  );
  const { orders } = useOrders();
  useEffect(() => {
    const pageTitle =
      product?.name ||
      customDesign?.name ||
      (pathname === "/shop"
        ? "The wardrobe"
        : pathname === "/about"
          ? "Our world"
          : pathname.startsWith("/collection")
            ? "Collections"
            : pathname === "/custom"
              ? "Custom"
              : pathname.startsWith("/journal")
              ? "The journal"
              : pathname === "/privacy"
                ? "Privacy"
                : pathname === "/terms"
                  ? "Terms"
                  : pathname === "/contact"
                    ? "Contact"
                    : pathname === "/delivery"
                      ? "Delivery & returns"
                      : pathname === "/account"
                        ? "Your account"
                        : pathname === "/saved"
                          ? "Saved pieces"
              : pathname === "/checkout"
                ? "Checkout"
                : pathname === "/orders"
                  ? "Your orders"
                  : pathname.startsWith("/confirmation/CST-")
                    ? "Appointment"
                    : pathname.startsWith("/confirmation/")
                      ? "Order confirmation"
                  : "A wardrobe for becoming");
    document.title = `RIVERMINDSTYLE — ${pageTitle}`;
  }, [pathname, product, customDesign]);

  if (pathname === "/") return <Home />;
  if (pathname === "/shop")
    return (
      <Shop
        key={search}
        category={params.get("category") || "All pieces"}
        newEdit={params.get("edit") === "new"}
      />
    );
  if (product) return <ProductPage key={product.id} product={product} />;
  if (pathname === "/checkout") return <Checkout />;
  if (pathname === "/orders") return <Orders />;
  if (pathname.startsWith("/confirmation/")) {
    const id = decodeURIComponent(pathname.slice("/confirmation/".length));
    if (id.startsWith("CST-"))
      return <Confirmation appointment={readAppointment(id)} />;
    return (
      <Confirmation
        order={orders.find((order) => pathname === `/confirmation/${order.id}`)}
      />
    );
  }
  if (pathname === "/collection") return <Collection />;
  if (pathname.startsWith("/collection/")) return <Collection id={pathname.slice("/collection/".length)} />;
  if (pathname === "/custom") return <Custom />;
  if (customDesign)
    return <CustomDesignPage key={customDesign.id} design={customDesign} />;
  if (pathname === "/about") return <About />;
  if (pathname === "/journal" || pathname.startsWith("/journal/"))
    return <Journal pathname={pathname} />;
  if (pathname === "/privacy") return <Privacy />;
  if (pathname === "/terms") return <Terms />;
  if (pathname === "/contact") return <Contact />;
  if (pathname === "/delivery") return <Delivery />;
  if (pathname === "/account") return <AccountPage />;
  if (pathname === "/saved") return <SavedPage />;
  return (
    <div className="empty-page">
      <span className="eyebrow">A DIFFERENT DIRECTION</span>
      <h1>This page has moved.</h1>
      <Link to="/" className="button dark">
        Return home <ArrowRight size={16} />
      </Link>
    </div>
  );
}
