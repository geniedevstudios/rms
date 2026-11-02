import { createContext, useContext, type ReactNode } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { isWishlist, toggleWishlistItem } from "./wishlist.logic";

type WishlistContextValue = {
  saved: string[];
  toggleSaved: (id: string) => void;
};
const WishlistContext = createContext<WishlistContextValue | null>(null);
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = usePersistentState<string[]>(
    "rms-saved",
    [],
    isWishlist,
  );
  return (
    <WishlistContext.Provider
      value={{
        saved,
        toggleSaved: (id) =>
          setSaved((current) => toggleWishlistItem(current, id)),
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
