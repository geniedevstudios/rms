// Share links such as /share/product/<id> and /share/custom/<id>.
//
// The storefront routes with a "#", and link previews (WhatsApp, iMessage, Instagram,
// Facebook, X, Slack) never see anything after it. This page gives them the product's
// photo, name and price to read, then sends real visitors on to the product in the shop.

const kinds = { product: "products", custom: "customDesigns" };
const mediaImage =
  /^https:\/\/media\.rivermindstyle\.com\/(?:cdn-cgi\/image\/[^/]+\/)?(rms\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp))$/i;

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

// Messaging apps drop big images, so ask for a 1200px JPEG. If resizing is
// unavailable the original is used instead.
function previewImage(url) {
  const match = typeof url === "string" ? url.match(mediaImage) : null;
  if (!match) return typeof url === "string" && url.startsWith("https://") ? url : "";
  return `https://media.rivermindstyle.com/cdn-cgi/image/width=1200,quality=75,format=jpeg,onerror=redirect/${match[1]}`;
}

const trimmed = (text, length) => {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 1).trimEnd()}…` : clean;
};

async function findPiece(requested, id) {
  const studio = (process.env.RMS_CONTENT_ORIGIN || "https://admin.rivermindstyle.com").replace(/\/$/, "");
  const response = await fetch(`${studio}/api/cms/published`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return null;
  const { content } = await response.json();
  // A piece can move between ready to wear and made to order, so check both lists.
  for (const kind of [requested, ...Object.keys(kinds).filter((name) => name !== requested)]) {
    const list = content?.[kinds[kind]];
    if (!Array.isArray(list)) continue;
    const active = list.filter((piece) => piece.status === "active");
    // A renamed piece keeps answering to its earlier handles.
    const piece =
      active.find((piece) => piece.id === id) ??
      active.find((piece) => Array.isArray(piece.previousIds) && piece.previousIds.includes(id));
    if (piece) return { piece, kind };
  }
  return null;
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  let kind = url.searchParams.get("type") || "";
  const id = url.searchParams.get("id") || "";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const site = /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? `${proto}://${host}` : "";

  let piece = null;
  if (kinds[kind] && id) {
    try {
      const found = await findPiece(kind, id);
      piece = found?.piece ?? null;
      if (found) kind = found.kind;
    } catch {
      piece = null;
    }
  }

  // Where visitors land. Unknown or unpublished pieces go to the shop.
  const target = piece ? `/#/${kind}/${encodeURIComponent(piece.id)}` : "/#/shop";
  const title = piece ? `${piece.name} | RIVERMINDSTYLE` : "RIVERMINDSTYLE";
  const price = piece && Number.isFinite(Number(piece.price)) ? `GH₵${Number(piece.price).toLocaleString("en-US")}` : "";
  const description = piece
    ? trimmed([price, kind === "custom" ? "Made to order" : "", piece.description].filter(Boolean).join(" · "), 200)
    : "RIVERMINDSTYLE. Considered silhouettes, expressive femininity. Discover a wardrobe for becoming.";
  const image = piece
    ? previewImage(piece.image || piece.colourways?.[0]?.image)
    : `${site}/intro-mark.png`;
  const pageUrl = piece ? `${site}/share/${kind}/${encodeURIComponent(piece.id)}` : site;

  const tags = [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "RIVERMINDSTYLE"],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ...(pageUrl ? [["property", "og:url", pageUrl]] : []),
    ...(image ? [["property", "og:image", image], ["name", "twitter:image", image]] : []),
    ["name", "twitter:card", image ? "summary_large_image" : "summary"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
  ]
    .map(([attr, key, value]) => `    <meta ${attr}="${key}" content="${escapeHtml(value)}" />`)
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
${tags}
    <meta http-equiv="refresh" content="0;url=${escapeHtml(target)}" />
    <script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")});</script>
  </head>
  <body>
    <p><a href="${escapeHtml(target)}">Continue to RIVERMINDSTYLE</a></p>
  </body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Previews are fetched by many apps at once; a short cache keeps the studio quiet.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  res.end(html);
}
