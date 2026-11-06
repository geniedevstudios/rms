import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { useAccount } from "../account/account.context";
import { isWishlist, toggleWishlistItem } from "./wishlist.logic";

type WishlistContextValue = {
  saved: string[];
  toggleSaved: (id: string) => void;
};
const WishlistContext = createContext<WishlistContextValue | null>(null);
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { customer, ready } = useAccount();
  const [saved, setSaved] = usePersistentState<string[]>(
    "rms-saved",
    [],
    isWishlist,
  );
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const synced = useRef("");
  useEffect(() => {
    if (!ready || !customer) {
      synced.current = "";
      return;
    }
    let stop = false;
    const email = customer.email;
    (async () => {
      const response = await fetch("/api/cms/account/wishlist");
      const body = await response.json();
      if (stop || !response.ok) return;
      if (isWishlist(body.ids) && body.ids.length) setSaved(body.ids);
      else if (savedRef.current.length) {
        await fetch("/api/cms/account/wishlist", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: savedRef.current }),
        });
      }
      if (!stop) synced.current = email;
    })();
    return () => {
      stop = true;
    };
  }, [ready, customer, setSaved]);
  useEffect(() => {
    if (!customer || synced.current !== customer.email) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/cms/account/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: saved }),
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [saved, customer]);
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
