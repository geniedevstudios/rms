import defaults from "../../../rms-admin/shared/default-content.json";
import type { Content } from "../../../rms-admin/shared/content.types";
import { rewriteMedia } from "../../../rms-admin/shared/media-url.mjs";
import { supabase } from "../lib/supabase";

type HotData = {
  siteContent?: Content;
  hasPublishedContent?: boolean;
  listeners?: Set<() => void>;
};

const hot = import.meta.hot?.data as HotData | undefined;
const listeners = hot?.listeners ?? new Set<() => void>();
const blank =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function isBuiltInMedia(value: string) {
  return (
    value.startsWith("/media/") ||
    value.startsWith("/uploads/") ||
    value.startsWith("/images/") ||
    value.startsWith("/videos/") ||
    /^https:\/\/res\.cloudinary\.com\//.test(value)
  );
}

function withoutBuiltInMedia(value: unknown): unknown {
  if (typeof value === "string") {
    if (!isBuiltInMedia(value)) return value;
    return /\/video\/|\.(mp4|webm)(\?|$)/i.test(value) ? "" : blank;
  }
  if (Array.isArray(value)) return value.map(withoutBuiltInMedia);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, withoutBuiltInMedia(item)]),
    );
  }
  return value;
}

export let hasPublishedContent = Boolean(hot?.hasPublishedContent);
export let siteContent: Content = (
  hot?.hasPublishedContent && hot.siteContent
    ? rewriteMedia(hot.siteContent)
    : withoutBuiltInMedia(structuredClone(defaults))
) as Content;
let liveRevision = -1;
let liveStamp = "";

function notify() {
  listeners.forEach((listener) => listener());
}

function isContent(value: unknown): value is Content {
  if (!value || typeof value !== "object") return false;
  const content = value as Content;
  return Boolean(
    content.hero?.slides?.length &&
      Array.isArray(content.products) &&
      Array.isArray(content.slots) &&
      Array.isArray(content.journals),
  );
}

function applyPublished(content: unknown, revision?: number, updatedAt?: string) {
  if (!isContent(content)) return false;
  const stamp = typeof updatedAt === "string" ? updatedAt : "";
  if (typeof revision === "number" && liveRevision >= 0 && revision < liveRevision) return true;
  if (hasPublishedContent && revision === liveRevision && (!stamp || stamp === liveStamp)) return true;
  siteContent = rewriteMedia(content) as Content;
  hasPublishedContent = true;
  if (typeof revision === "number") liveRevision = revision;
  if (stamp) liveStamp = stamp;
  notify();
  return true;
}

export function subscribeContent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function readLiveStorefront() {
  const { data, error } = await supabase
    .from("storefront")
    .select("content, revision, updated_at")
    .eq("id", "live")
    .maybeSingle();
  if (error || !data) return false;
  return applyPublished(data.content, data.revision, data.updated_at);
}

export async function loadPublishedContent(origin = "", strict = false) {
  try {
    const response = await fetch(`${origin}/api/cms/published`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Content service unavailable");
    const { content, revision } = await response.json();
    if (!applyPublished(content, revision)) throw new Error("Invalid content");
  } catch (error) {
    if (!hasPublishedContent) {
      try {
        await readLiveStorefront();
      } catch (liveError) {
        if (strict) throw liveError;
      }
    }
    if (strict && !hasPublishedContent) throw error;
  }
}

export function watchPublishedContent() {
  const pull = async () => {
    await readLiveStorefront();
  };
  const channel = supabase
    .channel("storefront-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "storefront",
        filter: "id=eq.live",
      },
      (payload) => {
        const row = payload.new as { content?: unknown; revision?: number; updated_at?: string };
        if (!applyPublished(row?.content, row?.revision, row?.updated_at)) void pull();
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void pull();
    });
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function mediaSlot(id: string) {
  const slot = siteContent.slots.find((slot) => slot.id === id);
  if (!slot) throw new Error(`Missing content placement: ${id}`);
  return slot;
}

if (import.meta.hot) {
  import.meta.hot.dispose((data: HotData) => {
    data.siteContent = siteContent;
    data.hasPublishedContent = hasPublishedContent;
    data.listeners = listeners;
  });
  import.meta.hot.accept(() => {
    void loadPublishedContent();
  });
}
