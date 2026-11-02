import "./overlay.styles.css";
import { type ReactNode, useRef, useEffect } from "react";
import { X } from "lucide-react";
export function Overlay({
  title,
  children,
  onClose,
  wide = false,
  popup = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  popup?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
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
      if (e.key === "Escape") closeRef.current();
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
  }, []);
  return (
    <div
      className={`overlay ${wide ? "overlay-wide" : ""} ${popup ? "overlay-popup" : ""}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a[href^="#/"]')) onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="drawer"
      >
        <div className="drawer-heading">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
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
