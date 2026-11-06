import { useState } from "react";
import type { Product } from "../../types/product";
import { isSizeAvailable } from "../../data/size-guide";
import type { Colourway } from "../../types/product";
import { useCart } from "../cart/cart.context";
import { MAX_ITEM_QUANTITY } from "../cart/cart.logic";
import { quantityCap } from "../../../../rms-admin/shared/stock.mjs";
import { useSavedProduct } from "../wishlist/use-saved-product";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { useToast } from "../../components/toast/toast.context";

export function useProductSelection(product: Product, colourway: Colourway) {
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const { items, addItem } = useCart();
  const { isSaved, toggleSavedProduct: toggleSaved } = useSavedProduct(
    product.id,
  );
  const { openDialog } = useDialogs();
  const { notify } = useToast();
  const selectSize = (size: string) => {
    setSize(size);
    setSizeError(false);
  };
  const addToCart = () => {
    if (!isSizeAvailable(colourway, size)) {
      setSizeError(true);
      return;
    }
    const existing = items.find(
      (item) =>
        item.productId === product.id &&
        item.size === size &&
        (item.colourwayId || colourway.id) === colourway.id,
    );
    const cap = quantityCap(colourway, size, MAX_ITEM_QUANTITY);
    if (existing && existing.quantity >= cap) {
      notify(
        cap < MAX_ITEM_QUANTITY
          ? `Only ${cap} left in this size.`
          : "You can add up to 10 of each size.",
      );
      return;
    }
    addItem({ productId: product.id, size, colourwayId: colourway.id });
    openDialog({ type: "cart" });
  };
  return { size, sizeError, selectSize, addToCart, isSaved, toggleSaved };
}
