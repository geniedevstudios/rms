import { createContentHandle } from "../../lib/content-handle";
import { useState } from "react";
import { Plus, ArrowUpRight, Star, ArrowUp, ArrowDown } from "lucide-react";
import type { Journal } from "../../../shared/content.types";
import { useContent } from "../../app/content.context";
import { PageHeading, Thumb, Modal, Field, Empty } from "../../components/ui";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { MediaField } from "../media/media-picker";
export function JournalEditor() {
  const { content, update } = useContent();
  const [editing, setEditing] = useState<Journal | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  function open(j?: Journal) {
    setOriginal(j?.id || null);
    setError("");
    setPreview(false);
    setEditing(
      j
        ? structuredClone(j)
        : {
            id: "",
            title: "",
            label: "THE POINT OF VIEW",
            excerpt: "",
            body: "",
            image: "",
            hover: "",
            alt: "",
            status: "draft",
            featured: false,
            readMinutes: 3,
          },
    );
  }
  const patch = (p: Partial<Journal>) =>
    setEditing((j) => (j ? { ...j, ...p } : j));
  function save() {
    if (!editing) return;
    if (!editing.title.trim()) {
      setError("Add a story title.");
      return;
    }
    if (!editing.image) {
      setError("Upload or choose a cover image for this story.");
      return;
    }
    update((c) => {
      const id = original ?? createContentHandle(editing.title, c.journals.map(item => item.id), "story");
      const saved = { ...editing, id };
      if (original) c.journals = c.journals.map(item => item.id === original ? saved : item);
      else c.journals.unshift(saved);
    });
    setEditing(null);
  }
  return (
    <>
      <PageHeading
        eyebrow="NOTES FROM OUR WORLD"
        title="Stories with substance."
        description="A point of view, shared through the RMS journal."
        action={
          <button className="button" onClick={() => open()}>
            <Plus size={16} /> Write a story
          </button>
        }
      />
      <div className="journal-cards">
        {content.journals.map((j, i) => (
          <article className="panel journal-tile" key={j.id}>
            <button className="journal-cover" onClick={() => open(j)}>
              <Thumb src={j.image} alt={j.alt} />
              <span
                className={`badge ${j.status === "published" ? "green" : ""}`}
              >
                {j.status === "published" ? "Ready to publish" : "Draft"}
              </span>
            </button>
            <div className="journal-info">
              <span className="eyebrow">{j.label}</span>
              <h2>{j.title}</h2>
              <p>{j.excerpt}</p>
              <div className="journal-meta">
                <span>{j.readMinutes} min read</span>
                {j.featured && (
                  <span>
                    <Star size={12} /> Featured on home
                  </span>
                )}
              </div>
              <div className="panel-footer">
                <div className="row-actions">
                  <button
                    className="icon-button"
                    disabled={!i}
                    aria-label={`Move ${j.title} up`}
                    onClick={() =>
                      update((c) => {
                        [c.journals[i - 1], c.journals[i]] = [
                          c.journals[i],
                          c.journals[i - 1],
                        ];
                      })
                    }
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={i === content.journals.length - 1}
                    aria-label={`Move ${j.title} down`}
                    onClick={() =>
                      update((c) => {
                        [c.journals[i + 1], c.journals[i]] = [
                          c.journals[i],
                          c.journals[i + 1],
                        ];
                      })
                    }
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button className="text-button" onClick={() => open(j)}>
                  Edit story <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!content.journals.length && (
        <Empty
          title="Your next story starts here."
          description="Write your first journal entry to share your point of view."
        />
      )}
      {editing && (
        <Modal
          title={original ? "Edit journal story" : "A new story"}
          onClose={() => setEditing(null)}
          wide
        >
          <div className="tabs">
            <button
              className={!preview ? "active" : ""}
              onClick={() => setPreview(false)}
            >
              Write
            </button>
            <button
              className={preview ? "active" : ""}
              onClick={() => setPreview(true)}
            >
              Reading preview
            </button>
          </div>
          {preview ? (
            <article className="story-preview">
              <span className="eyebrow">{editing.label}</span>
              <h1>{editing.title || "Your story title"}</h1>
              <p>{editing.excerpt}</p>
              <Thumb src={editing.image} alt={editing.alt} />
              {editing.body
                .split(/\n\s*\n/)
                .map((p, i) =>
                  p.startsWith("## ") ? (
                    <h2 key={i}>{p.slice(3)}</h2>
                  ) : (
                    <p key={i}>{p}</p>
                  ),
                )}
            </article>
          ) : (
            <div className="form-grid">
              <div>
                <Field label="Title">
                  <input
                    value={editing.title}
                    onChange={(e) =>
                      patch({
                        title: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Editorial category">
                  <input
                    value={editing.label}
                    onChange={(e) => patch({ label: e.target.value })}
                  />
                </Field>
                <Field label="Opening summary">
                  <textarea
                    rows={3}
                    value={editing.excerpt}
                    onChange={(e) => patch({ excerpt: e.target.value })}
                  />
                </Field>
                <Field
                  label="Story"
                  hint="Separate paragraphs with a blank line. Start a subheading with ##."
                >
                  <textarea
                    className="story-input"
                    rows={13}
                    value={editing.body}
                    onChange={(e) => patch({ body: e.target.value })}
                  />
                </Field>
              </div>
              <div>
                <MediaField
                  label="Cover photograph"
                  value={editing.image}
                  onChange={(m) => patch({ image: m.url, alt: m.alt })}
                />
                <MediaField
                  label="Hover photograph"
                  value={editing.hover}
                  onChange={(m) => patch({ hover: m.url })}
                />
                <Field label="Cover alternative text">
                  <input
                    value={editing.alt}
                    onChange={(e) => patch({ alt: e.target.value })}
                  />
                </Field>
                <Field label="Reading time · minutes">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editing.readMinutes}
                    onChange={(e) =>
                      patch({ readMinutes: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Visibility">
                  <SelectMenu
                    label="Visibility"
                    value={editing.status}
                    onChange={(value) =>
                      patch({ status: value as Journal["status"] })
                    }
                    options={[
                      { value: "draft", label: "Draft — keep in the studio" },
                      { value: "published", label: "Include when published" },
                    ]}
                  />
                </Field>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(e) => patch({ featured: e.target.checked })}
                  />{" "}
                  Feature on the homepage
                </label>
              </div>
            </div>
          )}
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
