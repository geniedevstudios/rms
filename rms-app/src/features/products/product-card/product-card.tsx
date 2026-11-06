import "./product-card.styles.css";
import { type Product } from "../../../types/product";
import { useSavedProduct } from "../../wishlist/use-saved-product";
import { useDialogs } from "../../../components/dialogs/dialogs.context";
import { Link } from "../../../routing/link";
import { piecePath } from "../../../routing/navigation";
import { Heart, ArrowUpRight } from "lucide-react";
import { money } from "../../../lib/format-currency";
import { HoverImage } from "../../../components/hover-image/hover-image";
import { pieceColour } from "../colour";
import { pieceColourways } from "../../../data/size-guide";
export function ProductCard({ product }: { product: Product }) {
  const { openDialog } = useDialogs();
  const { isSaved, toggleSavedProduct: onSave } = useSavedProduct(product.id);
  const colour = pieceColour(product);
  const colours = pieceColourways(product).filter((way) => way.color.trim());
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={piecePath(product)} className="product-image">
          <HoverImage
            src={product.image}
            hover={product.hoverImage}
            alt={
              colour
                ? `${product.name} in ${colour.name}`
                : product.name
            }
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
          {colour && <span>{colour.name}</span>}
          {colours.length > 1 && (
            <span className="product-colours">
              {colours.map((way) => (
                <i key={way.id} style={way.swatch ? { background: way.swatch } : undefined} title={way.color} />
              ))}
            </span>
          )}
        </div>
        <p>{money(product.price)}</p>
      </div>
      {colour?.swatch && (
        <div
          className="product-swatch"
          style={{ backgroundColor: colour.swatch }}
          title={colour.name}
        />
      )}
    </article>
  );
}
