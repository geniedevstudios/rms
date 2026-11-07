const delivery =
  /^https:\/\/res\.cloudinary\.com\/[a-z0-9-]+\/(image|video)\/upload\/([A-Za-z0-9][A-Za-z0-9_./-]*)(?:\?.*)?$/i;

/** A same-site path for a hosted photograph or film. Other addresses stay as they are. */
export function toWebsiteMedia(url) {
  if (typeof url !== "string") return url;
  const match = delivery.exec(url);
  if (!match || match[2].includes("..")) return url;
  return `/media/${match[1].toLowerCase()}/${match[2]}`;
}

const imageThumb = "c_fill,w_480,h_600,q_auto,f_auto";
const videoThumb = "so_0,c_fill,w_480,h_600,q_auto,f_jpg";

/** A small preview for library grids. The stored address stays unchanged. */
export function libraryThumb(url, video = false) {
  if (typeof url !== "string" || !url) return url;
  const step = video ? videoThumb : imageThumb;
  const cloud = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/)(image|video)\/upload\/(.+)$/i.exec(url);
  if (cloud) {
    const path = cloud[3];
    if (path.startsWith("c_fill,") || path.startsWith("so_0,")) return url;
    const kind = video ? "video" : cloud[2].toLowerCase();
    return `${cloud[1]}${kind}/upload/${step}/${path}`;
  }
  const local = /^\/media\/(image|video)\/(.+)$/i.exec(url);
  if (!local) return url;
  const path = local[2];
  if (path.startsWith("c_fill,") || path.startsWith("so_0,")) return url;
  const kind = video ? "video" : local[1].toLowerCase();
  return `/media/${kind}/${step}/${path}`;
}

export function rewriteMedia(value) {
  if (typeof value === "string") return toWebsiteMedia(value);
  if (Array.isArray(value)) return value.map(rewriteMedia);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteMedia(item)]),
    );
  }
  return value;
}
