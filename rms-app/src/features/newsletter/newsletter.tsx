import "./newsletter.styles.css";
import { useState, type FormEvent } from "react";
import { Check, ArrowRight } from "lucide-react";
export function Newsletter() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cms/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">LET’S STAY CLOSE</span>
        <h2>A little RMS in your inbox.</h2>
        <p>
          New collections, considered stories and a first look at what’s next.
        </p>
      </div>
      <form onSubmit={submit}>
        {done ? (
          <div role="status" className="newsletter-success">
            <Check size={19} />
            <span>
              You’re on the list.
            </span>
          </div>
        ) : (
          <>
            <label className="newsletter-input">
              <span className="sr-only">Your email address</span>
              <input
                name="email"
                type="email"
                required
                placeholder="Your email address"
                aria-label="Your email address"
                disabled={busy}
              />
              <button type="submit" aria-label="Join the newsletter" disabled={busy}>
                <ArrowRight size={21} />
              </button>
            </label>
            {error ? <p className="newsletter-error" role="alert">{error}</p> : null}
            <p className="newsletter-note">
              By joining, you agree to hear from RIVERMINDSTYLE. Unsubscribe
              anytime.
            </p>
          </>
        )}
      </form>
    </section>
  );
}
