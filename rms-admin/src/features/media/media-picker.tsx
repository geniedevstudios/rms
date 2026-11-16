import { useRef, useState } from "react";
import { Upload, Check, ImagePlus, ChevronDown } from "lucide-react";
import { Modal, Thumb, Empty } from "../../components/ui";
import { useContent } from "../../app/content.context";
import { upload } from "../../lib/api";
import { chooseDriveFiles, downloadDriveFiles, drivePickerConfigured, loadDrivePicker } from "./drive-picker";
import type { Media } from "../../../shared/content.types";
export function UploadButton({
  onUploaded,
  kind,
}: {
  onUploaded?: (media: Media) => void;
  kind?: "image" | "video";
}) {
  const input = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [status, setStatus] = useState("");
  const [driveReady, setDriveReady] = useState(false);
  const { accept, notify, setError } = useContent();
  const images = "image/jpeg,image/png,image/webp,image/gif";
  const videos = "video/mp4,video/webm";
  const mimeTypes = kind === "image" ? images : kind === "video" ? videos : images + "," + videos;

  async function process(files: Iterable<File> | AsyncIterable<File>) {
    for await (const file of files) {
      if (kind && !file.type.startsWith(kind + "/")) throw new Error(`Choose a ${kind} file.`);
      if (file.size > (file.type.startsWith("image/") ? 15 : 100) * 1024 * 1024) {
        throw new Error("Images must be under 15 MB and videos under 100 MB.");
      }
      setStatus("Uploading 0%");
      const state = await upload(file, (progress) => setStatus(`Uploading ${progress}%`));
      accept(state);
      onUploaded?.(state.media[0]);
    }
    notify("Upload complete. Your media is ready to use.");
  }

  async function fromDevice(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    try {
      await process(Array.from(files));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setStatus("");
      if (input.current) input.current.value = "";
    }
  }

  async function fromDrive() {
    if (menu.current) menu.current.open = false;
    setError("");
    setStatus("Opening Google Drive…");
    try {
      const selection = await chooseDriveFiles(mimeTypes, !onUploaded);
      if (!selection?.ids.length) return;
      setStatus("Importing from Google Drive…");
      await process(downloadDriveFiles(selection.ids, selection.token, mimeTypes));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setStatus("");
    }
  }

  function openDevicePicker() {
    if (menu.current) menu.current.open = false;
    input.current?.click();
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        multiple={!onUploaded}
        accept={mimeTypes}
        onChange={(event) => void fromDevice(event.target.files)}
      />
      {drivePickerConfigured && !status ? (
        <details
          ref={menu}
          className="upload-sources"
          onToggle={(event) => {
            if (event.currentTarget.open && !driveReady) {
              void loadDrivePicker()
                .then(() => setDriveReady(true))
                .catch((error: Error) => {
                  if (menu.current) menu.current.open = false;
                  setError(error.message);
                });
            }
          }}
          onBlur={(event) => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
              event.currentTarget.open = false;
            }
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !event.currentTarget.open) return;
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }}
        >
          <summary className="button">
            <Upload size={15} /> Upload media <ChevronDown size={14} />
          </summary>
          <div className="upload-source-options">
            <button type="button" onClick={openDevicePicker}>From your device</button>
            <button type="button" onClick={() => void fromDrive()} disabled={!driveReady}>Google Drive</button>
          </div>
        </details>
      ) : (
        <button type="button" className="button" disabled={Boolean(status)} onClick={openDevicePicker}>
          <Upload size={15} />
          {status || "Upload media"}
        </button>
      )}
    </>
  );
}
export function MediaPicker({
  onSelect,
  onClose,
  kind,
}: {
  onSelect: (media: Media) => void;
  onClose: () => void;
  kind?: "image" | "video";
}) {
  const { state } = useContent();
  const [query, setQuery] = useState("");
  const assets = [...state.media]
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
    .filter(
    (m) =>
      (!kind || m.type === kind) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal title="Choose from your library" onClose={onClose} wide>
      <div className="toolbar">
        <input
          aria-label="Search media"
          placeholder="Search files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <UploadButton
          kind={kind}
          onUploaded={(m) => {
            onSelect(m);
            onClose();
          }}
        />
      </div>
      <p className="muted">
        Images up to 15 MB · MP4 and WebM videos up to 100 MB
      </p>
      <div className="media-picker-results" role="region" aria-label="Media files" tabIndex={0}>
        <div className="picker-grid">
          {assets.map((m) => (
            <button
              type="button"
              key={m.id}
              className="media-choice"
              onClick={() => {
                onSelect(m);
                onClose();
              }}
            >
              <Thumb src={m.url} video={m.type === "video"} alt={m.alt} />
              <span>{m.name}</span>
              <Check size={15} />
            </button>
          ))}
        </div>
        {!assets.length && (
          <Empty
            title="No matching files"
            description="Try a different search, or upload new media."
          />
        )}
      </div>
    </Modal>
  );
}
export function MediaField({
  label,
  value,
  onChange,
  onClear,
  kind = "image",
}: {
  label: string;
  value: string;
  onChange: (media: Media) => void;
  onClear?: () => void;
  kind?: "image" | "video" | "any";
}) {
  const [open, setOpen] = useState(false);
  const { state } = useContent();
  const media = state.media.find((m) => m.url === value);
  return (
    <div className="field">
      <span>{label}</span>
      <button
        type="button"
        className="media-field"
        onClick={() => setOpen(true)}
      >
        <Thumb src={value} video={media?.type === "video"} />
        <span>
          {media?.name || (value ? "Selected media" : "Choose media")}
          <small>{value ? "Replace from library" : "Upload or choose from library"}</small>
        </span>
        <ImagePlus size={18} />
      </button>
      {onClear && value && (
        <button type="button" className="text-button" onClick={onClear}>
          Remove photograph
        </button>
      )}
      {open && (
        <MediaPicker
          kind={kind === "any" ? undefined : kind}
          onClose={() => setOpen(false)}
          onSelect={onChange}
        />
      )}
    </div>
  );
}
