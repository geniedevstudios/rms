import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { validatePromotions } from "./promotions.mjs";
import { productSizes } from "../shared/product-sizes.mjs";
import { orderedStock, reduceStock, stockError } from "../shared/stock.mjs";
import { rewriteMedia } from "../shared/media-url.mjs";
import { references } from "../shared/references.mjs";
import { readJsonIfPresent } from "./studio-db.mjs";
export { references };
const seed = JSON.parse(
  await readFile(
    new URL("../shared/default-content.json", import.meta.url),
    "utf8",
  ),
);
const initialMedia = JSON.parse(
  await readFile(new URL("./default-media.json", import.meta.url), "utf8"),
);
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const check = (condition, message) => {
  if (!condition) throw new HttpError(400, message);
};
const text = (value, max = 500) =>
  typeof value === "string" && value.length <= max;
const slug = (value) =>
  typeof value === "string" &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
  value.length <= 80;
export function publicContent(content) {
  const result = structuredClone(content);
  // Promo codes stay private; checkout validates a customer-supplied code.
  if (result.promotions) result.promotions.codes = [];
  const publishPiece = (p) => {
    const next = { ...p };
    if (Array.isArray(next.stock))
      next.stock = next.stock.map(({ size, left }) => ({ size, left }));
    if (Array.isArray(next.colourways))
      next.colourways = next.colourways.map((way) => ({
        ...way,
        stock: Array.isArray(way.stock)
          ? way.stock.map(({ size, left }) => ({ size, left }))
          : way.stock,
      }));
    return next;
  };
  result.products = result.products
    .filter((p) => p.status === "active")
    .map(publishPiece);
  result.customDesigns = result.customDesigns
    .filter((p) => p.status === "active")
    .map(publishPiece);
  result.journals = result.journals.filter((j) => j.status === "published");
  result.collections = result.collections
    .filter((c) => c.status === "published")
    .map((c) => ({
      ...c,
      productIds: c.productIds.filter((id) =>
        result.products.some((p) => p.id === id),
      ),
    }));
  return rewriteMedia(result);
}
export function validateContent(c, media) {
  check(c && typeof c === "object", "Content is required.");
  for (const key of [
    "slots",
    "categoryCards",
    "products",
    "customDesigns",
    "collections",
    "journals",
  ])
    check(Array.isArray(c[key]) && c[key].length <= 200, `Invalid ${key}.`);
  const h = c.hero;
  check(
    h &&
      Array.isArray(h.slides) &&
      h.slides.length > 0 &&
      h.slides.length <= 12,
    "Add between 1 and 12 hero slides.",
  );
  for (const key of [
    "eyebrow",
    "title",
    "description",
    "buttonLabel",
    "caption",
  ])
    check(text(h[key], 1000) && h[key].trim(), `Hero ${key} is required.`);
  check(
    typeof h.buttonHref === "string" &&
      /^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(h.buttonHref),
    "Choose a storefront path for the hero button.",
  );
  check(
    Number.isFinite(h.interval) && h.interval >= 4 && h.interval <= 30,
    "Hero rotation must be between 4 and 30 seconds.",
  );
  if (!c.editorial || typeof c.editorial !== "object") c.editorial = {};
  c.editorial = { ...structuredClone(seed.editorial), ...c.editorial };
  const editorial = c.editorial;
  for (const key of ["eyebrow", "title", "description", "buttonLabel"])
    check(
      text(editorial[key], 1000) && editorial[key].trim(),
      "Complete the homepage editorial.",
    );
  check(
    text(editorial.caption, 500) && text(editorial.mark, 500),
    "The editorial caption is too long.",
  );
  check(
    typeof editorial.buttonHref === "string" &&
      /^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(editorial.buttonHref),
    "Choose a page for the editorial button.",
  );
  if (!c.films || typeof c.films !== "object") c.films = {};
  c.films = {
    home: { ...structuredClone(seed.films.home), ...(c.films.home || {}) },
    about: { ...structuredClone(seed.films.about), ...(c.films.about || {}) },
  };
  for (const film of [c.films.home, c.films.about]) {
    for (const key of ["eyebrow", "title", "description", "buttonLabel"])
      check(
        text(film[key], 1000) && film[key].trim(),
        "Complete the atelier film wording.",
      );
    check(
      text(film.note, 500) && text(film.caption, 500),
      "The atelier film note is too long.",
    );
  }
  const byUrl = new Map(media.map((m) => [m.url, m]));
  validatePromotions(c.promotions, media);
  const readyToWear = new Set(c.products);
  const image = (url) => !url || byUrl.get(url)?.type === "image";
  const ids = new Set();
  const sizesOk = (sizes) =>
    sizes === undefined ||
    (Array.isArray(sizes) &&
      sizes.length <= productSizes.length &&
      new Set(sizes).size === sizes.length &&
      sizes.every((size) => productSizes.includes(size)));
  for (const p of [...c.products, ...c.customDesigns]) {
    if (p.colourways === undefined) {
      check(sizesOk(p.availableSizes), "Choose valid available sizes for each piece.");
      if (readyToWear.has(p)) {
        const inventory = stockError(p);
        check(!inventory, inventory);
        if (Array.isArray(p.availableSizes) && p.availableSizes.length === 0) delete p.stock;
        else if (Array.isArray(p.stock)) p.stock = orderedStock(p);
      } else {
        check(p.stock === undefined, "Made-to-order pieces do not keep a stock count.");
      }
    } else {
      check(Array.isArray(p.colourways) && p.colourways.length >= 1 && p.colourways.length <= 8, "Add between 1 and 8 colours.");
      const seen = new Set();
      for (const way of p.colourways) {
        check(way && slug(way.id) && !seen.has(way.id), "Give each colour its own name.");
        seen.add(way.id);
        const swatch = typeof way.swatch === "string" ? way.swatch : "";
        check(
          typeof way.color === "string" &&
            way.color.length <= 80 &&
            (swatch === "" || /^#[0-9a-fA-F]{6}$/.test(swatch)) &&
            (!swatch || way.color.trim()),
          "Name the colour, or leave both the name and the swatch empty.",
        );
        way.color = way.color.trim();
        way.swatch = swatch;
        check(sizesOk(way.availableSizes), "Choose valid available sizes for each colour.");
        check(way.image && image(way.image) && image(way.hoverImage), "Each colour needs a photograph from the library.");
        check(
          way.gallery === undefined ||
            (Array.isArray(way.gallery) &&
              way.gallery.length <= 2 &&
              way.gallery.every((url) => typeof url === "string" && url && image(url))),
          "Additional photographs must be images from the library.",
        );
        if (readyToWear.has(p)) {
          const inventory = stockError(way);
          check(!inventory, inventory);
          if (Array.isArray(way.availableSizes) && way.availableSizes.length === 0) delete way.stock;
          else if (Array.isArray(way.stock)) way.stock = orderedStock(way);
        } else {
          check(way.stock === undefined, "Made-to-order pieces do not keep a stock count.");
        }
      }
      if (p.colourways.length > 1)
        check(p.colourways.every((way) => way.color), "Name each colour.");
      const lead = p.colourways[0];
      p.color = lead.color;
      p.swatch = lead.swatch;
      p.image = lead.image;
      p.hoverImage = lead.hoverImage;
      p.gallery = lead.gallery;
      p.availableSizes = lead.availableSizes;
      if (lead.stock) p.stock = lead.stock.map((row) => ({ ...row }));
      else delete p.stock;
    }
    check(slug(p.id) && !ids.has(p.id), "Product handles must be unique.");
    ids.add(p.id);
    check(text(p.name) && p.name.trim(), "Every product needs a name.");
    check(
      ["Pants", "Tops", "Two piece", "Skirts", "Dresses"].includes(p.category),
      "Choose a product category.",
    );
    check(
      Number.isFinite(p.price) && p.price >= 0 && p.price <= 1e7,
      "Enter a valid product price.",
    );
    const swatch = typeof p.swatch === "string" ? p.swatch : "";
    check(
      typeof p.color === "string" &&
        p.color.length <= 80 &&
        (swatch === "" || /^#[0-9a-fA-F]{6}$/.test(swatch)) &&
        (!swatch || p.color.trim()),
      "Name the colour, or leave both the name and the swatch empty.",
    );
    check(
      text(p.description, 10000) &&
        text(p.fabric, 1000) &&
        (!p.tag || text(p.tag, 100)),
      "Product descriptions are too long.",
    );
    check(["active", "draft"].includes(p.status), "Choose a product status.");
    check(
      p.newArrival === undefined || typeof p.newArrival === "boolean",
      "Choose whether a piece is a new arrival.",
    );
    check(
      p.image && image(p.image) && image(p.hoverImage),
      "Product photography must be images.",
    );
    check(
      p.gallery === undefined ||
        (Array.isArray(p.gallery) &&
          p.gallery.length <= 2 &&
          p.gallery.every((url) => typeof url === "string" && url && image(url))),
      "Additional photographs must be images from the library.",
    );
    check(
      p.leadDays === undefined ||
        (Number.isInteger(p.leadDays) && p.leadDays >= 1 && p.leadDays <= 365),
      "Lead time must be 1–365 days.",
    );
  }
  for (const list of [
    c.journals,
    c.collections,
    c.slots,
    c.categoryCards,
    h.slides,
  ]) {
    const unique = new Set();
    for (const item of list) {
      check(
        item && slug(item.id) && !unique.has(item.id),
        "Each item needs a unique handle.",
      );
      unique.add(item.id);
    }
  }
  for (const j of c.journals) {
    check(
      text(j.title) &&
        j.title.trim() &&
        text(j.label) &&
        text(j.excerpt, 2000) &&
        text(j.body, 60000) &&
        text(j.alt),
      "Complete the journal title and text.",
    );
    check(
      j.image && image(j.image) && image(j.hover),
      "Journal covers must be images.",
    );
    check(
      ["published", "draft"].includes(j.status) &&
        typeof j.featured === "boolean",
      "Invalid journal status.",
    );
    check(
      Number.isInteger(j.readMinutes) &&
        j.readMinutes >= 1 &&
        j.readMinutes <= 120,
      "Reading time must be 1–120 minutes.",
    );
  }
  for (const col of c.collections) {
    check(
      text(col.label) &&
        col.label.trim() &&
        text(col.imageAlt) &&
        col.image &&
        image(col.image),
      "Complete the collection label and image.",
    );
    check(
      Array.isArray(col.title) &&
        col.title.length > 0 &&
        col.title.length <= 10 &&
        col.title.every((t) => text(t.text) && t.text.trim()),
      "Collection title is required.",
    );
    check(
      Array.isArray(col.description) &&
        col.description.length <= 10 &&
        col.description.every((t) => text(t, 2000)),
      "Invalid collection description.",
    );
    check(
      Array.isArray(col.productIds) &&
        col.productIds.every((id) => c.products.some((p) => p.id === id)),
      "A collection references a missing product.",
    );
    check(
      ["published", "draft"].includes(col.status),
      "Invalid collection status.",
    );
    if (col.statement)
      check(
        text(col.statement.eyebrow) &&
          Array.isArray(col.statement.lines) &&
          col.statement.lines.length <= 10 &&
          col.statement.lines.every((t) => text(t.text)),
        "Invalid collection statement.",
      );
  }
  const slotIds = new Set(seed.slots.map((slot) => slot.id));
  const videoSlots = new Set(["atelier-film", "about-film"]);
  c.slots = c.slots.filter((slot) => slot && slotIds.has(slot.id));
  for (const seedSlot of seed.slots) {
    if (c.slots.some((slot) => slot.id === seedSlot.id)) continue;
    const twinId =
      seedSlot.id === "about-film"
        ? "atelier-film"
        : seedSlot.id === "about-poster"
          ? "atelier-poster"
          : "";
    const twin = twinId ? c.slots.find((slot) => slot.id === twinId) : null;
    c.slots.push(
      twin
        ? { ...structuredClone(seedSlot), src: twin.src, alt: twin.alt }
        : structuredClone(seedSlot),
    );
  }
  check(
    c.slots.length === seed.slots.length &&
      seed.slots.every((s) => c.slots.some((x) => x.id === s.id)),
    "Keep all website media placements.",
  );
  for (const s of c.slots) {
    check(
      text(s.label) &&
        text(s.group) &&
        text(s.alt) &&
        text(s.description, 2000),
      "Invalid media placement.",
    );
    check(
      byUrl.get(s.src)?.type === (videoSlots.has(s.id) ? "video" : "image"),
      "Choose the correct media type for " + s.label + ".",
    );
  }
  for (const s of h.slides)
    check(
      text(s.alt) &&
        ["image", "video"].includes(s.type) &&
        byUrl.get(s.src)?.type === s.type,
      "Choose a valid hero image or video.",
    );
  for (const s of c.categoryCards)
    check(
      text(s.title) &&
        text(s.subtitle) &&
        image(s.image) &&
        s.image &&
        image(s.hover) &&
        typeof s.to === "string" &&
        /^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(s.to),
      "Invalid category card.",
    );
  for (const ref of references(c))
    check(
      byUrl.has(ref.url),
      "Choose media from the library for " + ref.label + ".",
    );
  return c;
}
function emptyContent() {
  return {
    draft: structuredClone(seed),
    published: structuredClone(seed),
    media: structuredClone(initialMedia),
    revision: 0,
    publishedRevision: 0,
    publishedAt: null,
    activity: [],
  };
}
export function createContentStore(directory, { sync = null, remote = null } = {}) {
  const file = resolve(directory, "content.json");
  let queue = Promise.resolve();
  async function read() {
    if (remote) {
      const saved = await remote.load();
      if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
      return emptyContent();
    }
    return (await readJsonIfPresent(file)) || emptyContent();
  }
  async function persist(state) {
    if (remote) {
      await remote.save(state);
      return;
    }
    await mkdir(dirname(file), { recursive: true });
    const temp = file + "." + randomUUID() + ".tmp";
    await writeFile(temp, JSON.stringify(state, null, 2));
    await rename(temp, file);
  }
  function transact(action) {
    const job = queue.then(async () => {
      const state = await read();
      const message = action(state);
      state.activity = [
        { id: randomUUID(), at: new Date().toISOString(), message },
        ...state.activity,
      ].slice(0, 40);
      await persist(state);
      return state;
    });
    queue = job.catch(() => {});
    return job;
  }
  async function push(state) {
    if (!sync) return;
    await sync(
      publicContent(state.published),
      state.publishedRevision,
      state.publishedAt,
    );
  }
  function revision(s, expected) {
    if (s.revision !== expected)
      throw new HttpError(
        409,
        "Content changed in another session. Reload the latest version before saving.",
      );
  }
  return {
    read,
    save: (draft, expected) =>
      transact((s) => {
        revision(s, expected);
        s.draft = validateContent(draft, s.media);
        s.revision++;
        return "Saved a content draft";
      }),
    publish: async (expected) => {
      const state = await transact((s) => {
        revision(s, expected);
        validateContent(s.draft, s.media);
        s.published = structuredClone(s.draft);
        s.publishedRevision = s.revision;
        s.publishedAt = new Date().toISOString();
        return "Published the storefront";
      });
      await push(state);
      return state;
    },
    pushLive: async () => {
      if (!sync) return;
      await push(await read());
    },
    discard: (expected) =>
      transact((s) => {
        revision(s, expected);
        s.draft = structuredClone(s.published);
        s.revision++;
        s.publishedRevision = s.revision;
        return "Restored the published version";
      }),
    addMedia: (asset) =>
      transact((s) => {
        s.media.unshift(asset);
        return "Uploaded " + asset.name;
      }),
    editMedia: (id, alt) =>
      transact((s) => {
        check(text(alt), "Alternative text must be under 500 characters.");
        const asset = s.media.find((m) => m.id === id);
        if (!asset) throw new HttpError(404, "Media not found.");
        asset.alt = alt;
        return "Updated media description";
      }),
    takeStock: async (orderId, items) => {
      const state = await transact((s) => {
        if (typeof orderId !== "string" || !orderId) return "Inventory already updated";
        if (!Array.isArray(s.stockMoves)) s.stockMoves = [];
        if (s.stockMoves.includes(orderId)) return "Inventory already updated";
        reduceStock(s.draft.products, items);
        reduceStock(s.published.products, items);
        s.stockMoves = [...s.stockMoves, orderId].slice(-400);
        return "Updated inventory after a paid order";
      });
      await push(state).catch((error) =>
        console.error("RMS live inventory sync failed.", error.message),
      );
      return state;
    },
    removeMedia: (id) =>
      transact((s) => {
        const asset = s.media.find((m) => m.id === id);
        if (!asset) throw new HttpError(404, "Media not found.");
        check(
          asset.url.startsWith("/uploads/") ||
            asset.url.startsWith("https://res.cloudinary.com/"),
          "Original storefront assets cannot be deleted.",
        );
        check(
          ![...references(s.draft), ...references(s.published)].some(
            (r) => r.url === asset.url,
          ),
          "This file is still used in a draft or on the published storefront. Replace it there first.",
        );
        s.media = s.media.filter((m) => m.id !== id);
        return "Removed " + asset.name;
      }),
  };
}
