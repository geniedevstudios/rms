import "./mobile-menu.styles.css";
import { useState, type ReactNode } from "react";
import { useWishlist } from "../../features/wishlist/wishlist.context";
import { useDialogs } from "../dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { products, shopCategories } from "../../data/products";
import { collections } from "../../data/collections";
import { productPath } from "../../routing/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Search,
  Heart,
  UserRound,
} from "lucide-react";

function MenuGroup({
  id,
  label,
  to,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  to: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={`mobile-group${open ? " is-open" : ""}`}>
      <div className="mobile-group-row">
        <Link to={to}>{label}</Link>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} ${label}`}
          onClick={() => onToggle(id)}
        >
          <ChevronDown size={20} />
        </button>
      </div>
      {open && <div className="mobile-group-panel">{children}</div>}
    </div>
  );
}

export function MobileMenu() {
  const { saved } = useWishlist();
  const { openDialog } = useDialogs();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));
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
    <div className="mobile-navigation">
      <MenuGroup
        id="new"
        label="New arrivals"
        to="/shop?edit=new"
        open={open === "new"}
        onToggle={toggle}
      >
        <span className="eyebrow">Just in</span>
        <Link to="/shop?edit=new">All new arrivals</Link>
        {products.slice(0, 4).map((product) => (
          <Link key={product.id} to={productPath(product.id)}>
            {product.name}
          </Link>
        ))}
        <div className="mobile-group-photos">
          {products.slice(0, 2).map((product) => (
            <Link key={product.id} to={productPath(product.id)}>
              <img src={product.image} alt="" />
              <span>{product.name}</span>
            </Link>
          ))}
        </div>
      </MenuGroup>
      <MenuGroup
        id="shop"
        label="Shop"
        to="/shop"
        open={open === "shop"}
        onToggle={toggle}
      >
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
        <div className="mobile-group-photos">
          <Link to="/shop?category=Pants">
            <img src="/images/city.jpg" alt="" />
            <span>Pants</span>
          </Link>
          <Link to="/shop?category=Skirts">
            <img src="/images/hero.jpg" alt="" />
            <span>Skirts</span>
          </Link>
        </div>
      </MenuGroup>
      <MenuGroup
        id="collections"
        label="Collections"
        to="/collection"
        open={open === "collections"}
        onToggle={toggle}
      >
        <span className="eyebrow">The collections</span>
        <Link to="/collection">All collections</Link>
        {collections.map((collection) => (
          <Link key={collection.id} to="/collection">
            {collection.title.map((line) => line.text).join(" ")}
          </Link>
        ))}
        <div className="mobile-group-photos">
          {collectionPhotos.map((photo) => (
            <Link key={photo.key} to={photo.to}>
              <img src={photo.image} alt="" />
              <span>{photo.label}</span>
            </Link>
          ))}
        </div>
      </MenuGroup>
      {(
        [
          ["Custom", "/custom"],
          ["Our world", "/about"],
          ["The journal", "/journal"],
        ] as const
      ).map(([label, path]) => (
        <Link key={path} to={path}>
          {label}
          <ArrowUpRight size={19} />
        </Link>
      ))}
      <div className="mobile-menu-secondary">
        <button
          className="menu-pill"
          onClick={() => openDialog({ type: "search" })}
        >
          <Search size={16} />
          <span>Search the wardrobe</span>
          <ArrowRight size={16} />
        </button>
        <button
          className="menu-pill"
          onClick={() => openDialog({ type: "wishlist" })}
        >
          <Heart size={16} />
          <span>Saved pieces ({saved.length})</span>
          <ArrowRight size={16} />
        </button>
        <button
          className="menu-pill"
          onClick={() => openDialog({ type: "account" })}
        >
          <UserRound size={16} />
          <span>Your RMS</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
