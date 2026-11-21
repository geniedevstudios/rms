import { useEffect, useState } from "react";
import { Check, FileImage, Plus, Upload, X } from "lucide-react";
import { Modal } from "../../components/ui";
import { chooseDriveFiles, downloadDriveFile, type DriveItem } from "./drive-picker";

type Preview = {
  id: string;
  file?: File;
  url?: string;
  error?: string;
};

type Phase = "queued" | "downloading" | "uploading" | "done" | "error";
type Progress = { phase: Phase; pct: number; error?: string };

const RING_RADIUS = 13;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function statusText({ phase, error }: Progress) {
  if (phase === "queued") return "Waiting…";
  if (phase === "downloading") return "Fetching from Google Drive…";
  if (phase === "uploading") return "Uploading…";
  if (phase === "done") return "Uploaded";
  return error || "Could not be imported.";
}

function StatusRing({ phase, pct }: Progress) {
  const fill = phase === "done" || phase === "error" ? 1 : phase === "uploading" ? pct / 100 : phase === "downloading" ? 0.28 : 0;
  return (
    <span className={`drive-ring is-${phase}`} aria-hidden="true">
      <svg className="drive-ring-svg" viewBox="0 0 32 32">
        <circle className="drive-ring-track" cx="16" cy="16" r={RING_RADIUS} />
        <circle
          className="drive-ring-arc"
          cx="16"
          cy="16"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - fill)}
        />
      </svg>
      {phase === "done" ? <Check className="drive-ring-check" size={14} strokeWidth={2.75} /> : phase === "error" ? <b>!</b> : phase === "uploading" ? <em>{pct}%</em> : null}
    </span>
  );
}

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
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  onComplete: () => void;
}) {
  const [items, setItems] = useState(selection.items);
  const [activeId, setActiveId] = useState(items[0].id);
  const [preview, setPreview] = useState<Preview>();
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [token, setToken] = useState(selection.token);
  const [importError, setImportError] = useState("");
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const active = (items.find(({ id }) => id === activeId) ?? items[0]).id;
  const current = preview?.id === active ? preview : undefined;
  const pending = items.filter(({ id }) => progress[id]?.phase !== "done");
  const doneCount = items.length - pending.length;
  const hasFailed = items.some(({ id }) => progress[id]?.phase === "error");
  const started = Object.keys(progress).length > 0;
  const allDone = started && pending.length === 0;

  useEffect(() => {
    setPreview(undefined);
    const controller = new AbortController();
    let url: string | undefined;
    downloadDriveFile(active, token, mimeTypes, controller.signal)
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
  }, [active, token, mimeTypes]);

  function removeFile(id: string) {
    if (items.length === 1) onClose();
    else setItems((list) => list.filter((item) => item.id !== id));
    setProgress(({ [id]: _removed, ...rest }) => rest);
  }

  async function importFiles() {
    const queue = pending;
    if (!queue.length) return;
    setImporting(true);
    setImportError("");
    setProgress((all) => {
      const next = { ...all };
      for (const { id } of queue) next[id] = { phase: "queued", pct: 0 };
      return next;
    });

    let failed = 0;
    for (const item of queue) {
      const update = (patch: Partial<Progress>) =>
        setProgress((all) => ({ ...all, [item.id]: { phase: "queued", pct: 0, ...all[item.id], ...patch } }));
      try {
        let file = item.id === current?.id ? current.file : undefined;
        if (!file) {
          update({ phase: "downloading", pct: 0, error: undefined });
          file = await downloadDriveFile(item.id, token, mimeTypes);
        }
        update({ phase: "uploading", pct: 0, error: undefined });
        await onUpload(file, (pct) => update({ phase: "uploading", pct }));
        update({ phase: "done", pct: 100 });
      } catch (error) {
        failed++;
        update({ phase: "error", pct: 0, error: (error as Error).message });
      }
    }

    if (failed) {
      setImporting(false);
      setImportError(
        `${failed} ${failed === 1 ? "file" : "files"} could not be imported. Remove ${failed === 1 ? "it" : "them"} or try again.`,
      );
    } else {
      // Keep the finished list on screen: choose more files, or close with Done.
      setImporting(false);
      onComplete();
    }
  }

  async function addMore() {
    setAdding(true);
    setImportError("");
    try {
      let result: Awaited<ReturnType<typeof chooseDriveFiles>>;
      try {
        result = await chooseDriveFiles(mimeTypes, true, token);
      } catch {
        // The earlier sign-in may have expired; ask Google once more.
        result = await chooseDriveFiles(mimeTypes, true);
      }
      if (!result) return;
      setToken(result.token);
      const known = new Set(items.map(({ id }) => id));
      const fresh = result.items.filter(({ id }) => !known.has(id));
      if (fresh.length) setItems((list) => [...list, ...fresh.filter(({ id }) => !list.some((item) => item.id === id))]);
    } catch (error) {
      setImportError((error as Error).message);
    } finally {
      setAdding(false);
    }
  }

  function previewUnavailable() {
    setPreview((value) => value?.id === active
      ? { ...value, error: "Your browser couldn’t preview this file. You can still import it." }
      : value);
  }

  return (
    <Modal title="Review Google Drive files" onClose={onClose} wide dismissible={!importing && !adding}>
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
          {items.map(({ id, name }) => {
            const state = progress[id];
            return (
              <li key={id} className={state ? `has-${state.phase}` : undefined}>
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
                {state ? (
                  <StatusRing {...state} />
                ) : (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${name} from import`}
                    disabled={importing}
                    onClick={() => removeFile(id)}
                  >
                    <X size={15} />
                  </button>
                )}
                {state && (
                  <div className="drive-review-status">
                    <small>{statusText(state)}</small>
                    {state.phase === "error" && !importing && (
                      <button type="button" className="text-button" onClick={() => removeFile(id)}>Remove</button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {started && (
        <p className="drive-review-summary" role="status">
          {doneCount} of {items.length} uploaded
        </p>
      )}
      {importError && <p className="drive-review-error" role="alert">{importError}</p>}
      <div className="modal-actions drive-review-actions">
        <button
          type="button"
          className="button secondary drive-review-more"
          disabled={importing || adding}
          onClick={() => void addMore()}
        >
          <Plus size={15} />
          {adding ? "Opening Google Drive…" : allDone ? "Continue uploading" : "Select more from Google Drive"}
        </button>
        {!allDone && (
          <button type="button" className="button secondary" onClick={onClose} disabled={importing || adding}>Cancel</button>
        )}
        {allDone ? (
          <button type="button" className="button" disabled={adding} onClick={onClose}>
            <Check size={15} />
            Done
          </button>
        ) : (
          <button type="button" className="button" disabled={importing || adding || !current || !pending.length} onClick={() => void importFiles()}>
            <Upload size={15} />
            {importing
              ? "Importing…"
              : hasFailed
                ? `Retry ${pending.length} ${pending.length === 1 ? "file" : "files"}`
                : `Import ${pending.length} ${pending.length === 1 ? "file" : "files"}`}
          </button>
        )}
      </div>
    </Modal>
  );
}
