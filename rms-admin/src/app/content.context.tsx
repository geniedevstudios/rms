import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AdminState, Content } from "../../shared/content.types";
import { api } from "../lib/api";
type Value = {
  state: AdminState;
  content: Content;
  dirty: boolean;
  pending: boolean;
  busy: boolean;
  message: string;
  error: string;
  setError: (v: string) => void;
  notify: (v: string) => void;
  update: (fn: (draft: Content) => void) => void;
  accept: (s: AdminState) => void;
  save: () => Promise<AdminState | undefined>;
  publish: () => Promise<boolean>;
  discard: () => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<Value | null>(null);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
export function ContentProvider({
  initial,
  children,
}: {
  initial: AdminState;
  children: ReactNode;
}) {
  const [state, setState] = useState(initial);
  const [content, setContent] = useState<Content>(() =>
    structuredClone(initial.draft),
  );
  const [busy, setBusy] = useState(false);
  const [message, notify] = useState("");
  const [error, setError] = useState("");
  const dirty = canonical(content) !== canonical(state.draft);
  const pending = dirty || state.revision !== state.publishedRevision;
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => notify(""), 5000);
    return () => clearTimeout(t);
  }, [message]);
  function update(fn: (draft: Content) => void) {
    setContent((current) => {
      const next = structuredClone(current);
      fn(next);
      return next;
    });
    setError("");
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const next = await api<AdminState>("draft", {
        method: "PUT",
        body: JSON.stringify({ content, revision: state.revision }),
      });
      setState(next);
      setContent(structuredClone(next.draft));
      notify("Draft saved. Publish when you’re ready.");
      return next;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    setError("");
    try {
      const saved = dirty
        ? await api<AdminState>("draft", {
            method: "PUT",
            body: JSON.stringify({ content, revision: state.revision }),
          })
        : state;
      setState(saved);
      setContent(structuredClone(saved.draft));
      const next = await api<AdminState>("publish", {
        method: "POST",
        body: JSON.stringify({ revision: saved.revision }),
      });
      setState(next);
      setContent(structuredClone(next.draft));
      notify("Published. Your storefront is up to date.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function discard() {
    setBusy(true);
    try {
      const next = await api<AdminState>("discard", {
        method: "POST",
        body: JSON.stringify({ revision: state.revision }),
      });
      setState(next);
      setContent(structuredClone(next.draft));
      setError("");
      notify("Restored the published version.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    setBusy(true);
    try {
      const next = await api<AdminState>("state");
      setState(next);
      setContent(structuredClone(next.draft));
      setError("");
      notify("Loaded the latest saved draft.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        content,
        dirty,
        pending,
        busy,
        message,
        error,
        setError,
        notify,
        update,
        accept: setState,
        save,
        publish,
        discard,
        reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useContent() {
  const value = useContext(Context);
  if (!value) throw new Error("ContentProvider is required");
  return value;
}
