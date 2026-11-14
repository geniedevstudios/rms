import { AwsClient } from "aws4fetch";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { HttpError } from "./content-store.mjs";

const mimeByExtension = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  mp4: "video/mp4", webm: "video/webm",
};
const uploadLifetimeSeconds = 300;
const receiptLifetimeMs = 30 * 60 * 1000;

export function r2Config(env = process.env) {
  const { R2_S3_ENDPOINT, R2_BUCKET, R2_PUBLIC_BASE_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  const values = [R2_S3_ENDPOINT, R2_BUCKET, R2_PUBLIC_BASE_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY];
  if (!values.some(Boolean)) return null;
  if (!values.every(Boolean)) throw new Error("Complete all five RMS R2 settings.");
  const endpoint = new URL(R2_S3_ENDPOINT);
  const publicBase = new URL(R2_PUBLIC_BASE_URL);
  if ([endpoint, publicBase].some(url => url.protocol !== "https:" || url.username || url.password ||
    url.pathname !== "/" || url.search || url.hash) ||
    !endpoint.hostname.endsWith(".r2.cloudflarestorage.com") ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(R2_BUCKET)) {
    throw new Error("Check the RMS R2 endpoint, bucket, and public media URL.");
  }
  return {
    publicBase: publicBase.origin,
    endpoint: endpoint.origin + "/" + R2_BUCKET,
    client: new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" }),
    sign(payload) {
      return createHmac("sha256", R2_SECRET_ACCESS_KEY).update(payload).digest("base64url");
    },
  };
}

export async function prepareR2Upload(config, body, email, purpose) {
  const type = typeof body?.type === "string" ? body.type : "";
  const extension = Object.keys(mimeByExtension).find(ext => mimeByExtension[ext] === type);
  if (!extension || (purpose === "profile" && !type.startsWith("image/"))) {
    throw new HttpError(400, "Choose a JPG, PNG, WebP, GIF, MP4, or WebM file supported here.");
  }
  const limit = type.startsWith("image/") ? 15 : 100;
  if (!Number.isSafeInteger(body.size) || body.size < 1 || body.size > limit * 1024 * 1024) {
    throw new HttpError(413, `Choose a non-empty file up to ${limit} MB.`);
  }
  const id = randomUUID();
  const key = `rms/${purpose}/${id}.${extension}`;
  const name = typeof body.name === "string" ? body.name.split(/[\\/]/).pop().trim().slice(0, 160) : "";
  const payload = Buffer.from(JSON.stringify({
    id, key, name: name || "Upload", mime: type, size: body.size,
    email, purpose, expires: Date.now() + receiptLifetimeMs,
  })).toString("base64url");
  const uploadUrl = new URL(config.endpoint + "/" + key);
  uploadUrl.searchParams.set("X-Amz-Expires", String(uploadLifetimeSeconds));
  const signed = await config.client.sign(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": type, "Content-Length": String(body.size) },
    aws: { signQuery: true, allHeaders: true },
  });
  return { uploadUrl: signed.url, contentType: type, receipt: payload + "." + config.sign(payload) };
}

export async function inspectR2Upload(config, receipt, email, purpose, mediaType) {
  if (typeof receipt !== "string" || receipt.length > 3000)
    throw new HttpError(400, "The upload receipt is invalid. Upload the file again.");
  const [payload, signature, extra] = receipt.split(".");
  const expected = config.sign(payload);
  if (extra !== undefined || !signature || Buffer.byteLength(signature) !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new HttpError(400, "The upload receipt is invalid. Upload the file again.");
  }
  const upload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (upload.email !== email || upload.purpose !== purpose || upload.expires < Date.now()) {
    throw new HttpError(400, "The upload receipt expired or belongs to another session.");
  }
  const end = Math.min(upload.size, 32) - 1;
  const response = await config.client.fetch(config.endpoint + "/" + upload.key, {
    headers: { Range: `bytes=0-${end}` },
    signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 206 || response.headers.get("content-range") !== `bytes 0-${end}/${upload.size}` ||
    response.headers.get("content-type") !== upload.mime) {
    await response.body?.cancel();
    throw new HttpError(400, "The stored upload does not match the selected file.");
  }
  const [extension, type] = mediaType(Buffer.from(await response.arrayBuffer()));
  if (mimeByExtension[extension] !== upload.mime)
    throw new HttpError(400, "The file contents do not match its media type.");
  return {
    id: upload.id, name: upload.name, url: config.publicBase + "/" + upload.key,
    type, alt: "", size: upload.size, createdAt: new Date().toISOString(),
  };
}

export async function deleteR2Media(config, url) {
  if (!config || !url.startsWith(config.publicBase + "/")) return;
  const key = url.slice(config.publicBase.length + 1);
  if (!/^rms\/media\/[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm)$/.test(key)) return;
  const response = await config.client.fetch(config.endpoint + "/" + key, {
    method: "DELETE", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(502, "R2 could not remove that file.");
}
