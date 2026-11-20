import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { money } from "../../lib/format-currency";
import { readStorage, writeStorage } from "../../lib/storage";

/**
 * Display-only currency. Paystack charges in GHS, so every amount that is
 * actually paid (checkout, orders, receipts) stays in cedis. Everything else
 * can be shown as an approximate equivalent in the visitor's chosen currency.
 */
export const currencies = [
  { code: "GHS", label: "GHS", name: "Ghana cedi", prefix: "GH₵ " },
  { code: "USD", label: "USD", name: "US dollar", prefix: "$" },
  { code: "EUR", label: "EUR", name: "Euro", prefix: "€" },
  { code: "XOF", label: "CFA", name: "CFA franc (West Africa)", prefix: "CFA " },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

type Rates = { USD: number; EUR: number; XOF: number; at: number };

const CURRENCY_KEY = "rms-currency";
const RATES_KEY = "rms-fx-rates";
const RATES_TTL = 12 * 60 * 60 * 1000;
/** The West African CFA franc is fixed to the euro by treaty. */
const XOF_PER_EUR = 655.957;
const RATES_URL =
  "https://api.frankfurter.dev/v2/rates?base=GHS&quotes=USD,EUR";

const isCode = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && currencies.some((item) => item.code === value);

const isRates = (value: unknown): value is Rates => {
  if (!value || typeof value !== "object") return false;
  const rates = value as Record<string, unknown>;
  return ["USD", "EUR", "XOF", "at"].every(
    (key) => typeof rates[key] === "number" && Number.isFinite(rates[key]),
  );
};

type CurrencyState = {
  /** What the visitor picked. */
  currency: CurrencyCode;
  /** What prices are really shown in (GHS until rates are available). */
  shown: CurrencyCode;
  ratesReady: boolean;
  setCurrency: (code: CurrencyCode) => void;
  price: (cedis: number) => string;
};

const CurrencyContext = createContext<CurrencyState>({
  currency: "GHS",
  shown: "GHS",
  ratesReady: false,
  setCurrency: () => {},
  price: money,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = usePersistentState<CurrencyCode>(
    CURRENCY_KEY,
    "GHS",
    isCode,
  );
  const [rates, setRates] = useState<Rates | null>(() =>
    readStorage<Rates | null>(
      RATES_KEY,
      null,
      (value): value is Rates | null => value === null || isRates(value),
    ),
  );

  useEffect(() => {
    if (rates && Date.now() - rates.at < RATES_TTL) return;
    let live = true;
    fetch(RATES_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Rates unavailable");
        return response.json() as Promise<{ quote: string; rate: number }[]>;
      })
      .then((data) => {
        const rate = (code: string) =>
          Array.isArray(data)
            ? data.find((item) => item.quote === code)?.rate
            : undefined;
        const usd = rate("USD");
        const eur = rate("EUR");
        if (!live || !usd || !eur || usd <= 0 || eur <= 0) return;
        const next: Rates = {
          USD: usd,
          EUR: eur,
          XOF: eur * XOF_PER_EUR,
          at: Date.now(),
        };
        writeStorage(RATES_KEY, next);
        setRates(next);
      })
      .catch(() => {
        /* Keep the last known rates, or fall back to cedis. */
      });
    return () => {
      live = false;
    };
    // Rates are refreshed once per visit when the saved copy is old.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<CurrencyState>(() => {
    const shown: CurrencyCode = rates ? currency : "GHS";
    const meta = currencies.find((item) => item.code === shown)!;
    return {
      currency,
      shown,
      ratesReady: !!rates,
      setCurrency,
      price: (cedis: number) => {
        if (shown === "GHS" || !rates) return money(cedis);
        const amount = Math.round(cedis * rates[shown]);
        return `${meta.prefix}${amount.toLocaleString("en-US")}`;
      },
    };
  }, [currency, rates, setCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

/** Formats a cedi amount in the visitor's chosen currency (display only). */
export const useMoney = () => useContext(CurrencyContext).price;
