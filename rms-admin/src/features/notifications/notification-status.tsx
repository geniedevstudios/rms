import { useEffect, useState } from "react";
import { api } from "../../lib/api";
type Status = {
  configured: boolean;
  enabled: boolean;
  linksReady: boolean;
  paymentsReady: boolean;
  pending: number;
  review: number;
  sent: number;
};
export function NotificationStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let stop = false;
    const load = () => {
      void api<Status>("notifications")
        .then((value) => {
          if (!stop) {
            setStatus(value);
            setError("");
          }
        })
        .catch(() => {
          if (!stop) setError("Email status could not be loaded.");
        });
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);
  return (
    <section className="panel form-panel">
      <h2>Customer & studio emails</h2>
      <p>
        Order confirmations, consultation requests, and failed or interrupted
        payment follow-ups go to the customer and the studio. Unattended bags
        are checked after 24 hours; customer reminders require their opt-in.
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : status ? (
        <>
          <span className="badge">
            {!status.enabled
              ? "Paused"
              : !status.configured
                ? "Email setup needed"
                : !status.linksReady
                  ? "Website links needed"
                  : !status.paymentsReady
                    ? "Payment verification needed"
                    : "Connected"}
          </span>
          <p>
            {status.sent} sent · {status.pending} waiting · {status.review} need
            review
          </p>
          {status.review > 0 && (
            <p>
              Some emails could not be confirmed as sent. Check the email
              provider before retrying them to avoid duplicates.
            </p>
          )}
        </>
      ) : (
        <p>Checking email connection…</p>
      )}
    </section>
  );
}
