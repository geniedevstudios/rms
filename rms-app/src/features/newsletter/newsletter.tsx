import "./newsletter.styles.css";
import { useState, type FormEvent } from "react";
import { Check, ArrowRight } from "lucide-react";
export function Newsletter() {
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
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
              You’re on the preview list.
              <small>Demo only — no email has been submitted.</small>
            </span>
          </div>
        ) : (
          <>
            <label className="newsletter-input">
              <span className="sr-only">Your email address</span>
              <input
                type="email"
                required
                placeholder="Your email address"
                aria-label="Your email address"
              />
              <button type="submit" aria-label="Join the preview newsletter">
                <ArrowRight size={21} />
              </button>
            </label>
            <p className="newsletter-note">
              By joining, you agree to hear from RivermindStyle. Unsubscribe
              anytime.
              <br />
              Preview only — subscriptions are not sent yet.
            </p>
          </>
        )}
      </form>
    </section>
  );
}
