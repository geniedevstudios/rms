import "./header.styles.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRoute } from "../../routing/use-route";
import { useCart } from "../../features/cart/cart.context";
import { useWishlist } from "../../features/wishlist/wishlist.context";
import { useDialogs } from "../dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { products, shopCategories } from "../../data/products";
import { collections } from "../../data/collections";
import { productPath } from "../../routing/navigation";
import {
  ArrowRight,
  Menu,
  Search,
  Heart,
  UserRound,
  ShoppingBag,
} from "lucide-react";

function NavDrop({
  label,
  to,
  active,
  children,
}: {
  label: string;
  to: string;
  active?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>(undefined);
  const show = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = window.setTimeout(() => setOpen(false), 280);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div className="nav-drop" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        to={to}
        className={active ? "active" : ""}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
      </Link>
      <div
        className={`nav-panel${open ? " is-open" : ""}`}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
    </div>
  );
}
export function Header() {
  const route = useRoute();
  const [pathname, search = ""] = route.split("?");
  const params = new URLSearchParams(search);
  const { count } = useCart();
  const { saved } = useWishlist();
  const { openDialog } = useDialogs();
  const collectionPhotos = collections.slice(0, 2).flatMap((collection) => {
    const piece = products.find(
      (product) => product.id === collection.productIds[1],
    );
    return [
      {
        key: collection.id,
        to: "/collection",
        image: collection.image,
        label: collection.title.map((line) => line.text).join(" "),
      },
      ...(collections.length === 1 && piece
        ? [
            {
              key: piece.id,
              to: productPath(piece.id),
              image: piece.image,
              label: piece.name,
            },
          ]
        : []),
    ];
  });
  return (
    <>
      <div className="announcement">
        A new chapter. A wardrobe for becoming.{" "}
        <Link to="/shop">
          Discover the collection <ArrowRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <div className="header-main">
          <button
            className="icon-button mobile-menu"
            aria-label="Open menu"
            onClick={() => openDialog({ type: "menu" })}
          >
            <Menu />
          </button>
          <Link to="/" className="wordmark" aria-label="RIVERMINDSTYLE home">
            RIVERMINDSTYLE
          </Link>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Search"
              onClick={() => openDialog({ type: "search" })}
            >
              <Search />
            </button>
            <button
              className="icon-button desktop-action"
              aria-label={`Saved pieces (${saved.length})`}
              onClick={() => openDialog({ type: "wishlist" })}
            >
              <Heart />
              {saved.length > 0 && <span className="dot" />}
            </button>
            <button
              className="icon-button desktop-action"
              aria-label="Your account"
              onClick={() => openDialog({ type: "account" })}
            >
              <UserRound />
            </button>
            <button
              className="icon-button bag-button"
              aria-label={`Shopping bag (${count})`}
              onClick={() => openDialog({ type: "cart" })}
            >
              <ShoppingBag />
              <span>{count}</span>
            </button>
          </div>
        </div>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavDrop
            label="New arrivals"
            to="/shop?edit=new"
            active={params.get("edit") === "new"}
          >
            <div className="nav-panel-links">
              <span className="eyebrow">Just in</span>
              <Link to="/shop?edit=new">All new arrivals</Link>
              {products.slice(0, 4).map((product) => (
                <Link key={product.id} to={productPath(product.id)}>
                  {product.name}
                </Link>
              ))}
            </div>
            <div className="nav-panel-photos">
              {products.slice(0, 2).map((product) => (
                <Link key={product.id} to={productPath(product.id)}>
                  <img src={product.image} alt="" />
                  <span>{product.name}</span>
                </Link>
              ))}
            </div>
          </NavDrop>
          <NavDrop
            label="Shop"
            to="/shop"
            active={pathname === "/shop" && params.get("edit") !== "new"}
          >
            <div className="nav-panel-links">
              <span className="eyebrow">The wardrobe</span>
              <Link to="/shop">Shop all</Link>
              {shopCategories.map((category) => (
                <Link
                  key={category}
                  to={`/shop?category=${encodeURIComponent(category)}`}
                >
                  {category}
                </Link>
              ))}
            </div>
            <div className="nav-panel-photos">
              <Link to="/shop?category=Pants">
                <img src="/images/city.jpg" alt="" />
                <span>Pants</span>
              </Link>
              <Link to="/shop?category=Skirts">
                <img src="/images/hero.jpg" alt="" />
                <span>Skirts</span>
              </Link>
            </div>
          </NavDrop>
          <NavDrop
            label="Collections"
            to="/collection"
            active={pathname === "/collection"}
          >
            <div className="nav-panel-links">
              <span className="eyebrow">The collections</span>
              <Link to="/collection">All collections</Link>
              {collections.map((collection) => (
                <Link key={collection.id} to="/collection">
                  {collection.title.map((line) => line.text).join(" ")}
                </Link>
              ))}
            </div>
            <div className="nav-panel-photos">
              {collectionPhotos.map((photo) => (
                <Link key={photo.key} to={photo.to}>
                  <img src={photo.image} alt="" />
                  <span>{photo.label}</span>
                </Link>
              ))}
            </div>
          </NavDrop>
          <Link to="/custom" className={pathname === "/custom" ? "active" : ""}>
            Custom
          </Link>
          <Link to="/about">Our world</Link>
        </nav>
      </header>
    </>
  );
}
