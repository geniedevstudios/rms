import { type ReactNode } from "react";
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
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={() => {
        if (window.location.hash === `#${to}`) {
          window.scrollTo({ top: 0, behavior: "instant" });
          document
            .getElementById("main-content")
            ?.focus({ preventScroll: true });
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
