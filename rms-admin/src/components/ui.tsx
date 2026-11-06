import { useEffect, useRef, type ReactNode } from "react";
import { X, Image as ImageIcon, Film, ArrowUpRight } from "lucide-react";
import { libraryThumb } from "../../shared/media-url.mjs";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <ImageIcon size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Thumb({
  src,
  alt = "",
  video = false,
  className = "",
}: {
  src: string;
  alt?: string;
  video?: boolean;
  className?: string;
}) {
  const preview = libraryThumb(src, video);
  const still = video && preview !== src;
  return (
    <div className={`thumb ${className}`}>
      {src ? (
        video && !still ? (
          <>
            <video src={src} muted playsInline preload="none" />
            <Film className="video-badge" size={18} />
          </>
        ) : (
          <>
            <img src={preview} alt={alt} loading="lazy" decoding="async" />
            {video && <Film className="video-badge" size={18} />}
          </>
        )
      ) : (
        <ImageIcon size={24} />
      )}
    </div>
  );
}
export function StoreLink({
  children = "View storefront",
}: {
  children?: ReactNode;
}) {
  return (
    <a
      className="button secondary"
      href={import.meta.env.VITE_STOREFRONT_URL || "http://127.0.0.1:5173/"}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
export function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-GH", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not published yet";
}
