import { createContentHandle } from "../../lib/content-handle";
import { useState } from "react";
import { Plus, Search, ArrowUpRight } from "lucide-react";
import type { Product } from "../../../shared/content.types";
import { useContent } from "../../app/content.context";
import { PageHeading, Thumb, Modal, Field, Empty } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { Collections } from "../collections/collections";
import { ColourwaysField, colourwaysFrom, commitColourways } from "./colourways-field";
const categories = ["Pants", "Tops", "Two piece", "Skirts", "Dresses"] as const;

/** Point draft links (banners, buttons, collections) at a piece's new storefront link. */
function moveLinks(value: unknown, links: [from: string, to: string][]) {
  const rewrite = (text: string) => {
    for (const [oldLink, newLink] of links) {
      if (text === oldLink) return newLink;
      if (text.startsWith(oldLink + "?") || text.startsWith(oldLink + "#")) return newLink + text.slice(oldLink.length);
    }
    return text;
  };
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const item = record[key];
      if (typeof item === "string") record[key] = rewrite(item);
      else walk(item);
    }
  };
  walk(value);
}
export function Catalog({
  section = "products",
  onSection,
}: {
  section?: "products" | "collections";
  onSection?: (section: "products" | "collections") => void;
}) {
  const { content, update, state } = useContent();
  const [custom, setCustom] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [editing, setEditing] = useState<Product | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  // What the open piece will be when applied. It differs from the tab while it is being moved.
  const [pieceCustom, setPieceCustom] = useState(false);
  const [source, setSource] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const list = custom ? content.customDesigns : content.products;
  const moving = pieceCustom !== custom;
  function open(product?: Product) {
    setOriginal(product?.id || null);
    setPieceCustom(custom);
    setSource(product ? structuredClone(product) : null);
    setConfirmDelete(false);
    setError("");
    setEditing(
      product
        ? structuredClone(product)
        : {
            id: "",
            name: "",
            category: custom ? "Dresses" : "Tops",
            price: 0,
            color: "",
            swatch: "",
            image: "",
            hoverImage: "",
            description: "",
            fabric: "",
            status: "draft",
            availableSizes: [],
            ...(custom ? { leadDays: 21 } : { newArrival: false, bestSeller: false, featured: false }),
          },
    );
  }
  function patch(next: Partial<Product>) {
    setEditing((p) => (p ? { ...p, ...next } : p));
  }
  function movePiece() {
    const toCustom = !pieceCustom;
    setPieceCustom(toCustom);
    setError("");
    setEditing((p) => {
      if (!p) return p;
      const next = { ...p };
      if (toCustom) {
        next.leadDays = source?.leadDays ?? p.leadDays ?? 21;
        delete next.newArrival;
        delete next.bestSeller;
        delete next.featured;
      } else {
        delete next.leadDays;
        next.newArrival = Boolean(source?.newArrival);
        next.bestSeller = Boolean(source?.bestSeller);
        next.featured = Boolean(source?.featured);
      }
      return next;
    });
  }
  function save() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("Add a product name.");
      return;
    }
    if (editing.price < 0 || !Number.isFinite(editing.price)) {
      setError("Enter a valid price.");
      return;
    }
    if (pieceCustom && !(Number.isInteger(editing.leadDays) && editing.leadDays! >= 1 && editing.leadDays! <= 365)) {
      setError("Making time must be a whole number of days from 1 to 365.");
      return;
    }
    const committed = commitColourways(colourwaysFrom(editing), pieceCustom);
    if ("error" in committed) {
      setError(committed.error);
      return;
    }
    const colourways = committed.colourways;
    const lead = colourways[0];
    if (!lead) {
      setError("Add a colour for this piece.");
      return;
    }
    update((c) => {
      const key = custom ? "customDesigns" : "products";
      const targetKey = pieceCustom ? "customDesigns" : "products";
      const handles = (skip?: Product) =>
        [...c.products, ...c.customDesigns].flatMap((p) => (p === skip ? [] : [p.id, ...(p.previousIds ?? [])]));
      let id = original ?? createContentHandle(editing.name, handles(), "piece");
      // The link name follows the name, including pieces renamed before this was added. A piece that was ever published keeps its old
      // link as a redirect, so shared links, saved bags and wishlists still work.
      const before = original ? c[key].find((p) => p.id === original) : undefined;
      let previousIds = before?.previousIds ?? [];
      if (original && before) {
        const next = createContentHandle(editing.name, handles(before), "piece");
        if (next !== original) {
          const everPublished = [...state.published.products, ...state.published.customDesigns].some((p) => p.id === original);
          id = next;
          previousIds = [...new Set(everPublished ? [...previousIds, original] : previousIds)].filter((old) => old !== next);
          for (const collection of c.collections) {
            collection.productIds = collection.productIds.map((productId) => (productId === original ? next : productId));
          }
          moveLinks(c, [[`/product/${original}`, `/product/${next}`], [`/custom/${original}`, `/custom/${next}`]]);
        }
      }
      const saved: Product = {
        ...editing,
        id,
        previousIds: previousIds.length ? previousIds : undefined,
        careInstructions: editing.careInstructions?.trim() || undefined,
        colourways,
        color: lead.color,
        swatch: lead.swatch,
        image: lead.image,
        hoverImage: lead.hoverImage,
        gallery: lead.gallery,
        availableSizes: lead.availableSizes,
        stock: lead.stock,
      };
      if (pieceCustom) {
        delete saved.newArrival;
        delete saved.bestSeller;
        delete saved.featured;
      } else {
        delete saved.leadDays;
        saved.newArrival = Boolean(editing.newArrival);
        saved.bestSeller = Boolean(editing.bestSeller);
        saved.featured = Boolean(editing.featured);
      }
      if (original && key === targetKey) c[key] = c[key].map(p => p.id === original ? saved : p);
      else if (original) {
        // Moving between ready to wear and made to order: the piece keeps its link name.
        c[key] = c[key].filter((p) => p.id !== original);
        c[targetKey].push(saved);
        const [from, to] = pieceCustom ? ["product", "custom"] : ["custom", "product"];
        moveLinks(c, [[`/${from}/${id}`, `/${to}/${id}`]]);
      } else c[targetKey].push(saved);
    });
    setEditing(null);
  }
  function remove() {
    if (!original) return;
    update((draft) => {
      if (custom) {
        draft.customDesigns = draft.customDesigns.filter((piece) => piece.id !== original);
      } else {
        draft.products = draft.products.filter((piece) => piece.id !== original);
      }
      for (const collection of draft.collections) {
        collection.productIds = collection.productIds.filter((id) => id !== original);
      }
    });
    setEditing(null);
    setConfirmDelete(false);
  }
  const visible = [...list].reverse().filter(
    (p) =>
      (category === "All categories" || p.category === category) &&
      `${p.name} ${(p.colourways ?? [{ color: p.color }]).map((way) => way.color).join(" ")}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="tabs centered" aria-label="Products">
        <button
          className={section === "products" && !custom ? "active" : ""}
          aria-current={section === "products" && !custom ? "page" : undefined}
          onClick={() => {
            setCustom(false);
            if (section !== "products") onSection?.("products");
          }}
        >
          Ready to wear <span>{content.products.length}</span>
        </button>
        <button
          className={section === "products" && custom ? "active" : ""}
          aria-current={section === "products" && custom ? "page" : undefined}
          onClick={() => {
            setCustom(true);
            if (section !== "products") onSection?.("products");
          }}
        >
          Made to order <span>{content.customDesigns.length}</span>
        </button>
        <button
          className={section === "collections" ? "active" : ""}
          aria-current={section === "collections" ? "page" : undefined}
          onClick={() => onSection?.("collections")}
        >
          Collections <span>{content.collections.length}</span>
        </button>
      </div>
      {section === "collections" ? (
        <Collections />
      ) : (
        <>
      <PageHeading
        eyebrow="THE WARDROBE"
        title="Considered pieces."
        description="Keep your catalogue as thoughtful as the clothes themselves."
        action={
          <button className="button" onClick={() => open()}>
            <Plus size={16} /> Add {custom ? "design" : "product"}
          </button>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            value={query}
            placeholder="Search pieces or colours…"
            aria-label="Search catalogue"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <SelectMenu
          variant="toolbar"
          label="Filter category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "All categories", label: "All categories" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Piece</th>
              <th>Category</th>
              <th>Price · GHS</th>
              <th>{custom ? "Lead time" : "Colour"}</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td>
                  <button className="product-name" onClick={() => open(p)}>
                    <Thumb src={p.image} alt={p.name} />
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.id}</small>
                    </span>
                  </button>
                </td>
                <td>{p.category}</td>
                <td>
                  {p.price.toLocaleString("en-GH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td>
                  {custom ? (
                    `${p.leadDays} days`
                  ) : (
                    <span className="colour-label">
                      {(p.colourways?.length ? p.colourways : [{ color: p.color, swatch: p.swatch }])
                        .filter((way) => way.color.trim())
                        .map((way) => (
                          <span key={way.color}>
                            {/^#[0-9a-fA-F]{6}$/.test(way.swatch) && (
                              <i style={{ background: way.swatch }} />
                            )}
                            {way.color}
                          </span>
                        ))}
                      {!(p.colourways?.some((way) => way.color.trim()) || p.color.trim()) && (
                        <span className="muted">No colour</span>
                      )}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${p.status === "active" ? "green" : ""}`}
                  >
                    {p.status === "active" ? "Active" : "Draft"}
                  </span>
                  {!custom && p.newArrival && (
                    <span className="badge">New arrival</span>
                  )}
                  {!custom && p.bestSeller && (
                    <span className="badge">Best seller</span>
                  )}
                  {!custom && p.featured && (
                    <span className="badge">Featured</span>
                  )}
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${p.name}`}
                    onClick={() => open(p)}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <Empty
            title="No pieces found"
            description="Try a different category or add a new piece."
          />
        )}
      </div>
      <p className="footnote">
        Prices are in Ghana cedis. Draft pieces stay off the storefront when you
        publish.
      </p>
      {editing && (
        <Modal
          title={original ? "Edit piece" : "A new piece"}
          onClose={() => setEditing(null)}
          wide
        >
          <div className="form-grid">
            <div>
              <Field label="Product name">
                <input
                  value={editing.name}
                  onChange={(e) =>
                    patch({
                      name: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="form-grid">
                <Field label="Category">
                  <SelectMenu
                    label="Category"
                    value={editing.category}
                    onChange={(value) =>
                      patch({ category: value as Product["category"] })
                    }
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                </Field>
                <Field label="Price · GHS">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.price}
                    onChange={(e) => patch({ price: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows={4}
                  value={editing.description}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </Field>
              <Field label="Fabric">
                <input
                  value={editing.fabric}
                  onChange={(e) => patch({ fabric: e.target.value })}
                />
              </Field>
              <Field
                label="Care instructions"
                hint="Add instructions specific to this piece. Leave blank to use standard care."
              >
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={editing.careInstructions ?? ""}
                  onChange={(e) => patch({ careInstructions: e.target.value })}
                />
              </Field>
            </div>
            <div>
              <Field label="Label (optional)">
                <input
                  placeholder="NEW SEASON"
                  value={editing.tag || ""}
                  onChange={(e) => patch({ tag: e.target.value })}
                />
              </Field>
              {pieceCustom && !moving && (
                <Field label="Making time · days">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editing.leadDays}
                    onChange={(e) =>
                      patch({ leadDays: Number(e.target.value) })
                    }
                  />
                </Field>
              )}
              {!pieceCustom && (
                <div className="piece-flags">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.newArrival)}
                      onChange={(e) => patch({ newArrival: e.target.checked })}
                    />
                    New arrival — header menu and the New arrivals page
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.bestSeller)}
                      onChange={(e) => patch({ bestSeller: e.target.checked })}
                    />
                    Best seller — the Best sellers section on the homepage
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.featured)}
                      onChange={(e) => patch({ featured: e.target.checked })}
                    />
                    Feature on homepage — the row above Find your expression
                  </label>
                </div>
              )}
              <Field label="Availability">
                <SelectMenu
                  label="Availability"
                  value={editing.status}
                  onChange={(value) =>
                    patch({ status: value as Product["status"] })
                  }
                  options={[
                    {
                      value: "active",
                      label: "Active — include when published",
                    },
                    {
                      value: "draft",
                      label: "Draft — hidden from storefront",
                    },
                  ]}
                />
              </Field>
              <p className="inline-note">
                Photography and copy are saved with your content draft. Publish
                to update the storefront.
              </p>
            </div>
          </div>
          <ColourwaysField
            key={`${original ?? "new"}-${pieceCustom ? "custom" : "ready"}`}
            product={editing}
            trackStock={!pieceCustom}
            onChange={(colourways) => {
              const lead = colourways[0];
              patch({
                colourways,
                color: lead?.color ?? "",
                swatch: lead?.swatch ?? "",
                image: lead?.image ?? "",
                hoverImage: lead?.hoverImage,
                gallery: lead?.gallery,
                availableSizes: lead?.availableSizes,
                stock: lead?.stock,
              });
            }}
          />
          {moving && (
            <div className="move-piece">
              <p className="inline-note">
                {pieceCustom
                  ? "This piece will move to Made to order when you apply to the draft. Stock counts are dropped. Set its making time:"
                  : "This piece will move to Ready to wear when you apply to the draft. Enter how many you made and how many are left for each size in the Colours section above."}
              </p>
              {pieceCustom && (
                <Field label="Making time · days">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editing.leadDays ?? ""}
                    onChange={(e) => patch({ leadDays: Number(e.target.value) })}
                  />
                </Field>
              )}
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {confirmDelete ? (
            <div className="delete-confirm">
              <p>Delete “{editing.name}” from the draft catalogue? Publish the draft to remove it from the storefront.</p>
              <button type="button" className="text-button" onClick={() => setConfirmDelete(false)}>
                Keep piece
              </button>
              <button type="button" className="button" onClick={remove}>
                Confirm deletion
              </button>
            </div>
          ) : (
            <div className="modal-actions">
              {original && (
                <button type="button" className="button secondary danger" onClick={() => setConfirmDelete(true)}>
                  Delete {custom ? "design" : "product"}
                </button>
              )}
              {original && (
                <button type="button" className="button secondary" onClick={movePiece}>
                  {moving ? "Undo move" : pieceCustom ? "Move to ready to wear" : "Move to made to order"}
                </button>
              )}
              <button type="button" className="button secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="button" onClick={save}>
                Apply to draft
              </button>
            </div>
          )}
        </Modal>
      )}
        </>
      )}
    </>
  );
}
