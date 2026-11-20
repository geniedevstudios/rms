import "./currency.styles.css";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { currencies, useCurrency, type CurrencyCode } from "./currency.context";

const unavailable = "Exchange rates are unavailable right now.";

/** Compact dropdown for the desktop header. */
function HeaderCurrency() {
  const { currency, shown, ratesReady, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = currencies.find((item) => item.code === shown)!;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const choose = (code: CurrencyCode) => {
    setCurrency(code);
    setOpen(false);
  };

  return (
    <div className="currency-menu desktop-action" ref={root}>
      <button
        type="button"
        className="currency-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        {current.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <ul className="currency-list" role="listbox" aria-label="Choose a currency">
          {currencies.map((item) => {
            const off = item.code !== "GHS" && !ratesReady;
            return (
              <li key={item.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={currency === item.code}
                  disabled={off}
                  title={off ? unavailable : undefined}
                  onClick={() => choose(item.code)}
                >
                  <span>
                    <strong>{item.label}</strong> {item.name}
                  </span>
                  {currency === item.code && <Check size={13} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Inline choices for the mobile menu and the footer. */
function PillCurrency() {
  const { currency, ratesReady, setCurrency } = useCurrency();
  return (
    <div className="currency-pills" role="group" aria-label="Currency">
      {currencies.map((item) => {
        const off = item.code !== "GHS" && !ratesReady;
        return (
          <button
            key={item.code}
            type="button"
            aria-pressed={currency === item.code}
            disabled={off}
            title={off ? unavailable : item.name}
            onClick={() => setCurrency(item.code)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function CurrencySelect({ variant }: { variant: "header" | "pills" }) {
  return variant === "header" ? <HeaderCurrency /> : <PillCurrency />;
}

/** Reminds the visitor that payment is taken in cedis. Hidden when GHS is shown. */
export function CurrencyNote({ charge }: { charge?: string }) {
  const { shown } = useCurrency();
  if (shown === "GHS") return null;
  const name = shown === "XOF" ? "CFA" : shown;
  return (
    <p className="currency-note">
      Amounts in {name} are estimates.{" "}
      {charge
        ? `You will be charged ${charge} in Ghana cedis.`
        : "You are charged in Ghana cedis (GH₵) at checkout."}
    </p>
  );
}
