import "./mobile-menu.styles.css";
import { useWishlist } from "../../features/wishlist/wishlist.context";
import { useDialogs } from "../dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { ArrowUpRight, Search, Heart, UserRound } from "lucide-react";
export function MobileMenu() {
  const { saved } = useWishlist();
  const { openDialog } = useDialogs();
  return (
    <div className="mobile-navigation">
      {[
        ["New arrivals", "/shop?edit=new"],
        ["Shop all", "/shop"],
        ["Custom", "/custom"],
        ["Collections", "/collection"],
        ["Our world", "/about"],
        ["The journal", "/journal"],
      ].map(([label, path]) => (
        <Link key={path} to={path}>
          {label}
          <ArrowUpRight size={19} />
        </Link>
      ))}
      <div className="mobile-menu-secondary">
        <button onClick={() => openDialog({ type: "search" })}>
          <Search size={16} /> Search the wardrobe
        </button>
        <button onClick={() => openDialog({ type: "wishlist" })}>
          <Heart size={16} /> Saved pieces ({saved.length})
        </button>
        <button onClick={() => openDialog({ type: "account" })}>
          <UserRound size={16} /> Your RMS
        </button>
      </div>
      <span className="eyebrow">GHANA / GHS</span>
    </div>
  );
}
