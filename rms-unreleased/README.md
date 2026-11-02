# RMS — The invitation

A separate coming-soon experience for RivermindStyle. Dependency-free HTML, CSS and JavaScript, with a small Node.js waitlist service.

## Run

Requires Node.js 20 or later. No package installation is needed.

```
npm run dev
```

Open http://127.0.0.1:5174. `npm run build` creates a distributable `dist/` including the server. Start that with `node dist/server/server.mjs`.

## Structure

- `src/card/`: reusable card finish and personalisation logic.
- `src/journey/`: sticky scroll sequence, movement, scaling and responsive card presentation.
- `src/waitlist/`: signup and confirmation flow and its styles.
- `src/styles.css`: page layout, typography and responsive rules.
- `src/main.js`: component initialization and privacy dialog.
- `server/waitlist.mjs`: shared validation and serialized signup storage.
- `server/server.mjs`: static files and POST `/api/waitlist`.
- `public/`: local fonts and icon.

## Behavior

The RMS access card is visible at the top of the page. Scrolling moves, enlarges and flips it to the back. Visitors type their name and email on the card in two saved steps. A checkmark at the end of each input saves that detail. Back and Reserve controls sit beneath the card. Confirmation, already-member notices and validation feedback appear outside the card. The front uses RMS member-access branding, with no payment-network logos or payment-card numbers.

`src/notifications/` owns the reusable reservation pop-up and its styles. New signups display “Access confirmed / Invitation reserved”; existing emails display “Already a member / You’re already on the list.” Both dialogs can be dismissed with Escape, the close button or Back to my card. The card retains the entered details behind the dialog. A Begin control skips scrolling; reduced-motion preferences reveal the form without movement.

The server saves each name, email, and card finish in the Supabase `waitlist` table and sends the confirmation through Resend. Duplicate emails stay as one invitation. No payment information is collected.

Copy `.env.example` to `.env` for local running. On the public host, set the same variables without committing them:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

The process listens on `PORT` (5174 locally) and `0.0.0.0`. A static-only deployment cannot save signups. Fonts: Inter and Playfair Display, copied from the RMS storefront's SIL Open Font License packages; licenses are included beside the font files.
