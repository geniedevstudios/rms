/**
 * Photographs are stored in Cloudflare R2 and served from media.rivermindstyle.com.
 * That domain can resize on request, so ask for the best format (WebP/AVIF) at a
 * sensible width instead of sending the original. If resizing ever fails,
 * `onerror=redirect` falls back to the original file.
 */
const baseWidth = 2000;
const resizable =
  /^https:\/\/media\.rivermindstyle\.com\/(?!cdn-cgi\/)rms\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp)$/i;
const resize = (width) =>
  `/cdn-cgi/image/width=${width},quality=80,format=auto,onerror=redirect`;

function optimizeImage(url) {
  if (!resizable.test(url)) return url;
  const asset = new URL(url);
  return asset.origin + resize(baseWidth) + asset.pathname + asset.search;
}

/** A smaller copy of an already optimised storefront photo, for cards and grids. */
export function optimizedImage(url, width = baseWidth) {
  if (typeof url !== "string") return url;
  const from = resize(baseWidth) + "/";
  return url.includes(from) ? url.replace(from, resize(width) + "/") : url;
}

export function rewriteMedia(value) {
  if (typeof value === "string") return optimizeImage(value);
  if (Array.isArray(value)) return value.map(rewriteMedia);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteMedia(item)]),
    );
  }
  return value;
}
