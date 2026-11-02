import "../product/product.styles.css";
import "./custom.styles.css";
import { Plus, ArrowUpRight, ArrowRight } from "lucide-react";
import { customDesigns, type CustomDesign } from "../../data/custom-designs";
import { ProductPurchase } from "../../features/products/product-purchase/product-purchase";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { money } from "../../lib/format-currency";
import { Link } from "../../routing/link";
import { CustomDesignCard } from "./custom-design-card";

export function CustomDesignPage({ design }: { design: CustomDesign }) {
  const { openDialog } = useDialogs();
  const others = customDesigns.filter((item) => item.id !== design.id);
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/custom">Custom</Link>
        <span>/</span>
        <span>{design.name}</span>
      </div>
      <section className="product-page">
        <div className="product-gallery">
          <img
            src={design.image}
            alt={`${design.name} — full look in ${design.color}`}
          />
          <span>MADE TO ORDER / 01</span>
        </div>
        <div className="product-info">
          <span className="eyebrow">CUSTOM MADE</span>
          <h1>{design.name}</h1>
          <p className="product-price">{money(design.price)}</p>
          <p className="product-lead">Ready in {design.leadDays} days</p>
          <p className="product-description">{design.description}</p>
          <ProductPurchase product={design} />
          <div className="product-accordions">
            <details open>
              <summary>
                Details & care <Plus size={14} />
              </summary>
              <p>
                {design.fabric}. Cut to your measurements once the size is
                confirmed. Sample composition and care information; final
                garment details will be provided with the RMS collection.
              </p>
            </details>
            <details>
              <summary>
                Fit & sizing <Plus size={14} />
              </summary>
              <p>
                Choose your usual size using the indicative guide. The piece is
                then made for you.
              </p>
              <button
                className="text-link"
                onClick={() => openDialog({ type: "size-guide" })}
              >
                View size guide <ArrowUpRight size={13} />
              </button>
            </details>
            <details>
              <summary>
                Delivery & returns <Plus size={14} />
              </summary>
              <p>
                This design is ready in {design.leadDays} days once your
                measurements are confirmed. This is a storefront preview. No
                payment is taken.
              </p>
            </details>
          </div>
        </div>
      </section>
      <section className="section related">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MORE FROM THE ATELIER</span>
            <h2>Other custom designs</h2>
          </div>
          <Link to="/custom" className="text-link">
            All custom designs <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {others.map((item) => (
            <CustomDesignCard key={item.id} design={item} />
          ))}
        </div>
      </section>
    </>
  );
}
