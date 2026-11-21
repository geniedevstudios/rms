import { useState } from "react";
import { Search, Trash2, Check, Film, Image } from "lucide-react";
import { useContent } from "../../app/content.context";
import {
  PageHeading,
  Thumb,
  Modal,
  ConfirmModal,
  Field,
  Empty,
  formatDate,
} from "../../components/ui";
import { UploadButton } from "./media-picker";
import { mediaSortOptions, sortMedia, useMediaSort, type MediaSort } from "./media-sort";
import { SelectMenu } from "../../components/select-menu/select-menu";
import { canRemoveMediaFromLibrary, isDeletableMedia } from "../../../shared/media-url.mjs";
import { api } from "../../lib/api";
import { references } from "../../../shared/references.mjs";
import type { AdminState, Media } from "../../../shared/content.types";
export function MediaLibrary() {
  const { state, accept, setError, notify, content } = useContent();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Media | null>(null);
  const [alt, setAlt] = useState("");
  const [name, setName] = useState("");
  const [sort, setSort] = useMediaSort();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const assets = sortMedia(state.media, sort)
    .filter(
    (m) =>
      (filter === "all" || m.type === filter) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function edit() {
    if (!selected) return;
    if (!name.trim()) {
      setError("Give this file a name.");
      return;
    }
    setBusy(true);
    try {
      accept(
        await api<AdminState>("media/" + selected.id, {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim(), alt }),
        }),
      );
      notify("Media details saved.");
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
      notify("Removed from the media library.");
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
          [content, state.draft, state.published].flatMap((entry) =>
            references(entry)
              .filter((ref) => ref.url === selected.url)
              .map((ref) => ref.label),
          ),
        ),
      ]
    : [];
  const hasAnotherEntry = !!selected && state.media.some(
    (asset) => asset.id !== selected.id && asset.url === selected.url,
  );
  const canRemove = canRemoveMediaFromLibrary(selected?.url);
  const keepFile = hasAnotherEntry || !isDeletableMedia(selected?.url);
  const blockedByPlacement = usedIn.length > 0 && !hasAnotherEntry;
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
        <SelectMenu
          variant="toolbar"
          label="Sort media"
          value={sort}
          onChange={(value) => setSort(value as MediaSort)}
          options={mediaSortOptions}
        />
      </div>
      <div className="media-grid">
        {assets.map((m) => (
          <button
            className="media-tile"
            key={m.id}
            onClick={() => {
              setSelected(m);
              setAlt(m.alt);
              setName(m.name);
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
            label="Name"
            hint="Only changes how this file is listed in your library. Its web address stays the same."
          >
            <input
              value={name}
              maxLength={160}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
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
              <Check size={14} /> Used in {usedIn.join(", ")}.{" "}
              {blockedByPlacement
                ? "Replace it in the saved draft and published site before removing it."
                : "The other library entry will keep these placements working."}
            </p>
          )}
          {!canRemove && <p className="inline-note">This original storefront asset is protected.</p>}
          <div className="modal-actions">
            <button
              className="button secondary danger"
              disabled={busy || blockedByPlacement || !canRemove}
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={14} /> {keepFile ? "Remove from library" : "Delete"}
            </button>
            <button
              className="button"
              disabled={busy || !name.trim()}
              onClick={() => void edit()}
            >
              Save changes
            </button>
          </div>
        </Modal>
      )}
      {selected && confirm && (
        <ConfirmModal
          title={keepFile ? "Remove from library?" : "Delete this file?"}
          message={
            keepFile
              ? `Remove “${selected.name}” from the media library? The stored file will stay available.`
              : `Permanently delete “${selected.name}”? This cannot be undone.`
          }
          confirmLabel={keepFile ? "Remove entry" : "Delete file"}
          cancelLabel="Keep file"
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() => void remove()}
        />
      )}
    </>
  );
}
