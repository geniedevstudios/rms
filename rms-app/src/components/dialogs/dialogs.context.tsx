import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRoute } from "../../routing/use-route";
import type { Dialog } from "./dialogs.types";

type DialogContextValue = {
  dialog: Dialog | null;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
};
const DialogContext = createContext<DialogContextValue | null>(null);

/** One active dialog: opening the cart from Quick View replaces the product modal. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const route = useRoute();
  useEffect(() => {
    setDialog(null);
  }, [route]);
  return (
    <DialogContext.Provider
      value={{
        dialog,
        openDialog: setDialog,
        closeDialog: () => setDialog(null),
      }}
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
