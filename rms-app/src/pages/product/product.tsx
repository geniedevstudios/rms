import "./product.styles.css";
import { type Product } from "../../types/product";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { money } from "../../lib/format-currency";
import { ProductPurchase } from "../../features/products/product-purchase/product-purchase";
import { Plus, ArrowUpRight, ArrowRight } from "lucide-react";
import { products } from "../../data/products";
import { ProductCard } from "../../features/products/product-card/product-card";
export function ProductPage({ product }: { product: Product }) {
  const { openDialog } = useDialogs();
  const onSize = () => openDialog({ type: "size-guide" });
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
        <div className="product-gallery">
          <img
            src={product.image}
            alt={`${product.name} — full look in ${product.color}`}
          />
          <span>THE FULL LOOK / 01</span>
        </div>
        <div className="product-info">
          <span className="eyebrow">THE BECOMING COLLECTION</span>
          <h1>{product.name}</h1>
          <p className="product-price">{money(product.price)}</p>
          <p className="product-description">{product.description}</p>
          <ProductPurchase product={product} />
          <div className="product-accordions">
            <details open>
              <summary>
                Details & care <Plus size={14} />
              </summary>
              <p>
                {product.fabric}. Sample composition and care information; final
                garment details will be provided with the RMS collection.
              </p>
            </details>
            <details>
              <summary>
                Fit & sizing <Plus size={14} />
              </summary>
              <p>
                Choose your usual size using the indicative guide. These
                photographs are styling references; model measurements and final
                garment measurements are not yet available.
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
                This is a storefront preview. Live delivery options, lead times
                and the returns policy will be confirmed before launch. No
                payment is taken.
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
