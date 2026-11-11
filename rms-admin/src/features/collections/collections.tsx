import { createContentHandle } from "../../lib/content-handle";
import { useState } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import type { Collection } from "../../../shared/content.types";
import { useContent } from "../../app/content.context";
import { PageHeading, Thumb, Modal, Field } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { MediaField } from "../media/media-picker";

type StatementLine = NonNullable<Collection["statement"]>["lines"][number];

/** The words shown between a collection banner and its pieces. */
function statementFields(statement?: Collection["statement"]) {
  if (!statement) return { eyebrow: "", body: "" };
  const rows: { text: string; emphasis: boolean }[][] = [];
  statement.lines.forEach((line, index) => {
    const startsRow = index === 0 || line.break === true || (line.break == null && index === 1);
    const piece = { text: line.text, emphasis: Boolean(line.emphasis) };
    if (startsRow || !rows.length) rows.push([piece]);
    else rows[rows.length - 1].push(piece);
  });
  const body = rows
    .map((segments) => {
      const visible = segments.filter((segment) => segment.text);
      if (visible.length === 1 && visible[0].emphasis) return visible[0].text;
      return segments.map((segment) => (segment.emphasis ? `*${segment.text}*` : segment.text)).join("");
    })
    .join("\n");
  return { eyebrow: statement.eyebrow, body };
}

function markedLines(row: string) {
  const parts: { text: string; emphasis: boolean }[] = [];
  const pattern = /\*([^*]+)\*/g;
  let last = 0;
  for (const match of row.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: row.slice(last, start), emphasis: false });
    parts.push({ text: match[1], emphasis: true });
    last = start + match[0].length;
  }
  if (last < row.length) parts.push({ text: row.slice(last), emphasis: false });
  return parts.filter((part) => part.text);
}

function readStatement(eyebrow: string, body: string): Collection["statement"] | undefined {
  const rows = body.replace(/\s+$/, "").split("\n");
  const written = eyebrow.trim() || rows.some((row) => row.trim());
  if (!written) return undefined;
  const marked = rows.some((row) => row.includes("*"));
  const last = rows.reduce((found, row, index) => (row.trim() ? index : found), -1);
  const lines: StatementLine[] = [];
  rows.forEach((row, rowIndex) => {
    const segments = marked ? markedLines(row) : [{ text: row, emphasis: rowIndex === last && last > 0 }];
    if (!segments.length) segments.push({ text: "", emphasis: false });
    segments.forEach((segment, segmentIndex) => {
      const line: StatementLine = { text: segment.text };
      if (segment.emphasis) line.emphasis = true;
      if (!(rowIndex === 0 && segmentIndex === 0)) line.break = rowIndex > 0 && segmentIndex === 0;
      lines.push(line);
    });
  });
  return { eyebrow: eyebrow.trim(), lines };
}

export function Collections() {
  const { content, update } = useContent();
  const [editing, setEditing] = useState<Collection | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [words, setWords] = useState({ eyebrow: "", body: "" });
  const [error, setError] = useState("");
  function open(c?: Collection) {
    setError("");
    setOriginal(c?.id || null);
    setWords(statementFields(c?.statement));
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
    const statement = readStatement(words.eyebrow, words.body);
    if (statement && statement.lines.length > 10) {
      setError("Keep the statement to ten lines.");
      return;
    }
    update((c) => {
      const id = original ?? createContentHandle(editing.label, c.collections.map(item => item.id), "collection");
      const saved = { ...editing, id, statement };
      if (!statement) delete saved.statement;
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
              <Field
                label="Between the banner and the pieces"
                hint="The small heading above the statement."
              >
                <input
                  value={words.eyebrow}
                  onChange={(e) => setWords((current) => ({ ...current, eyebrow: e.target.value }))}
                />
              </Field>
              <Field
                label="Statement"
                hint="One line per row. The last line is italic. Wrap a word in *asterisks* to italicise only that word."
              >
                <textarea
                  rows={3}
                  value={words.body}
                  onChange={(e) => setWords((current) => ({ ...current, body: e.target.value }))}
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
                you’d like them to appear. A piece already in another
                collection stays there. Draft products appear on the
                storefront only after they are made active and published.
                Made-to-order designs are managed separately.
              </p>
              {!content.products.length && (
                <p className="muted">
                  Add a ready-to-wear product first, then select it here.
                </p>
              )}
              <div className="product-checklist">
                {content.products.map((p) => {
                  const home = content.collections.find(
                    (collection) =>
                      collection.id !== original &&
                      collection.productIds.includes(p.id),
                  );
                  const selected = editing.productIds.includes(p.id);
                  const taken = Boolean(home) && !selected;
                  const homeName = home
                    ? home.title.map((line) => line.text.trim()).filter(Boolean).join(" ") || home.label
                    : "";
                  return (
                    <label key={p.id} className={taken ? "is-taken" : undefined}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={taken}
                        onChange={(e) => {
                          if (taken) return;
                          patch({
                            productIds: e.target.checked
                              ? [...editing.productIds, p.id]
                              : editing.productIds.filter((id) => id !== p.id),
                          });
                        }}
                      />
                      <Thumb src={p.image} />
                      <span>
                        {p.name}
                        <small>
                          {p.category}
                          {p.status === "draft" ? " · Draft" : ""}
                          {taken ? ` · In ${homeName}` : ""}
                        </small>
                      </span>
                      {selected && (
                        <span className="count">
                          {editing.productIds.indexOf(p.id) + 1}
                        </span>
                      )}
                    </label>
                  );
                })}
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
