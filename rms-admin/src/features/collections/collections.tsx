import { createContentHandle } from "../../lib/content-handle";
import { useState } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import type { Collection } from "../../../shared/content.types";
import { useContent } from "../../app/content.context";
import { PageHeading, Thumb, Modal, Field } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { MediaField } from "../media/media-picker";
export function Collections() {
  const { content, update } = useContent();
  const [editing, setEditing] = useState<Collection | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");
  function open(c?: Collection) {
    setError("");
    setOriginal(c?.id || null);
    setEditing(
      c
        ? structuredClone(c)
        : {
            id: "",
            label: "",
            image: "",
            imageAlt: "",
            title: [{ text: "" }],
            description: [""],
            productIds: [],
            status: "draft",
          },
    );
  }
  const patch = (p: Partial<Collection>) =>
    setEditing((c) => (c ? { ...c, ...p } : c));
  function save() {
    if (!editing) return;
    if (!editing.label.trim()) {
      setError("Add a collection label.");
      return;
    }
    if (!editing.image) {
      setError("Upload or choose an image for this collection.");
      return;
    }
    update((c) => {
      const id = original ?? createContentHandle(editing.label, c.collections.map(item => item.id), "collection");
      const saved = { ...editing, id };
      if (original) c.collections = c.collections.map(item => item.id === original ? saved : item);
      else c.collections.push(saved);
    });
    setEditing(null);
  }
  return (
    <>
      <PageHeading
        eyebrow="THE EDIT"
        title="A considered collection."
        description="Bring pieces together with a shared point of view."
        action={
          <button className="button" onClick={() => open()}>
            <Plus size={16} /> New collection
          </button>
        }
      />
      <div className="collection-cards">
        {content.collections.map((c) => (
          <section className="panel collection-tile" key={c.id}>
            <Thumb src={c.image} alt={c.imageAlt} />
            <div>
              <span className="eyebrow">{c.label}</span>
              <h2>{c.title.map((t) => t.text).join(" ")}</h2>
              <p>{c.description.join(" ")}</p>
              <div className="collection-stats">
                <span>{c.productIds.length} pieces</span>
                <span
                  className={`badge ${c.status === "published" ? "green" : ""}`}
                >
                  {c.status === "published" ? "Ready to publish" : "Draft"}
                </span>
              </div>
              <button className="button secondary" onClick={() => open(c)}>
                Edit collection <ArrowUpRight size={15} />
              </button>
            </div>
          </section>
        ))}
      </div>
      {editing && (
        <Modal
          title="Shape your collection"
          onClose={() => setEditing(null)}
          wide
        >
          <div className="form-grid">
            <div>
              <Field label="Collection label">
                <input
                  value={editing.label}
                  onChange={(e) => patch({ label: e.target.value })}
                />
              </Field>
              <Field
                label="Headline"
                hint="One line per row; the last line is italicised."
              >
                <textarea
                  rows={3}
                  value={editing.title.map((t) => t.text).join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    patch({
                      title: lines.map((text, i) => ({
                        text,
                        emphasis: i === lines.length - 1 && i > 0,
                      })),
                    });
                  }}
                />
              </Field>
              <Field label="Introduction">
                <textarea
                  rows={3}
                  value={editing.description.join("\n")}
                  onChange={(e) =>
                    patch({ description: e.target.value.split("\n") })
                  }
                />
              </Field>
              <MediaField
                label="Collection image"
                value={editing.image}
                onChange={(m) => patch({ image: m.url, imageAlt: m.alt })}
              />
              <Field label="Image alternative text">
                <input
                  value={editing.imageAlt}
                  onChange={(e) => patch({ imageAlt: e.target.value })}
                />
              </Field>
              <Field label="Visibility">
                <SelectMenu
                  label="Visibility"
                  value={editing.status}
                  onChange={(value) =>
                    patch({ status: value as Collection["status"] })
                  }
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Include when published" },
                  ]}
                />
              </Field>
            </div>
            <div>
              <h3>Pieces in this collection</h3>
              <p className="muted">
                Choose from your saved ready-to-wear products in the order
                you’d like them to appear. Draft products appear on the
                storefront only after they are made active and published.
                Made-to-order designs are managed separately.
              </p>
              {!content.products.length && (
                <p className="muted">
                  Add a ready-to-wear product first, then select it here.
                </p>
              )}
              <div className="product-checklist">
                {content.products.map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={editing.productIds.includes(p.id)}
                      onChange={(e) =>
                        patch({
                          productIds: e.target.checked
                            ? [...editing.productIds, p.id]
                            : editing.productIds.filter((id) => id !== p.id),
                        })
                      }
                    />
                    <Thumb src={p.image} />
                    <span>
                      {p.name}
                      <small>
                        {p.category}{p.status === "draft" ? " · Draft" : ""}
                      </small>
                    </span>
                    {editing.productIds.includes(p.id) && (
                      <span className="count">
                        {editing.productIds.indexOf(p.id) + 1}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
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
  );
}
