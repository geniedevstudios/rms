import "./header.styles.css";
import { AnnouncementBar } from "../../features/promotions/promotions";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRoute } from "../../routing/use-route";
import { useCart } from "../../features/cart/cart.context";
import { useWishlist } from "../../features/wishlist/wishlist.context";
import { useDialogs } from "../dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { shopCategories } from "../../data/products";
import { collections } from "../../data/collections";
import { productPath } from "../../routing/navigation";
import {
  collectionMenuPhotos,
  newArrivalPhotos,
  newArrivals,
  shopMenuPhotos,
} from "../navigation/menu-photos";
import {
  Menu,
  Search,
  Heart,
  UserRound,
  ShoppingBag,
} from "lucide-react";

function splitHeader(pathname: string) {
  const pictureOnLeft =
    pathname === "/collection" ||
    pathname.startsWith("/collection/") ||
    pathname === "/custom";
  const pictureOnRight = pathname === "/" || pathname === "/about";
  if (!pictureOnLeft && !pictureOnRight) return "";
  const pictureFirst = pathname !== "/about";
  return ` is-split${pictureOnLeft ? " image-start" : ""}${pictureFirst ? " photo-top" : ""}`;
}

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
  const arrivals = newArrivals();
  const headerRef = useRef<HTMLElement>(null);
  const [away, setAway] = useState(false);
  const [solid, setSolid] = useState(false);
  const scrollState = useRef({ y: 0, away: false, solid: false, distance: 0 });
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${header.offsetHeight}px`,
      );
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const state = scrollState.current;
    const y = window.scrollY;
    state.y = y;
    state.away = false;
    state.solid = y > 10;
    state.distance = 0;
    setAway(false);
    setSolid(y > 10);
    let settle: number | undefined;
    const commit = (nextAway: boolean, nextSolid: boolean) => {
      if (nextAway !== state.away) {
        state.away = nextAway;
        setAway(nextAway);
      }
      if (nextSolid !== state.solid) {
        state.solid = nextSolid;
        setSolid(nextSolid);
      }
    };
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - state.y;
      state.y = y;
      if (y <= 10) {
        state.distance = 0;
        if (state.away) {
          commit(false, true);
          window.clearTimeout(settle);
          settle = window.setTimeout(() => {
            if (window.scrollY <= 10 && !scrollState.current.away) commit(false, false);
          }, 720);
        } else {
          commit(false, false);
        }
        return;
      }
      if (delta === 0) return;
      if ((delta > 0 && state.distance < 0) || (delta < 0 && state.distance > 0)) {
        state.distance = 0;
      }
      state.distance += delta;
      if (state.distance > 28) {
        state.distance = 0;
        commit(true, state.solid);
      } else if (state.distance < -28) {
        state.distance = 0;
        commit(false, true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const place = () => {
      const split = header.classList.contains("is-split");
      const photoOnLeft = header.classList.contains("image-start");
      const mid = window.innerWidth / 2;
      header.querySelectorAll<HTMLAnchorElement>(".desktop-nav > a, .nav-drop > a").forEach((link) => {
        if (!split) {
          delete link.dataset.onPhoto;
          delete link.dataset.across;
          return;
        }
        const box = link.getBoundingClientRect();
        const crosses = box.left < mid && box.right > mid;
        if (crosses) {
          link.dataset.across = "true";
          delete link.dataset.onPhoto;
          return;
        }
        delete link.dataset.across;
        const onPhoto = photoOnLeft ? box.right <= mid : box.left >= mid;
        if (onPhoto) link.dataset.onPhoto = "true";
        else delete link.dataset.onPhoto;
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(header);
    window.addEventListener("resize", place);
    const fonts = document.fonts?.ready.then(place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      void fonts;
    };
  }, [pathname]);
  return (
    <>
      <AnnouncementBar />
      <header
        className={`site-header${splitHeader(pathname)}${pathname === "/shop" ? " no-rule" : ""}${away ? " is-away" : ""}${solid ? " is-solid" : ""}`}
        ref={headerRef}
      >
        <div className="header-main">
          <div className="header-lead">
            <button
              className="icon-button mobile-menu"
              aria-label="Open menu"
              onClick={() => openDialog({ type: "menu" })}
            >
              <Menu />
            </button>
          </div>
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
              {arrivals.map((product) => (
                <Link key={product.id} to={productPath(product.id)}>
                  {product.name}
                </Link>
              ))}
            </div>
            <div className="nav-panel-photos">
              {newArrivalPhotos().map((photo) => (
                <Link key={photo.key} to={photo.to}>
                  <img src={photo.image} alt="" />
                  <span>{photo.label}</span>
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
              {shopMenuPhotos().map((photo) => (
                <Link key={photo.key} to={photo.to}>
                  <img src={photo.image} alt="" />
                  <span>{photo.label}</span>
                </Link>
              ))}
            </div>
          </NavDrop>
          <NavDrop
            label="Collections"
            to="/collection"
            active={pathname === "/collection" || pathname.startsWith("/collection/")}
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
              {collectionMenuPhotos().map((photo) => (
                <Link key={photo.key} to={photo.to}>
                  <img src={photo.image} alt="" />
                  <span>{photo.label}</span>
                </Link>
              ))}
            </div>
          </NavDrop>
          <Link
            to="/custom"
            className={pathname === "/custom" || pathname.startsWith("/custom/") ? "active" : ""}
          >
            Custom
          </Link>
          <Link to="/about" className={pathname === "/about" ? "active" : ""}>
            Our world
          </Link>
        </nav>
      </header>
    </>
  );
}
