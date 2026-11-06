import "./product.styles.css";
import { type Product } from "../../types/product";
import { useEffect, useState } from "react";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { pieceColourways } from "../../data/size-guide";
import { Link } from "../../routing/link";
import { money } from "../../lib/format-currency";
import { ProductPurchase } from "../../features/products/product-purchase/product-purchase";
import { Plus, ArrowUpRight, ArrowRight } from "lucide-react";
import { products } from "../../data/products";
import { ProductCard } from "../../features/products/product-card/product-card";
import { ProductGallery, productFrames } from "../../features/products/product-gallery/product-gallery";
export function ProductPage({ product }: { product: Product }) {
  const { openDialog } = useDialogs();
  const ways = pieceColourways(product);
  const [colourId, setColourId] = useState(ways[0]?.id ?? "");
  useEffect(() => {
    setColourId(pieceColourways(product)[0]?.id ?? "");
  }, [product.id]);
  const colourway = ways.find((way) => way.id === colourId) ?? ways[0];
  const onSize = () => openDialog({ type: "size-guide" });
  if (!colourway) return null;
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/shop">The wardrobe</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category}`}>
          {product.category}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <section className="product-page">
        <ProductGallery
          key={colourway.id}
          frames={productFrames(colourway)}
          name={product.name}
          label="THE FULL LOOK"
        />
        <div className="product-info">
          <span className="eyebrow">THE BECOMING COLLECTION</span>
          <h1>{product.name}</h1>
          <p className="product-price">{money(product.price)}</p>
          <p className="product-description">{product.description}</p>
          <ProductPurchase product={product} colourway={colourway} onColour={setColourId} />
          <div className="product-accordions">
            <details open>
              <summary>
                Details & care <Plus size={14} />
              </summary>
              <p>
                {product.fabric}.
              </p>
            </details>
            <details>
              <summary>
                Fit & sizing <Plus size={14} />
              </summary>
              <p>
                Compare your measurements with our UK size guide. For any
                measurement adjustments, leave a note when placing your order.
              </p>
              <button className="text-link" onClick={onSize}>
                View size guide <ArrowUpRight size={13} />
              </button>
            </details>
            <details>
              <summary>
                Delivery & returns <Plus size={14} />
              </summary>
              <p>
                Delivery is complimentary. Payment is taken through Paystack.
              </p>
            </details>
          </div>
        </div>
      </section>
      <section className="section related">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONTINUE YOUR EXPLORATION</span>
            <h2>In good company</h2>
          </div>
          <Link to="/shop" className="text-link">
            Explore all pieces <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>
    </>
  );
}
