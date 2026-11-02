import "../../features/products/product-card/product-card.styles.css";
import { ArrowUpRight } from "lucide-react";
import type { CustomDesign } from "../../data/custom-designs";
import { money } from "../../lib/format-currency";
import { Link } from "../../routing/link";
import { customPath } from "../../routing/navigation";

export function CustomDesignCard({ design }: { design: CustomDesign }) {
  const to = customPath(design.id);
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={to} className="product-image">
          <img
            src={design.image}
            alt={`${design.name} in ${design.color}`}
            loading="lazy"
          />
        </Link>
        <Link to={to} className="quick-view">
          Order this design <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="product-details">
        <div>
          <Link to={to}>{design.name}</Link>
          <span>{design.color}</span>
        </div>
        <p>{money(design.price)}</p>
      </div>
      <div
        className="product-swatch"
        style={{ backgroundColor: design.swatch }}
        title={design.color}
      />
    </article>
  );
}
