import "./account.styles.css";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useWishlist } from "../wishlist/wishlist.context";
import { useOrders } from "../orders/orders.context";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Heart, Package, ArrowUpRight, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "../../routing/link";
import { money } from "../../lib/format-currency";

type AuthMode = "sign-in" | "create";

export function Account() {
  const { saved } = useWishlist();
  const { orders } = useOrders();
  const { openDialog } = useDialogs();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!revealed) return;
    formRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, [revealed, mode]);

  const openAuth = (next: AuthMode) => {
    setDone(false);
    if (mode) {
      setMode(next);
      return;
    }
    setMode(next);
    setRevealed(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRevealed(true), reduce ? 0 : 520);
  };

  const closeAuth = () => {
    window.clearTimeout(timer.current);
    setRevealed(false);
    setMode(null);
    setDone(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDone(true);
  };

  return (
    <div
      className={`account-panel${mode ? " is-auth" : ""}${revealed ? " is-revealed" : ""}`}
    >
      {revealed && mode ? (
        <div className="account-auth">
          <button type="button" className="text-link account-back" onClick={closeAuth}>
            <ArrowLeft size={15} /> Your RMS
          </button>
          {done ? (
            <p className="account-done" role="status">
              {mode === "sign-in"
                ? "This preview does not sign you in. Nothing was sent."
                : "This preview does not create an account. Nothing was saved."}
            </p>
          ) : (
            <form ref={formRef} className="account-form" onSubmit={submit}>
              <h3>{mode === "sign-in" ? "Sign in" : "Create an account"}</h3>
              <p>
                {mode === "sign-in"
                  ? "Welcome back. Use the email tied to your RMS."
                  : "A few details, and your RMS is ready for you."}
              </p>
              {mode === "create" && (
                <div className="form-row">
                  <label>
                    First name
                    <input name="given-name" autoComplete="given-name" required />
                  </label>
                  <label>
                    Last name
                    <input name="family-name" autoComplete="family-name" required />
                  </label>
                </div>
              )}
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  required
                />
              </label>
              <button className="button dark full" type="submit">
                {mode === "sign-in" ? "Sign in" : "Create account"}{" "}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="text-link account-switch"
                onClick={() => openAuth(mode === "sign-in" ? "create" : "sign-in")}
              >
                {mode === "sign-in" ? "Create an account" : "Sign in"}
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          <span className="eyebrow">YOUR PERSONAL EDIT</span>
          <h3>A little more you.</h3>
          <p>
            Your saved pieces and demo orders live in this browser. Sign in, or
            create an account, when you are ready.
          </p>
          <button
            className="button outline full"
            onClick={() => openDialog({ type: "wishlist" })}
          >
            View saved pieces ({saved.length}) <Heart size={16} />
          </button>
          <h4>Your demo orders</h4>
          {orders.length ? (
            orders.map((order) => (
              <Link
                key={order.id}
                to={`/confirmation/${order.id}`}
                className="order-row"
              >
                <Package size={20} />
                <div>
                  <strong>{order.id}</strong>
                  <span>
                    {new Date(order.date).toLocaleDateString("en-GB")} ·{" "}
                    {money(order.total)}
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </Link>
            ))
          ) : (
            <p className="empty-orders">
              No demo orders yet. Explore the collection to try the shopping
              experience.
            </p>
          )}
          <div className="account-actions">
            <button className="button dark" onClick={() => openAuth("sign-in")}>
              Sign in <ArrowRight size={16} />
            </button>
            <button className="button outline" onClick={() => openAuth("create")}>
              Create account <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
