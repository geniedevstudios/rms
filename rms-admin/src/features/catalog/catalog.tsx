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
export function Catalog({
  section = "products",
  onSection,
}: {
  section?: "products" | "collections";
  onSection?: (section: "products" | "collections") => void;
}) {
  const { content, update } = useContent();
  const [custom, setCustom] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [editing, setEditing] = useState<Product | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const list = custom ? content.customDesigns : content.products;
  function open(product?: Product) {
    setOriginal(product?.id || null);
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
    const committed = commitColourways(colourwaysFrom(editing), custom);
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
      const id = original ?? createContentHandle(editing.name, [...c.products, ...c.customDesigns].map(p => p.id), "piece");
      const saved: Product = {
        ...editing,
        id,
        colourways,
        color: lead.color,
        swatch: lead.swatch,
        image: lead.image,
        hoverImage: lead.hoverImage,
        gallery: lead.gallery,
        availableSizes: lead.availableSizes,
        stock: lead.stock,
      };
      if (custom) {
        delete saved.newArrival;
        delete saved.bestSeller;
        delete saved.featured;
      } else {
        saved.newArrival = Boolean(editing.newArrival);
        saved.bestSeller = Boolean(editing.bestSeller);
        saved.featured = Boolean(editing.featured);
      }
      if (original) c[key] = c[key].map(p => p.id === original ? saved : p);
      else c[key].push(saved);
    });
    setEditing(null);
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
              <Field label="Fabric & care">
                <input
                  value={editing.fabric}
                  onChange={(e) => patch({ fabric: e.target.value })}
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
              {custom && (
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
              {!custom && (
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
            key={original ?? "new"}
            product={editing}
            trackStock={!custom}
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
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button className="button" onClick={save}>
              Apply to draft
            </button>
          </div>
        </Modal>
      )}
        </>
      )}
    </>
  );
}
