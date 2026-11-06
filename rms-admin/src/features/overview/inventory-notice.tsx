import { Modal, Thumb } from "../../components/ui";
import { inventoryNote, inventoryNotices } from "./inventory";
import type { Product } from "../../../shared/content.types";
import "./inventory-notice.styles.css";

export function InventoryNotice({
  products,
  onClose,
  onOpenCatalogue,
}: {
  products: Product[];
  onClose: () => void;
  onOpenCatalogue: () => void;
}) {
  const notices = inventoryNotices(products);
  return (
    <Modal title="Inventory notice" onClose={onClose}>
      <p className="inventory-lead">
        Active pieces with two or fewer left in a size. Each line shows what
        remains, and how many you made.
      </p>
      {notices.length === 0 ? (
        <p className="inventory-clear" role="status">
          Every size you have counted still has three or more left.
        </p>
      ) : (
        <ul className="inventory-list">
          {notices.map(({ product, sizes }) => (
            <li key={product.id}>
              <Thumb src={product.image} alt="" />
              <span>
                <strong>{product.name}</strong>
                <small>
                  {[product.color.trim(), product.category]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                <ul className="inventory-levels">
                  {sizes.map((entry) => (
                    <li key={entry.size}>
                      <span>{entry.color ? `${entry.color} · ${entry.size}` : entry.size}</span>
                      <em className={entry.left === 0 ? "is-out" : ""}>
                        {inventoryNote(entry)}
                      </em>
                    </li>
                  ))}
                </ul>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="modal-actions">
        <button className="button" onClick={onOpenCatalogue}>
          Open the catalogue
        </button>
      </div>
    </Modal>
  );
}
