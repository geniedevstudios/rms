import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { pieceColourways } from "../../../data/size-guide";
import type { Product } from "../../../types/product";
import { Link } from "../../../routing/link";
import { productPath } from "../../../routing/navigation";
import { money } from "../../../lib/format-currency";
import { ProductPurchase } from "../product-purchase/product-purchase";
import { ProductGallery, productFrames } from "../product-gallery/product-gallery";
import "./quick-view.styles.css";

export function QuickView({ product }: { product: Product }) {
  const ways = pieceColourways(product);
  const [colourId, setColourId] = useState(ways[0]?.id ?? "");
  useEffect(() => {
    setColourId(pieceColourways(product)[0]?.id ?? "");
  }, [product.id]);
  const colourway = ways.find((way) => way.id === colourId) ?? ways[0];
  if (!colourway) return null;
  return (
    <div className="quick-view-content">
      <ProductGallery
        key={colourway.id}
        frames={productFrames(colourway)}
        name={product.name}
        label="THE FULL LOOK"
      />
      <div className="quick-view-details">
        <span className="eyebrow">THE BECOMING COLLECTION</span>
        <div className="quick-view-title">
          <h3>{product.name}</h3>
          {product.tag && <span className="name-label">{product.tag}</span>}
        </div>
        <p className="quick-view-price">{money(product.price)}</p>
        <p className="quick-view-description">{product.description}</p>
        <ProductPurchase product={product} colourway={colourway} onColour={setColourId} />
        <Link to={productPath(product.id)} className="text-link">
          View full details <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
