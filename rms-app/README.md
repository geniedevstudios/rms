# RivermindStyle storefront

A responsive, local storefront prototype based on `../RMS-WEBSITE-BRIEF.md`. Built with React, TypeScript and Vite. Fonts, stock photographs and the atelier film are served locally.

## Run

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; serve that build with `npm run preview`. The app uses hash routes, so static hosting does not need a route rewrite rule. No environment variables or external services are required for the preview.

## Included

- Editorial homepage, collection story, brand page and two journal articles.
- Eight sample products with category, colour and price filters and price sorting.
- Product detail views and reusable Quick View, with shared size selection, size guide, saved pieces and add-to-bag controls.
- Product search, saved pieces, persistent shopping bag, quantity adjustment and removal.
- Form-validated demo checkout, confirmation and local demo-order history.
- Mobile navigation, keyboard-operable dialogs, visible focus states and reduced-motion support.
- Locally hosted Playfair Display and Inter; locally hosted placeholder photography and a playable atelier film.

## Preview boundaries

Product names, prices in GHS, materials, sizes, collection names, editorial copy and brand story are illustrative. Media does not depict actual RMS products or its atelier. These items need RMS approval or replacement before launch. Source credits are in `MEDIA-CREDITS.md`.

Payments, fulfilment, authentication, live inventory, account synchronisation and email subscriptions are not connected. The checkout explicitly creates a demo order only. Contact and delivery form values are neither saved nor sent. Bag, wishlist and demo-order summaries use browser local storage; they are not an authenticated customer account.

## Where to edit

- `src/data/products.ts`: sample catalogue, prices, photos, colours and sizes.
- `src/pages/`: route pages, each with its own stylesheet.
- `src/features/`: cart, products, wishlist, checkout-adjacent services and their shared logic.
- `src/components/`: reusable layout, overlay, dialog and notification components.
- `src/app/`: application layout, routes and shared providers.
- `src/styles/global.css`: fonts, design tokens and shared base styles.
- `public/images/` and `public/videos/`: replaceable mockup assets.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the folder conventions and examples of opening shared dialogs or reusing cart logic. Run `npm run build` for TypeScript and production-build checks.

## Before a live launch

Replace the sample catalogue and media with approved assets; confirm brand colours, secondary typography, delivery/returns terms, sizing and editorial copy. Connect a trusted backend for products, stock, accounts and orders. Price and inventory validation, shipping calculations and payment confirmation must happen on the server, not from this prototype’s browser state. Add approved customer-care details and privacy/terms documents.
