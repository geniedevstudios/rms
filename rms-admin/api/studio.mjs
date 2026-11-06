import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createApi } from "../server/api.mjs";
import { cloudinaryConfig } from "../server/cloudinary.mjs";

let handler;

function studio() {
  if (!handler) {
    handler = createApi({
      production: true,
      worker: false,
      directory: resolve(tmpdir(), "rms"),
      cloudinary: cloudinaryConfig(),
      supabase: {
        url: process.env.SUPABASE_URL,
        secret: process.env.SUPABASE_SECRET_KEY,
      },
    });
  }
  return handler;
}

export function requestPath(url = "/") {
  const current = new URL(url, "http://localhost");
  if (current.pathname.startsWith("/api/media/") || current.pathname.startsWith("/api/uploads/"))
    current.pathname = current.pathname.slice(4);
  return current.pathname + current.search;
}

export function runStudio(req, res) {
  req.url = requestPath(req.url);
  return studio()(req, res, () => {
    res.statusCode = 404;
    res.end("Not found");
  });
}
