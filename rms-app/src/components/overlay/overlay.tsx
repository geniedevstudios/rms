import "./overlay.styles.css";
import { type ReactNode, useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDialogs } from "../dialogs/dialogs.context";
export function Overlay({
  title,
  children,
  onClose,
  wide = false,
  popup = false,
  brand = false,
  menu = false,
  sheet = false,
  covered = false,
}: {
  title: string;
  children: ReactNode;
  onClose: (hash?: string) => void;
  wide?: boolean;
  popup?: boolean;
  brand?: boolean;
  menu?: boolean;
  sheet?: boolean;
  covered?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerClose } = useDialogs();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const closing = useRef(false);
  const pendingHash = useRef<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const finishClose = () => {
    if (!closing.current) return;
    closing.current = false;
    const hash = pendingHash.current || undefined;
    closeRef.current(hash);
    if (hash && window.location.hash !== hash) window.location.hash = hash;
  };
  const requestClose = (hash?: string) => {
    if (closing.current) return;
    const destination = hash || undefined;
    if (
      (!menu && !sheet) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      closeRef.current(destination);
      if (destination && window.location.hash !== destination) {
        window.location.hash = destination;
      }
      return;
    }
    closing.current = true;
    pendingHash.current = destination ?? null;
    setLeaving(true);
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  useEffect(() => {
    return registerClose((hash) => requestCloseRef.current(hash));
  }, [registerClose]);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(finishClose, 460);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  useEffect(() => {
    if (covered) return;
    const before = document.activeElement as HTMLElement | null;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    const focusable = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, video[controls], [tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      if (e.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = scroll;
      document.removeEventListener("keydown", keydown);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, [covered]);
  return (
    <div
      className={`overlay ${wide ? "overlay-wide" : ""} ${popup ? "overlay-popup" : ""} ${menu ? "overlay-menu" : ""} ${sheet ? "overlay-sheet" : ""} ${leaving ? "is-closing" : ""}`}
      inert={covered}
      onClick={(e) => {
        const link = (e.target as HTMLElement).closest("a[href^='#/']");
        if (!link) return;
        const hash = link.getAttribute("href");
        if ((menu || sheet) && hash) {
          e.preventDefault();
          requestClose(hash);
          return;
        }
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={menu ? "menu-dialog-title" : "dialog-title"}
        className="drawer"
        onAnimationEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            (event.animationName === "menu-out" ||
              event.animationName === "sheet-out")
          ) {
            finishClose();
          }
        }}
      >
        <div className={`drawer-heading${brand ? " is-brand" : ""}`}>
          <h2 id={menu ? "menu-dialog-title" : "dialog-title"}>{title}</h2>
          <button
            className="icon-button"
            onClick={() => requestClose()}
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
