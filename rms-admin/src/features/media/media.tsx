import { useState } from "react";
import { Search, Trash2, Check, Film, Image } from "lucide-react";
import { useContent } from "../../app/content.context";
import {
  PageHeading,
  Thumb,
  Modal,
  Field,
  Empty,
  formatDate,
} from "../../components/ui";
import { UploadButton } from "./media-picker";
import { isDeletableMedia } from "../../../shared/media-url.mjs";
import { api } from "../../lib/api";
import { references } from "../../../shared/references.mjs";
import type { AdminState, Media } from "../../../shared/content.types";
export function MediaLibrary() {
  const { state, accept, setError, notify, content } = useContent();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Media | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const assets = [...state.media]
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
    .filter(
    (m) =>
      (filter === "all" || m.type === filter) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function edit() {
    if (!selected) return;
    setBusy(true);
    try {
      accept(
        await api<AdminState>("media/" + selected.id, {
          method: "PATCH",
          body: JSON.stringify({ alt }),
        }),
      );
      notify("Media description saved.");
      setSelected(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected) return;
    setBusy(true);
    try {
      accept(
        await api<AdminState>("media/" + selected.id, { method: "DELETE" }),
      );
      notify("Media removed.");
      setSelected(null);
      setConfirm(false);
    } catch (e) {
      setError((e as Error).message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  const usedIn = selected
    ? [
        ...new Set(
          [content, state.published].flatMap((entry) =>
            references(entry)
              .filter((ref) => ref.url === selected.url)
              .map((ref) => ref.label),
          ),
        ),
      ]
    : [];
  return (
    <>
      <PageHeading
        eyebrow="THE VISUAL LIBRARY"
        title="A world in images."
        description="Your photography and films, ready for their next chapter."
        action={<UploadButton />}
      />
      <div className="library-banner">
        <div className="library-icon">
          <Image size={25} />
        </div>
        <div>
          <strong>Every image has a place.</strong>
          <p>
            Upload once. Use across your homepage, collections, products, and
            journal.
          </p>
        </div>
        <span>
          JPG · PNG · WEBP · GIF
          <br />
          MP4 · WEBM
        </span>
      </div>
      <div className="toolbar">
        <div className="tabs compact">
          {[
            ["all", "All media"],
            ["image", "Photography"],
            ["video", "Films"],
          ].map(([id, label]) => (
            <button
              className={filter === id ? "active" : ""}
              onClick={() => setFilter(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search media library"
            placeholder="Find a file…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="media-grid">
        {assets.map((m) => (
          <button
            className="media-tile"
            key={m.id}
            onClick={() => {
              setSelected(m);
              setAlt(m.alt);
              setConfirm(false);
            }}
          >
            <Thumb src={m.url} alt={m.alt} video={m.type === "video"} />
            <div>
              <strong>{m.name}</strong>
              <span>
                {m.type === "video" ? <Film size={12} /> : <Image size={12} />}{" "}
                {m.size
                  ? `${(m.size / 1024 / 1024).toFixed(1)} MB`
                  : "Original asset"}
              </span>
            </div>
          </button>
        ))}
      </div>
      {!assets.length && (
        <Empty
          title="A little room for something new."
          description="No files match this view. Try another search or upload new media."
        />
      )}
      {selected && (
        <Modal
          title={selected.name}
          onClose={() => {
            if (!busy) setSelected(null);
          }}
        >
          <div className="media-detail">
            {selected.type === "video" ? (
              <video controls src={selected.url} />
            ) : (
              <img src={selected.url} alt={selected.alt} />
            )}
          </div>
          <div className="detail-meta">
            <span>{selected.type.toUpperCase()}</span>
            <span>{formatDate(selected.createdAt)}</span>
          </div>
          <Field
            label="Default alternative text"
            hint="Describe the image for people using a screen reader. This is copied when you next place this file."
          >
            <textarea
              rows={2}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </Field>
          {usedIn.length > 0 && (
            <p className="inline-note">
              <Check size={14} /> Used in {usedIn.join(", ")}. Replace it there
              before deleting.
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary danger"
              disabled={
                busy ||
                usedIn.length > 0 ||
                !isDeletableMedia(selected.url)
              }
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={14} /> Delete
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => void edit()}
            >
              Save description
            </button>
          </div>
          {confirm && (
            <div className="delete-confirm">
              <p>Permanently delete this uploaded file?</p>
              <button className="text-button" onClick={() => setConfirm(false)}>
                Keep file
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={() => void remove()}
              >
                Delete file
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
