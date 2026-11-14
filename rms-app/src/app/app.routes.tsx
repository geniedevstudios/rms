import { useEffect, useLayoutEffect, useRef } from "react";
import { showRouteIntro } from "../intro";
import { ArrowRight } from "lucide-react";
import { useRoute } from "../routing/use-route";
import { Link } from "../routing/link";
import { customPath, productPath } from "../routing/navigation";
import { siteContent } from "../content/content";
import { collections, collectionTitle } from "../data/collections";
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

const pageTitles = new Map([
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/collection", "Collections"],
  ["/custom", "Custom"],
  ["/about", "Our World"],
  ["/journal", "Journal"],
  ["/checkout", "Checkout"],
  ["/orders", "Your Orders"],
  ["/privacy", "Privacy Policy"],
  ["/terms", "Terms & Conditions"],
  ["/contact", "Contact"],
  ["/delivery", "Delivery & Returns"],
  ["/account", "Your Account"],
  ["/saved", "Saved Pieces"],
]);

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
  const collection = pathname.startsWith("/collection/")
    ? collections.find((item) => pathname === `/collection/${item.id}`)
    : undefined;
  const story = pathname.startsWith("/journal/")
    ? siteContent.journals.find(
        (item) => item.status === "published" && pathname === `/journal/${item.id}`,
      )
    : undefined;
  const pageTitle =
    product?.name ||
    customDesign?.name ||
    (collection && collectionTitle(collection)) ||
    story?.title ||
    pageTitles.get(pathname) ||
    (pathname.startsWith("/confirmation/CST-")
      ? "Appointment Confirmation"
      : pathname.startsWith("/confirmation/")
        ? "Order Confirmation"
        : "Page Not Found");

  useEffect(() => {
    document.title = `${pageTitle} | RIVERMINDSTYLE`;
  }, [pageTitle]);

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
