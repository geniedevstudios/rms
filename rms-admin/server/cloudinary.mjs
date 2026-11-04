import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { HttpError } from "./content-store.mjs";

export function cloudinaryConfig(env = process.env) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function signature(params, apiSecret) {
  const signed = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(signed + apiSecret).digest("hex");
}

export function cloudinaryAsset(url) {
  const match = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url);
  if (!match) return null;
  return { resourceType: match[1], publicId: decodeURIComponent(match[2]) };
}

export async function uploadToCloudinary(filePath, { cloudName, apiKey, apiSecret, resourceType, publicId, overwrite = false }) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: "rms", public_id: publicId, timestamp, ...(overwrite ? { overwrite: "true" } : {}) };
  const form = new FormData();
  form.append("file", new Blob([await readFile(filePath)]));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", "rms");
  form.append("public_id", publicId);
  if (overwrite) form.append("overwrite", "true");
  form.append("signature", signature(params, apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: "POST", body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.secure_url) throw new HttpError(502, "Cloudinary could not store that file.");
  return body.secure_url;
}

export async function destroyCloudinary(url, config) {
  const asset = cloudinaryAsset(url);
  if (!asset || !config) return;
  const timestamp = Math.round(Date.now() / 1000);
  const params = { public_id: asset.publicId, timestamp };
  const body = new URLSearchParams({
    public_id: asset.publicId,
    timestamp: String(timestamp),
    api_key: config.apiKey,
    signature: signature(params, config.apiSecret),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${asset.resourceType}/destroy`, { method: "POST", body });
  if (!response.ok) throw new HttpError(502, "Cloudinary could not remove that file.");
}
