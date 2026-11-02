import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ToastContext = createContext<{
  message: string;
  notify: (message: string) => void;
} | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const notify = (message: string) => {
    clearTimeout(timer.current);
    setMessage(message);
    timer.current = setTimeout(() => setMessage(""), 3200);
  };
  return (
    <ToastContext.Provider value={{ message, notify }}>
      {children}
    </ToastContext.Provider>
  );
}
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
