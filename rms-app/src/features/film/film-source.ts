import { mediaSlot } from "../../content/content";
export const atelierPreview = mediaSlot("atelier-film").src;
export const atelierFilm = atelierPreview;

export function youtubeId(src: string) {
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }
  return null;
}
