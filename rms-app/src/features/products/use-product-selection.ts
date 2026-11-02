import { useState } from "react";
import type { Product } from "../../types/product";
import { sizes } from "../../data/products";
import { useCart } from "../cart/cart.context";
import { MAX_ITEM_QUANTITY } from "../cart/cart.logic";
import { useSavedProduct } from "../wishlist/use-saved-product";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { useToast } from "../../components/toast/toast.context";

export function useProductSelection(product: Product) {
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
    if (!sizes.includes(size)) {
      setSizeError(true);
      return;
    }
    const existing = items.find(
      (item) => item.productId === product.id && item.size === size,
    );
    if (existing && existing.quantity >= MAX_ITEM_QUANTITY) {
      notify("You can add up to 10 of each size.");
      return;
    }
    addItem({ productId: product.id, size });
    openDialog({ type: "cart" });
  };
  return { size, sizeError, selectSize, addToCart, isSaved, toggleSaved };
}
