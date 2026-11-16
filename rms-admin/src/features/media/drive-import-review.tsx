import { useEffect, useState } from "react";
import { FileImage, Upload, X } from "lucide-react";
import { Modal } from "../../components/ui";
import { downloadDriveFile, type DriveItem } from "./drive-picker";

type Preview = {
  id: string;
  file?: File;
  url?: string;
  error?: string;
};

export function DriveImportReview({
  selection,
  mimeTypes,
  onClose,
  onUpload,
  onComplete,
}: {
  selection: { items: DriveItem[]; token: string };
  mimeTypes: string;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onComplete: () => void;
}) {
  const [items, setItems] = useState(selection.items);
  const [activeId, setActiveId] = useState(items[0].id);
  const [preview, setPreview] = useState<Preview>();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const active = (items.find(({ id }) => id === activeId) ?? items[0]).id;
  const current = preview?.id === active ? preview : undefined;

  useEffect(() => {
    setPreview(undefined);
    const controller = new AbortController();
    let url: string | undefined;
    downloadDriveFile(active, selection.token, mimeTypes, controller.signal)
      .then((file) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(file);
        setPreview({ id: active, file, url });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setPreview({ id: active, error: error.message });
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [active, selection.token, mimeTypes]);

  function removeFile(id: string) {
    if (items.length === 1) onClose();
    else setItems((pending) => pending.filter((item) => item.id !== id));
  }

  async function importFiles() {
    setImporting(true);
    setImportError("");
    let uploaded = 0;
    try {
      for (const item of items) {
        const file = (item.id === current?.id ? current.file : undefined)
          ?? await downloadDriveFile(item.id, selection.token, mimeTypes);
        await onUpload(file);
        uploaded++;
      }
      onComplete();
      onClose();
    } catch (error) {
      setItems(items.slice(uploaded));
      setImportError((error as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function previewUnavailable() {
    setPreview((value) => value?.id === active
      ? { ...value, error: "Your browser couldn’t preview this file. You can still import it." }
      : value);
  }

  return (
    <Modal title="Review Google Drive files" onClose={onClose} wide dismissible={!importing}>
      <div className="drive-review" aria-busy={importing}>
        <div className="drive-review-preview">
          {current?.url && !current.error ? (
            current.file?.type.startsWith("video/") ? (
              <video key={current.url} src={current.url} controls playsInline onError={previewUnavailable} />
            ) : (
              <img key={current.url} src={current.url} alt={current.file?.name} onError={previewUnavailable} />
            )
          ) : (
            <p role="status"><FileImage size={25} />{current?.error || "Loading preview…"}</p>
          )}
        </div>
        <ul className="drive-review-list" aria-label="Selected files">
          {items.map(({ id, name }) => (
            <li key={id}>
              <button
                type="button"
                className="drive-review-file"
                aria-pressed={id === active}
                disabled={importing}
                title={name}
                onClick={() => setActiveId(id)}
              >
                {name}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${name} from import`}
                disabled={importing}
                onClick={() => removeFile(id)}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {importError && <p className="drive-review-error" role="alert">{importError}</p>}
      <div className="modal-actions drive-review-actions">
        <button type="button" className="button secondary" onClick={onClose} disabled={importing}>Cancel</button>
        <button type="button" className="button" disabled={importing || !current} onClick={() => void importFiles()}>
          <Upload size={15} />
          {importing ? "Importing…" : `Import ${items.length} ${items.length === 1 ? "file" : "files"}`}
        </button>
      </div>
    </Modal>
  );
}
