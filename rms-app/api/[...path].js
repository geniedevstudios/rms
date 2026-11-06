const hop = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
]);

function targetPath(url) {
  const current = new URL(url || "/", "http://localhost");
  if (current.pathname.startsWith("/api/media/") || current.pathname.startsWith("/api/uploads/"))
    current.pathname = current.pathname.slice(4);
  return current.pathname + current.search;
}

async function bodyOf(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const origin = (process.env.RMS_CONTENT_ORIGIN || "").replace(/\/$/, "");
  if (!origin) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "The studio is not connected." }));
    return;
  }
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (hop.has(key) || value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const response = await fetch(origin + targetPath(req.url), {
    method: req.method,
    headers,
    body: await bodyOf(req),
    redirect: "manual",
  });
  const outgoing = {};
  response.headers.forEach((value, key) => {
    if (key === "set-cookie" || hop.has(key)) return;
    outgoing[key] = value;
  });
  const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  if (cookies.length) outgoing["set-cookie"] = cookies;
  res.writeHead(response.status, outgoing);
  if (req.method === "HEAD" || !response.body) return res.end();
  const bytes = Buffer.from(await response.arrayBuffer());
  res.end(bytes);
}
