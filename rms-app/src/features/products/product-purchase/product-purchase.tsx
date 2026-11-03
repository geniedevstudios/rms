import { useState } from "react";
import { Ruler, ShoppingBag, Heart } from "lucide-react";
import type { Product } from "../../../types/product";
import { sizes } from "../../../data/products";
import { useProductSelection } from "../use-product-selection";
import { SizeGuide } from "../size-guide/size-guide";
import "./product-purchase.styles.css";

export function ProductPurchase({ product }: { product: Product }) {
  const { size, sizeError, selectSize, addToCart, isSaved, toggleSaved } =
    useProductSelection(product);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  return (
    <>
      <div className="colour-choice">
        <span>Colour — {product.color}</span>
        <span className="colour-dot" style={{ background: product.swatch }} />
      </div>
      <div className="size-heading">
        <span>Select size {size && `— ${size}`}</span>
        <button
          onClick={() => setShowSizeGuide((value) => !value)}
          aria-expanded={showSizeGuide}
        >
          <Ruler size={13} /> Size guide
        </button>
      </div>
      <div className="size-options" role="group" aria-label="Select your size">
        {sizes.map((s) => (
          <button
            key={s}
            className={size === s ? "selected" : ""}
            aria-pressed={size === s}
            onClick={() => selectSize(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {sizeError && (
        <p role="alert" className="form-error">
          Please select your size to continue.
        </p>
      )}
      <div className="add-bag-row">
        <button className="button dark" onClick={addToCart}>
          Add to bag <ShoppingBag size={17} />
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
      {showSizeGuide && (
        <div className="inline-size-guide">
          <SizeGuide />
        </div>
      )}
    </>
  );
}
