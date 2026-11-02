import { ArrowUpRight } from "lucide-react";
import type { Product } from "../../../types/product";
import { Link } from "../../../routing/link";
import { productPath } from "../../../routing/navigation";
import { money } from "../../../lib/format-currency";
import { ProductPurchase } from "../product-purchase/product-purchase";
import "./quick-view.styles.css";

export function QuickView({ product }: { product: Product }) {
  return (
    <div className="quick-view-content">
      <img
        className="quick-view-image"
        src={product.image}
        alt={`${product.name} in ${product.color}`}
      />
      <div className="quick-view-details">
        <span className="eyebrow">THE BECOMING COLLECTION</span>
        <h3>{product.name}</h3>
        <p className="quick-view-price">{money(product.price)}</p>
        <p className="quick-view-description">{product.description}</p>
        <ProductPurchase product={product} />
        <Link to={productPath(product.id)} className="text-link">
          View full details <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
