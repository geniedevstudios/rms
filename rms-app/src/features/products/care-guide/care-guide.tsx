import "./care-guide.styles.css";
import type { Product } from "../../../types/product";

const standardCare = "Dry clean or machine wash at 30°C on a gentle cycle.";

export function PieceCare({ piece }: { piece: Pick<Product, "careInstructions" | "fabric"> }) {
  const fabric = piece.fabric.replace(/\s*·\s*specialist clean\.?\s*$/i, "").trim();

  return (
    <>
      {fabric && <p>{fabric}</p>}
      <p className="piece-care-instructions">{piece.careInstructions?.trim() || standardCare}</p>
    </>
  );
}

export function CareGuide() {
  return (
    <div className="care-guide">
      <p>{standardCare}</p>
      <p>
        For garment-specific care, check Details &amp; care on the product page
        and follow the care label sewn into your garment.
      </p>
    </div>
  );
}
