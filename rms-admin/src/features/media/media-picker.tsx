import { useRef, useState } from "react";
import { Upload, Check, ImagePlus } from "lucide-react";
import { Modal, Thumb, Empty } from "../../components/ui";
import { useContent } from "../../app/content.context";
import { upload } from "../../lib/api";
import type { Media } from "../../../shared/content.types";
export function UploadButton({
  onUploaded,
  kind,
}: {
  onUploaded?: (media: Media) => void;
  kind?: "image" | "video";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const { accept, notify, setError } = useContent();
  async function process(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setProgress(0);
    try {
      for (const file of Array.from(files)) {
        if (kind && !file.type.startsWith(kind + "/"))
          throw new Error(`Choose a ${kind} file.`);
        if (
          file.size >
          (file.type.startsWith("image/") ? 15 : 100) * 1024 * 1024
        )
          throw new Error(
            "Images must be under 15 MB and videos under 100 MB.",
          );
        const state = await upload(file, setProgress);
        accept(state);
        onUploaded?.(state.media[0]);
      }
      notify("Upload complete. Your media is ready to use.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        multiple={!onUploaded}
        accept={
          kind === "image"
            ? "image/jpeg,image/png,image/webp,image/gif"
            : kind === "video"
              ? "video/mp4,video/webm"
              : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        }
        onChange={(e) => void process(e.target.files)}
      />
      <button
        type="button"
        className="button"
        disabled={progress !== null}
        onClick={() => input.current?.click()}
      >
        <Upload size={15} />
        {progress === null ? "Upload media" : `Uploading ${progress}%`}
      </button>
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
  const assets = state.media.filter(
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
