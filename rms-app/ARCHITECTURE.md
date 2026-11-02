# Storefront code structure

Organize code by feature. Keep a component and its stylesheet together; share behavior through hooks and context instead of copying it between pages.

```text
src/
  app/                      Application layout, providers and routes
  components/               Shared layout and UI components
    dialogs/                Dialog state, types and one dialog host
    overlay/                Shared modal shell and keyboard handling
    toast/                  Shared notifications
  features/
    cart/
      cart.tsx              Shopping bag UI
      cart.styles.css       Bag presentation and responsive styles
      cart.context.tsx      CartProvider and useCart
      cart.logic.ts         Pure cart updates, totals and validation
    products/
      product-card/         Reusable catalogue card and its styles
      product-purchase/     Shared size, save and add-to-bag controls
      quick-view/           Quick View content and its styles
      size-guide/           Shared measurements table and its styles
      use-product-selection.ts
      product-selectors.ts  Shared search, filtering and sorting
    wishlist/               Saved UI, shared state and toggle logic
    orders/                 Local demo-order state and validation
    account/                Account dialog
    search/                 Search dialog
    client-care/            Help content and dialog
    film/                   Film dialog
    newsletter/             Newsletter preview form
  pages/                    One folder and stylesheet per route page
  routing/                  Link component and hash navigation
  hooks/                    General reusable React hooks
  lib/                      Storage and currency helpers
  types/                    Product, cart and order types
  data/                     Mock catalogue
  styles/global.css         Fonts, tokens, resets and shared utilities
```

## Naming and responsibilities

- `name.tsx`: renders the component. Import `./name.styles.css` here.
- `name.styles.css`: component styling, including its media queries.
- `name.context.tsx`: shared React state, its provider and consumer hook.
- `name.logic.ts`: pure domain functions with no React dependency.
- `use-name.ts`: reusable interactive behavior.

Use named exports and direct imports. Keep a helper beside its feature unless unrelated features also need it. Avoid moving feature-specific styling into the global stylesheet.

## Reuse the cart anywhere

`AppProviders` mounts one cart provider for the whole application. Any component inside it can import the hook:

```tsx
import { useCart } from "../../features/cart/cart.context";

const { items, count, subtotal, addItem, removeItem, updateQuantity } = useCart();
addItem({ productId: "noir-dress", size: "M" });
updateQuantity({ productId: "noir-dress", size: "M" }, 1); // quantity delta
removeItem({ productId: "noir-dress", size: "M" });
```

Cart lines are identified by product ID plus size. Adding the same pair merges quantities; another size gets a separate line. Quantity limits and validation live in `cart.logic.ts`. The UI does not duplicate these rules. `addItem` updates the bag without forcing a dialog to open.

## Open shared dialogs anywhere

```tsx
import { useDialogs } from "../../components/dialogs/dialogs.context";

const { openDialog, closeDialog } = useDialogs();
openDialog({ type: "cart" });
openDialog({ type: "quick-view", productId: "noir-dress" });
```

`DialogHost` renders the active dialog once. `Overlay` owns Escape handling, focus trapping, focus restoration and background scroll locking. Opening the bag from Quick View replaces the modal; it does not stack overlays. For a new dialog, extend `dialogs.types.ts` and add its content to `dialog-host.tsx`.

`ProductCard` opens Quick View itself, so any page can render `<ProductCard product={product} />` without passing dialog or wishlist handlers through multiple layers. Quick View and the full product page both render `ProductPurchase`, which uses `useProductSelection` for required-size validation, cart actions and saved state.

## Persistence and checks

`usePersistentState` uses the storage helpers and each feature's validator. Existing `rms-bag`, `rms-saved` and `rms-orders` keys are retained. Unreadable or malformed data falls back to an empty state. These remain local prototype data, not a backend or signed-in account.

Run `npm run build` to check TypeScript and create the production bundle.
