import "./wishlist.styles.css";
import { useWishlist } from "./wishlist.context";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { pieces } from "../../data/catalog";
import type { CustomDesign } from "../../data/custom-designs";
import { ProductCard } from "../products/product-card/product-card";
import { CustomDesignCard } from "../../pages/custom/custom-design-card";
import { EmptyState } from "../../components/empty-state/empty-state";
import { Heart } from "lucide-react";
export function Wishlist() {
  const { saved } = useWishlist();
  const { closeDialog } = useDialogs();
  return saved.length ? (
    <div className="saved-grid">
      {pieces
        .filter((p) => saved.includes(p.id))
        .map((product) =>
          product.leadDays ? (
            <CustomDesignCard
              key={product.id}
              design={product as CustomDesign}
            />
          ) : (
            <ProductCard key={product.id} product={product} />
          ),
        )}
    </div>
  ) : (
    <EmptyState
      icon={<Heart />}
      title="Keep what speaks to you."
      text="Tap the heart on a piece to save it here for another moment."
      action={() => closeDialog("#/shop")}
    />
  );
}
