import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRoute } from "../../routing/use-route";
import type { Dialog } from "./dialogs.types";

type CloseHandler = (hash?: string) => void;
type DialogContextValue = {
  dialog: Dialog | null;
  openDialog: (dialog: Dialog) => void;
  closeDialog: CloseHandler;
  dismissDialog: CloseHandler;
  registerClose: (handler: CloseHandler) => () => void;
};
const DialogContext = createContext<DialogContextValue | null>(null);

function keepsMenu(dialog: Dialog | null) {
  return (
    dialog?.type === "menu" ||
    ((dialog?.type === "search" ||
      dialog?.type === "wishlist" ||
      dialog?.type === "account") &&
      !!dialog.fromMenu)
  );
}

/** One active dialog: opening the cart from Quick View replaces the product modal. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const closeHandlers = useRef<CloseHandler[]>([]);
  const route = useRoute();
  useEffect(() => {
    setDialog(null);
  }, [route]);
  const dismissDialog = (hash?: string) => {
    setDialog(null);
    if (hash && window.location.hash !== hash) window.location.hash = hash;
  };
  const closeDialog = (hash?: string) => {
    const handler = closeHandlers.current.at(-1);
    if (handler) handler(hash);
    else dismissDialog(hash);
  };
  const registerClose = useCallback((handler: CloseHandler) => {
    closeHandlers.current.push(handler);
    return () => {
      closeHandlers.current = closeHandlers.current.filter(
        (item) => item !== handler,
      );
    };
  }, []);
  const openDialog = (next: Dialog) => {
    setDialog((current) => {
      if (current?.type === "quick-view" && next.type === "size-guide")
        return { ...next, fromProductId: current.productId };
      if (
        keepsMenu(current) &&
        (next.type === "search" ||
          next.type === "wishlist" ||
          next.type === "account")
      ) {
        return { ...next, fromMenu: true };
      }
      return next;
    });
  };
  return (
    <DialogContext.Provider
      value={{ dialog, openDialog, closeDialog, dismissDialog, registerClose }}
    >
      {children}
    </DialogContext.Provider>
  );
}
export function useDialogs() {
  const context = useContext(DialogContext);
  if (!context)
    throw new Error("useDialogs must be used inside DialogProvider");
  return context;
}
