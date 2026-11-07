import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { notificationMessage } from "./templates.mjs";
const types = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
export async function buildNotificationMessage(
  kind,
  record,
  audience,
  config,
  directory,
) {
  const attachments = [
    {
      filename: "invitation-hero.jpg",
      content: (
        await readFile(new URL("./assets/invitation-hero.jpg", import.meta.url))
      ).toString("base64"),
      content_type: "image/jpeg",
      content_id: "invitation-hero",
    },
  ];
  const imageSources = [];
  const known = new Map();
  let bytes = 0;
  for (const [index, item] of (record.items || []).entries()) {
    const src = String(item.image || "");
    if (known.has(src)) {
      imageSources.push(known.get(src));
      continue;
    }
    let image = "";
    if (src.startsWith("/uploads/")) {
      const root = resolve(directory, "uploads");
      const path = resolve(root, src.slice("/uploads/".length));
      if (path.startsWith(root + sep) && types[extname(path).toLowerCase()]) {
        try {
          const data = await readFile(path);
          if (
            data.length <= 5 * 1024 * 1024 &&
            bytes + data.length <= 12 * 1024 * 1024
          ) {
            bytes += data.length;
            image = `cid:product-${index}`;
            attachments.push({
              filename: `product-${index}${extname(path)}`,
              content: data.toString("base64"),
              content_type: types[extname(path).toLowerCase()],
              content_id: `product-${index}`,
            });
          }
        } catch {
          /* Use the public asset URL when an image is hosted separately. */
        }
      }
      if (!image) image = new URL(src, config.storefrontUrl).href;
    } else if (
      src.startsWith("/") &&
      !src.startsWith("//") &&
      !src.includes("..") &&
      !src.includes("\\")
    ) {
      image = new URL(src, config.storefrontUrl).href;
    } else {
      try {
        const url = new URL(src);
        if (url.protocol === "https:" && !url.username && !url.password)
          image = url.href;
      } catch {
        /* Text details remain available if no usable image exists. */
      }
    }
    known.set(src, image);
    imageSources.push(image);
  }
  return {
    ...notificationMessage(kind, record, audience, config, imageSources),
    attachments,
  };
}
