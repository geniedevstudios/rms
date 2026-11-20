import "./product-card.styles.css";
import { type Product } from "../../../types/product";
import { useDialogs } from "../../../components/dialogs/dialogs.context";
import { Link } from "../../../routing/link";
import { piecePath } from "../../../routing/navigation";
import { ArrowUpRight } from "lucide-react";
import { useMoney } from "../../currency/currency.context";
import { HoverImage } from "../../../components/hover-image/hover-image";
import { pieceColour } from "../colour";
export function ProductCard({ product }: { product: Product }) {
  const { openDialog } = useDialogs();
  const money = useMoney();
  const colour = pieceColour(product);
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
        </div>
        <p>{money(product.price)}</p>
      </div>
    </article>
  );
}
