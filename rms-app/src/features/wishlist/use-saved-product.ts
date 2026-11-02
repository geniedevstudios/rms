import { useWishlist } from "./wishlist.context";
import { useToast } from "../../components/toast/toast.context";

/** Shared by cards, product detail pages and Quick View. */
export function useSavedProduct(productId: string) {
  const { saved, toggleSaved } = useWishlist();
  const { notify } = useToast();
  const isSaved = saved.includes(productId);
  const toggleSavedProduct = () => {
    toggleSaved(productId);
    notify(
      isSaved ? "Removed from your saved pieces" : "Added to your saved pieces",
    );
  };
  return { isSaved, toggleSavedProduct };
}
