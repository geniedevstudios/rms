# RMS customer and studio email notifications

New paid orders, consultation requests, verified failed payments, interrupted checkouts, and carts inactive for 24 hours enqueue separate customer and admin messages. Existing historical orders are not backfilled. Customer cart reminders require the checkout opt-in; the studio still receives its follow-up alert. Anonymous carts cannot be emailed.

## Configuration

On the admin server set `RESEND_API_KEY`, `RESEND_FROM` (a verified sender), `RMS_ADMIN_EMAIL`, `PAYSTACK_SECRET_KEY`, `RMS_STOREFRONT_URL=https://rivermindstyle.com`, and `RMS_ADMIN_URL=https://admin.rivermindstyle.com`. `RMS_NOTIFICATION_EMAIL` optionally overrides the admin recipient. `RMS_EMAIL_AUTOMATION_ENABLED=false` pauses sending without stopping payment reconciliation. No keys are exposed to browsers.

Local configuration now contains the chosen public URLs and enables sending. Deploy the shop and the studio as two Vercel projects. The shop forwards `/api/cms`, `/media`, and `/uploads` to the studio address in `RMS_CONTENT_ORIGIN`. Checkout, accounts, and Paystack run on the studio.

Orders, consultations, checkout snapshots, and pending emails are stored in Supabase. New orders and consultations dispatch immediately after being queued. Checkout cancellation/error callbacks trigger a fresh payment check and accurately labelled follow-up. In development, a ten-second worker handles retry delivery and 24-hour reminders. On Vercel, the daily schedule at `/api/cron/mail` does that work. Provider requests are paced to avoid rate-limit bursts. The development worker is cleaned up when Vite closes.

## Reliability and verification

Checkout snapshots live in `checkouts` and pending emails live in `mail_jobs`. Prices come from published catalogue content. A payment attempt saves an immutable snapshot before Paystack opens. Both the payment callback and background worker verify the currency, amount, email, and success status with Paystack before recording an order and enqueuing receipts. Browser closure does not lose a captured paid order. Pending/cancelled checkout screens are not automatically labelled as failed payments.

Events have deterministic recipient-specific keys. Resend idempotency keys, persisted send results, and retry backoff prevent ordinary duplicate deliveries. Uncertain sends stop for review after 23 hours, before the provider's 24-hour deduplication window expires. Review those records in the provider before manually resending. Settings displays connection state and sent/pending/review counts. It does not claim provider acceptance means inbox delivery.

Successful orders suppress pending abandoned/failed reminders for the same email. Empty carts suppress cart reminders. Recovery tokens expose only saved product selections, expire after 30 days, and never restore addresses or payment details. Reminder emails link to an explicit opt-out action. Stored notification and checkout rows contain customer contact information: restrict the database and define retention before launch.

Provider references: [Resend idempotency](https://resend.com/changelog/idempotency-keys), [Paystack verification statuses](https://paystack.com/docs/payments/verify-payments/).

## Sender identities and invitation branding

`RESEND_ORDERS_FROM`, `RESEND_CONSULTATION_FROM`, `RESEND_PAYMENTS_FROM`, and `RESEND_CARE_FROM` select the sender for each flow. Defaults are orders@rivermindstyle.com, consultation@rivermindstyle.com, payments@rivermindstyle.com, and care@rivermindstyle.com. Customer replies go to that department; administrator replies go to the customer. The domain must be verified in Resend, and receiving mailboxes or forwarding aliases must separately exist at the email host.

The packaged `assets/invitation-hero.jpg` is the same hero/logo used by rms-unreleased's invitation emails. It is attached inline by CID. Product images use public HTTPS sources, or inline attachments for local assets when available. Receipt details include sizes, quantities, line totals, total paid, and delivery address. HTML previews under `.previews/notification-*.html` use sample data, not real customer records.

Previously queued messages with an attempted send retain their original content/sender for provider idempotency. Already-sent messages are never resent automatically when a template changes. HTTP failures are retained on queue entries for diagnosis; immediate dispatch cannot guarantee mailbox delivery time.
