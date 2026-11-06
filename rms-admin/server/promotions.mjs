import { isSizeAvailable } from "../shared/product-sizes.mjs";
import { resolveColourway } from "../shared/colourways.mjs";
import { quantityCap } from "../shared/stock.mjs";

function check(condition, message) {
  if (!condition) throw Object.assign(new Error(message), { status: 400 });
}
const text = (value, max = 500) => typeof value === "string" && value.length <= max;
export function validatePromotions(promotions, media) {
  if (promotions === undefined) return;
  check(promotions && Array.isArray(promotions.codes) && promotions.codes.length <= 200, "Invalid promotions.");
  const codes = new Set();
  for (const code of promotions.codes) {
    check(code && /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code.code) && !codes.has(code.code), "Use unique promo codes of 3–32 letters, numbers, hyphens or underscores.");
    codes.add(code.code);
    check(["percentage", "fixed"].includes(code.type) && Number.isFinite(code.value) && code.value > 0 && code.value <= (code.type === "percentage" ? 99 : 1e7), "Enter a discount greater than zero (percentage discounts are limited to 99%).");
    check(Number.isFinite(code.minimumSpend) && code.minimumSpend >= 0 && code.minimumSpend <= 1e7 && typeof code.active === "boolean", "Enter a valid minimum spend and promo status.");
    check(code.expiresOn === "" || (typeof code.expiresOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(code.expiresOn) && Number.isFinite(Date.parse(code.expiresOn)) && new Date(code.expiresOn).toISOString().startsWith(code.expiresOn)), "Choose a valid expiry date.");
  }
  for (const key of ["banner", "popup"]) {
    const ad = promotions[key];
    check(ad && typeof ad.enabled === "boolean" && text(ad.title, 120) && text(ad.message, 1000) && text(ad.buttonLabel, 60) && text(ad.imageAlt) && text(ad.image, 2000), "Complete the advertisement fields.");
    check(typeof ad.buttonHref === "string" && /^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(ad.buttonHref), "Use a storefront path for advertisement links, such as /shop.");
    check(!ad.enabled || (ad.message.trim() && (key !== "popup" || ad.title.trim())), "Add a message (and a popup title) before enabling the advertisement.");
    check(!ad.image || media.some(m => m.url === ad.image && m.type === "image"), "Choose an advertisement image from the media library.");
  }
}

// Only server-owned prices and published codes can affect the amount charged.
export function quoteCheckout(published, body, now = Date.now()) {
  check(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 30, "Add pieces to your bag.");
  const catalog = [...published.products, ...published.customDesigns].filter(p => p.status === "active");
  const items = body.items.map(item => {
    const piece = catalog.find(p => p.id === item?.productId);
    check(piece && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10 && ["XS", "S", "M", "L", "XL"].includes(item.size), "A piece in your bag is unavailable.");
    const way = resolveColourway(piece, item.colourwayId);
    check(way, `That colour is no longer available for ${piece.name}. Please choose another colour or remove it from your bag.`);
    check(isSizeAvailable(way, item.size), `Size ${item.size} is no longer available for ${piece.name}. Please choose another size or remove it from your bag.`);
    return { productId: piece.id, name: piece.name, image: way.image || piece.image, price: piece.price, quantity: item.quantity, size: item.size, colourwayId: way.id, color: way.color || "" };
  });
  const demand = new Map();
  for (const item of items) {
    const key = `${item.productId}\0${item.colourwayId}\0${item.size}`;
    demand.set(key, (demand.get(key) || 0) + item.quantity);
  }
  for (const [key, quantity] of demand) {
    const [productId, colourwayId, size] = key.split("\0");
    const piece = catalog.find((product) => product.id === productId);
    const way = resolveColourway(piece, colourwayId);
    if (!Array.isArray(way?.stock)) continue;
    const cap = quantityCap(way, size, 10);
    check(quantity <= cap, `Only ${cap} left in size ${size}${way.color ? ` (${way.color})` : ""} for ${piece.name}.`);
  }
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const promoCode = String(body.promoCode || "").trim().toUpperCase();
  let discountCents = 0;
  if (promoCode) {
    const promo = published.promotions?.codes.find(p => p.code === promoCode && p.active);
    check(promo && (!promo.expiresOn || now <= Date.parse(`${promo.expiresOn}T23:59:59.999Z`)), "This promo code is unavailable or has expired.");
    check(subtotalCents >= Math.round(promo.minimumSpend * 100), `This code requires a minimum spend of GH₵ ${promo.minimumSpend.toFixed(2)}.`);
    discountCents = promo.type === "percentage" ? Math.round(subtotalCents * promo.value / 100) : Math.round(promo.value * 100);
    check(discountCents < subtotalCents, "Your order total must be greater than this discount.");
  }
  return { items, subtotal: subtotalCents / 100, discount: discountCents / 100, total: (subtotalCents - discountCents) / 100, promoCode };
}
