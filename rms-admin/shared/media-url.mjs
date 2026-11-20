export function isR2Media(url) {
  return typeof url === "string" && /^https:\/\/media\.rivermindstyle\.com\/rms\/(?:media|profile|migrated)\//.test(url);
}

/** Whether the backing file can be deleted after removing its last library entry. */
export function isDeletableMedia(url) {
  return typeof url === "string" && (
    url.startsWith("/uploads/") ||
    (isR2Media(url) && url.startsWith("https://media.rivermindstyle.com/rms/media/"))
  );
}

/** Migrated files may be shared outside this library, so only remove their entries. */
export function canRemoveMediaFromLibrary(url) {
  return isDeletableMedia(url) || (isR2Media(url) && url.startsWith("https://media.rivermindstyle.com/rms/migrated/"));
}

/** A small preview for library grids. The stored address stays unchanged. */
export function libraryThumb(url, video = false) {
  if (typeof url !== "string" || !url) return url;
  if (isR2Media(url)) {
    const asset = new URL(url);
    if (video && /\.mp4$/i.test(asset.pathname)) {
      asset.hash = "";
      return `${asset.origin}/cdn-cgi/media/mode=frame,time=0s,width=480,format=jpg/${asset.href}`;
    }
    if (!video && /\.(?:jpe?g|png|webp|gif)$/i.test(asset.pathname)) {
      return asset.origin + "/cdn-cgi/image/width=480,quality=80,format=auto,onerror=redirect" +
        asset.pathname + asset.search;
    }
  }
  return url;
}
