/** Public Cloudinary cloud already used in seed and live delivery URLs. */
const cloudHost = "https://res.cloudinary.com/hr5xa7o9";

const delivery =
  /^https:\/\/res\.cloudinary\.com\/[a-z0-9-]+\/(image|video)\/upload\/([A-Za-z0-9][A-Za-z0-9_./-]*)(?:\?.*)?$/i;
const localMedia =
  /^\/media\/(image|video)\/([A-Za-z0-9][A-Za-z0-9_.,/-]*)$/i;

/** Deliver photographs and films from Cloudinary. Same-site /media paths expand there. */
export function toWebsiteMedia(url) {
  if (typeof url !== "string") return url;
  if (delivery.test(url)) return url;
  const local = localMedia.exec(url);
  if (!local || local[2].includes("..")) return url;
  return `${cloudHost}/${local[1].toLowerCase()}/upload/${local[2]}`;
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
  const local = localMedia.exec(url);
  if (!local || local[2].includes("..")) return url;
  const path = local[2];
  if (path.startsWith("c_fill,") || path.startsWith("so_0,"))
    return `${cloudHost}/${local[1].toLowerCase()}/upload/${path}`;
  const kind = video ? "video" : local[1].toLowerCase();
  return `${cloudHost}/${kind}/upload/${step}/${path}`;
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
