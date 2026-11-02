import "./header.styles.css";
import { useRoute } from "../../routing/use-route";
import { useCart } from "../../features/cart/cart.context";
import { useWishlist } from "../../features/wishlist/wishlist.context";
import { useDialogs } from "../dialogs/dialogs.context";
import { Link } from "../../routing/link";
import {
  ArrowRight,
  Menu,
  Search,
  Heart,
  UserRound,
  ShoppingBag,
} from "lucide-react";
export function Header() {
  const route = useRoute();
  const [pathname, search = ""] = route.split("?");
  const params = new URLSearchParams(search);
  const { count } = useCart();
  const { saved } = useWishlist();
  const { openDialog } = useDialogs();
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
          <Link to="/" className="wordmark" aria-label="RivermindStyle home">
            RIVERMINDSTYLE<span>CONSIDERED. EXPRESSED. WORN.</span>
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
          <Link
            to="/shop?edit=new"
            className={params.get("edit") === "new" ? "active" : ""}
          >
            New arrivals
          </Link>
          <Link
            to="/shop"
            className={pathname === "/shop" && !search ? "active" : ""}
          >
            Shop all
          </Link>
          <Link
            to="/custom"
            className={pathname === "/custom" ? "active" : ""}
          >
            Custom
          </Link>
          <Link to="/collection">Collections</Link>
          <Link to="/about">Our world</Link>
        </nav>
      </header>
    </>
  );
}
