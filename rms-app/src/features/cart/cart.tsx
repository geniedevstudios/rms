import { MAX_ITEM_QUANTITY } from "./cart.logic";
import { quantityCap } from "../../shared/stock.mjs";
import "./cart.styles.css";
import { useCart } from "./cart.context";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { findPiece } from "../../data/catalog";
import { resolveColourway } from "../../data/size-guide";
import { pieceLine } from "../products/colour";
import { Link } from "../../routing/link";
import { piecePath } from "../../routing/navigation";
import { money } from "../../lib/format-currency";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { EmptyState } from "../../components/empty-state/empty-state";
export function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { closeDialog } = useDialogs();
  return items.length ? (
    <>
      <div className="bag-items">
        {items.map((item) => {
          const product = findPiece(item.productId)!;
          const colourway = resolveColourway(product, item.colourwayId);
          return (
            <div className="bag-item" key={`${item.productId}-${item.colourwayId || ""}-${item.size}`}>
              <Link to={piecePath(product)}>
                <img src={colourway?.image || product.image} alt={product.name} />
              </Link>
              <div className="bag-item-info">
                <Link to={piecePath(product)}>{product.name}</Link>
                <p>{pieceLine(item.color || colourway?.color, item.size)}</p>
                <span>{money(product.price)}</span>
                <div className="quantity">
                  <button
                    aria-label={`Decrease quantity of ${product.name}`}
                    onClick={() => updateQuantity(item, -1)}
                  >
                    <Minus size={12} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Increase quantity of ${product.name}`}
                    onClick={() => updateQuantity(item, 1)}
                    disabled={item.quantity >= quantityCap(colourway, item.size, MAX_ITEM_QUANTITY)}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <button
                className="icon-button remove-item"
                aria-label={`Remove ${product.name}`}
                onClick={() => removeItem(item)}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="bag-summary">
        <div>
          <span>Subtotal</span>
          <strong>{money(subtotal)}</strong>
        </div>
        <p>Delivery is shown at checkout.</p>
        <Link to="/checkout" className="button dark full">
          Continue to checkout <ArrowRight size={17} />
        </Link>
        <button className="text-link" onClick={() => closeDialog()}>
          Continue exploring
        </button>
      </div>
    </>
  ) : (
    <EmptyState
      icon={<ShoppingBag />}
      title="Room for something special."
      text="Your bag is waiting for a piece that feels like you."
      action={() => closeDialog("#/shop")}
    />
  );
}
