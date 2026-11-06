import { Ruler, ShoppingBag, Heart } from "lucide-react";
import type { Colourway, Product } from "../../../types/product";
import { sizes } from "../../../data/products";
import { sizeLabel, availableSizes, isSizeAvailable, pieceColourways } from "../../../data/size-guide";
import { quantityCap } from "../../../../../rms-admin/shared/stock.mjs";
import { useProductSelection } from "../use-product-selection";
import { useDialogs } from "../../../components/dialogs/dialogs.context";
import "./product-purchase.styles.css";

export function ProductPurchase({
  product,
  colourway,
  onColour,
}: {
  product: Product;
  colourway: Colourway;
  onColour: (id: string) => void;
}) {
  const { size, sizeError, selectSize, addToCart, isSaved, toggleSaved } =
    useProductSelection(product, colourway);
  const { openDialog } = useDialogs();
  const ways = pieceColourways(product);
  const soldOut = availableSizes(colourway).every((item) => !isSizeAvailable(colourway, item));
  const left = size ? quantityCap(colourway, size, Number.MAX_SAFE_INTEGER) : null;
  const counted = size ? Array.isArray(colourway.stock) : false;
  const colour = colourway.color.trim();
  return (
    <>
      {(colour || ways.length > 1) && (
        <div className="colour-choice">
          <span>Colour{colour ? ` — ${colour}` : ""}</span>
          {ways.length > 1 ? (
            <div className="colour-options" role="group" aria-label="Choose a colour">
              {ways.map((way) => (
                <button
                  key={way.id}
                  type="button"
                  aria-pressed={way.id === colourway.id}
                  aria-label={way.color || "Colour"}
                  className={way.id === colourway.id ? "selected" : ""}
                  onClick={() => onColour(way.id)}
                >
                  {way.swatch && <i style={{ background: way.swatch }} />}
                  <span>{way.color}</span>
                </button>
              ))}
            </div>
          ) : (
            colourway.swatch && (
              <span className="colour-dot" style={{ background: colourway.swatch }} />
            )
          )}
        </div>
      )}
      <div className="size-heading">
        <span>
          Select size {size && `— ${size}`}
          {counted && left != null && left > 0 && left <= 2 ? ` · ${left} left` : ""}
        </span>
        <button
          type="button"
          onClick={() => openDialog({ type: "size-guide" })}
          aria-haspopup="dialog"
        >
          <Ruler size={13} /> Size guide
        </button>
      </div>
      <div className="size-options" role="group" aria-label="Select your size">
        {sizes.map((s) => (
          <button
            key={s}
            title={sizeLabel(s)}
            aria-label={sizeLabel(s)}
            disabled={!isSizeAvailable(colourway, s)}
            className={size === s ? "selected" : ""}
            aria-pressed={size === s}
            onClick={() => selectSize(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {soldOut && <p className="form-error" role="status">This piece is currently sold out.</p>}
      {sizeError && (
        <p role="alert" className="form-error">
          Please select an available size to continue.
        </p>
      )}
      <div className="add-bag-row">
        <button className="button dark" onClick={addToCart} disabled={soldOut}>
          {soldOut ? "Sold out" : "Add to bag"} <ShoppingBag size={17} />
        </button>
        <button
          className={`button outline product-save ${isSaved ? "is-saved" : ""}`}
          aria-label={isSaved ? `Unsave ${product.name}` : `Save ${product.name}`}
          aria-pressed={isSaved}
          onClick={toggleSaved}
        >
          <Heart size={19} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
    </>
  );
}
