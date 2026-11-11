import { type MouseEvent, type ReactNode } from "react";
export function Link({
  to,
  children,
  className = "",
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    const next = `#${to}`;
    if (window.location.hash === next) {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.getElementById("main-content")?.focus({ preventScroll: true });
      return;
    }
    window.location.hash = to;
  };
  return (
    <a href={`#${to}`} className={className} {...rest} onClick={open}>
      {children}
    </a>
  );
}
