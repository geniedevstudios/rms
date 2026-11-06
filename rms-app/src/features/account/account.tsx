import "./account.styles.css";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useWishlist } from "../wishlist/wishlist.context";
import { useOrders } from "../orders/orders.context";
import { useAccount } from "./account.context";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Heart, Package, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "../../routing/link";

type AuthMode = "sign-in" | "create";

export function Account() {
  const { saved } = useWishlist();
  const { orders } = useOrders();
  const { customer, signup, login, verify, resend, logout } = useAccount();
  const { openDialog } = useDialogs();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!revealed) return;
    formRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, [revealed, mode, pendingEmail]);

  const openAuth = (next: AuthMode) => {
    setPendingEmail("");
    setError("");
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
    setPendingEmail("");
    setError("");
  };

  const fail = (caught: unknown) => {
    const problem = caught as Error & { verify?: boolean };
    if (problem.verify) return true;
    setError(problem.message || "Please try again.");
    return false;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    setBusy(true);
    setError("");
    try {
      if (mode === "create") {
        await signup({
          givenName: String(data.get("given-name") || ""),
          familyName: String(data.get("family-name") || ""),
          email,
          password: String(data.get("password") || ""),
        });
        setPendingEmail(email);
      } else {
        try {
          await login(email, String(data.get("password") || ""));
          closeAuth();
        } catch (caught) {
          if (fail(caught)) setPendingEmail(email);
        }
      }
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await verify(pendingEmail, String(data.get("code") || ""));
      closeAuth();
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(false);
    }
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
          {pendingEmail ? (
            <form ref={formRef} className="account-form" onSubmit={submitCode}>
              <h3>Confirm it's you.</h3>
              <p>Enter the 6-digit code sent to {pendingEmail}.</p>
              <label>
                Code
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="account-code"
                  required
                />
              </label>
              {error ? <p className="account-error" role="alert">{error}</p> : null}
              <button className="button dark full" type="submit" disabled={busy}>
                {busy ? "Checking…" : "Confirm code"} <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="text-link account-switch"
                disabled={busy}
                onClick={() => {
                  setError("");
                  void resend(pendingEmail).catch(fail);
                }}
              >
                Send a new code
                <ArrowRight size={15} />
              </button>
            </form>
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
              {error ? <p className="account-error" role="alert">{error}</p> : null}
              <button className="button dark full" type="submit" disabled={busy}>
                {busy ? "Sending…" : mode === "sign-in" ? "Sign in" : "Create account"}{" "}
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
            {customer
              ? `Hello, ${customer.givenName}. Your saved pieces, bag, and orders are here.`
              : "Your saved pieces and orders are here. Sign in, or create an account, when you are ready."}
          </p>
          <button
            className="button outline full"
            onClick={() => openDialog({ type: "wishlist" })}
          >
            View saved pieces ({saved.length}) <Heart size={16} />
          </button>
          <Link to="/orders" className="button outline full">
            Your orders ({orders.length}) <Package size={16} />
          </Link>
          <div className="account-actions">
            {customer ? (
              <button className="button outline" onClick={() => void logout()}>
                Sign out
              </button>
            ) : (
              <>
                <button className="button dark" onClick={() => openAuth("sign-in")}>
                  Sign in <ArrowRight size={16} />
                </button>
                <button className="button outline" onClick={() => openAuth("create")}>
                  Create account <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
