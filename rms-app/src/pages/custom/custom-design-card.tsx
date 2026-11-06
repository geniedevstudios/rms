import "../../features/products/product-card/product-card.styles.css";
import { ArrowUpRight } from "lucide-react";
import type { CustomDesign } from "../../data/custom-designs";
import { money } from "../../lib/format-currency";
import { Link } from "../../routing/link";
import { customPath } from "../../routing/navigation";
import { HoverImage } from "../../components/hover-image/hover-image";
import { pieceColour } from "../../features/products/colour";

export function CustomDesignCard({ design }: { design: CustomDesign }) {
  const to = customPath(design.id);
  const colour = pieceColour(design);
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={to} className="product-image">
          <HoverImage
            src={design.image}
            hover={design.hoverImage}
            alt={colour ? `${design.name} in ${colour.name}` : design.name}
          />
        </Link>
        <Link to={to} className="quick-view">
          Order this design <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="product-details">
        <div>
          <Link to={to}>{design.name}</Link>
          {colour && <span>{colour.name}</span>}
        </div>
        <p>{money(design.price)}</p>
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
