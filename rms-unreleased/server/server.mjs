import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";
import { loadEnv } from "./env.mjs";
import {
  validateEntry,
  createWaitlistStore,
  createSupabaseWaitlist,
} from "./waitlist.mjs";
await loadEnv(fileURLToPath(new URL("../.env", import.meta.url)));
const root = fileURLToPath(new URL("../", import.meta.url));
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
if ((supabaseUrl || supabaseKey || resendKey) && (!supabaseUrl || !supabaseKey || !resendKey)) {
  console.error(
    "Waitlist needs SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and RESEND_API_KEY together.",
  );
  process.exit(1);
}
const reserve = supabaseUrl
  ? createSupabaseWaitlist({
      url: supabaseUrl,
      apiKey: supabaseKey,
      resendKey,
      from: process.env.RESEND_FROM || "RIVERMINDSTYLE <onboarding@resend.dev>",
    })
  : createWaitlistStore(
      process.env.WAITLIST_FILE || resolve(root, "data/waitlist.jsonl"),
    );
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};
const rates = new Map();
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  const json = (status, body) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  };
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/waitlist") {
      if (req.method !== "POST")
        return json(405, { error: "Use the invitation form to join." });
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return json(403, { error: "Please submit from the RMS website." });
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return json(415, { error: "Please use the invitation form." });
      const now = Date.now();
      for (const [key, value] of rates)
        if (now - value.start > 60000) rates.delete(key);
      const key = req.socket.remoteAddress;
      const rate = rates.get(key) || { start: now, count: 0 };
      rate.count++;
      rates.set(key, rate);
      if (rate.count > 15)
        return json(429, {
          error: "Please wait a minute before trying again.",
        });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 4096)
          return json(413, {
            error: "Please keep your details within the form limits.",
          });
      }
      let input;
      try {
        input = JSON.parse(body);
      } catch {
        return json(400, { error: "Please check your details and try again." });
      }
      const entry = validateEntry(input);
      if (!entry)
        return json(400, {
          error: "Enter your name and a valid email address.",
        });
      const saved = await reserve(entry);
      if (saved.emailed === false)
        console.error("Invitation saved, but the confirmation email was not accepted.");
      return json(200, saved);
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      return res.end();
    }
    const pathname = decodeURIComponent(url.pathname);
    // Only public assets are served; data, source tooling and configuration stay private.
    if (
      pathname !== "/" &&
      !pathname.startsWith("/src/") &&
      !pathname.startsWith("/public/")
    ) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const file = resolve(
      root,
      pathname === "/" ? "index.html" : "." + pathname,
    );
    if (
      !file.startsWith(root) ||
      !types[extname(file)] ||
      !(await stat(file)).isFile()
    ) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": types[extname(file)],
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not found");
    } else {
      json(error.status || 503, {
        error:
          error.status
            ? error.message
            : "Your invitation couldn’t be saved right now. Please try again shortly.",
      });
    }
  }
});
const host = process.env.HOST || "0.0.0.0";
server.listen(Number(process.env.PORT || 5174), host, () =>
  console.log(
    `RMS invitation: http://${host}:${server.address().port}`,
  ),
);
