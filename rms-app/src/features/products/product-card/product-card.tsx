import "./product-card.styles.css";
import { type Product } from "../../../types/product";
import { useSavedProduct } from "../../wishlist/use-saved-product";
import { useDialogs } from "../../../components/dialogs/dialogs.context";
import { Link } from "../../../routing/link";
import { piecePath } from "../../../routing/navigation";
import { Heart, ArrowUpRight } from "lucide-react";
import { money } from "../../../lib/format-currency";
export function ProductCard({ product }: { product: Product }) {
  const { openDialog } = useDialogs();
  const { isSaved, toggleSavedProduct: onSave } = useSavedProduct(product.id);
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={piecePath(product)} className="product-image">
          <img
            src={product.image}
            alt={`${product.name} in ${product.color}`}
            loading="lazy"
          />
        </Link>
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <button
          className={`save-button ${isSaved ? "is-saved" : ""}`}
          aria-label={`${isSaved ? "Unsave" : "Save"} ${product.name}`}
          aria-pressed={isSaved}
          onClick={onSave}
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          className="quick-view"
          aria-label={`Quick view ${product.name}`}
          onClick={() =>
            openDialog({ type: "quick-view", productId: product.id })
          }
        >
          Quick view <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="product-details">
        <div>
          <Link to={piecePath(product)}>{product.name}</Link>
          <span>{product.color}</span>
        </div>
        <p>{money(product.price)}</p>
      </div>
      <div
        className="product-swatch"
        style={{ backgroundColor: product.swatch }}
        title={product.color}
      />
    </article>
  );
}
