import { productSizes } from "./product-sizes.mjs";
import { pieceColourways, resolveColourway } from "./colourways.mjs";

export const lowStockLimit = 2;

export function quantityCap(product, size, max = 10) {
  if (!product || !Array.isArray(product.stock)) return max;
  const entry = product.stock.find((item) => item?.size === size);
  if (!entry || !Number.isInteger(entry.left)) return 0;
  return Math.min(max, Math.max(0, entry.left));
}

export function attentionSizes(product) {
  return pieceColourways(product)
    .flatMap((way) =>
      (Array.isArray(way.stock) ? way.stock : [])
        .filter(
          (entry) =>
            entry &&
            productSizes.includes(entry.size) &&
            Number.isInteger(entry.made) &&
            Number.isInteger(entry.left) &&
            entry.left <= lowStockLimit,
        )
        .map((entry) => ({
          size: entry.size,
          made: entry.made,
          left: entry.left,
          color: way.color || "",
        })),
    )
    .sort(
      (a, b) =>
        a.left - b.left ||
        a.color.localeCompare(b.color) ||
        productSizes.indexOf(a.size) - productSizes.indexOf(b.size),
    );
}

function take(host, size, quantity) {
  const entry = host?.stock?.find((row) => row.size === size);
  if (!entry || !Number.isInteger(entry.left)) return;
  entry.left = Math.max(0, entry.left - quantity);
}

export function reduceStock(products, items) {
  const demand = new Map();
  for (const item of items || []) {
    if (!item || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    const colourwayId = typeof item.colourwayId === "string" ? item.colourwayId : "";
    const key = `${item.productId}\0${colourwayId}\0${item.size}`;
    demand.set(key, (demand.get(key) || 0) + item.quantity);
  }
  for (const [key, quantity] of demand) {
    const [productId, colourwayId, size] = key.split("\0");
    const product = products.find((entry) => entry.id === productId);
    if (!product) continue;
    const way = resolveColourway(product, colourwayId);
    if (!way) continue;
    take(way, size, quantity);
    const ways = pieceColourways(product);
    if (ways[0] === way && product.stock && product.stock !== way.stock)
      take(product, size, quantity);
  }
}

export function stockError(product) {
  const sizes = product.availableSizes;
  if (sizes === undefined && product.stock === undefined) return "";
  if (!Array.isArray(sizes))
    return "Choose the sizes for this piece before entering a quantity.";
  if (sizes.length === 0) {
    if (
      product.stock === undefined ||
      (Array.isArray(product.stock) && product.stock.length === 0)
    )
      return "";
    return "Clear the quantities when no sizes are offered.";
  }
  if (!Array.isArray(product.stock))
    return "Enter how many you made, and how many are left, for each size.";
  const seen = new Set();
  for (const entry of product.stock) {
    if (
      !entry ||
      typeof entry.size !== "string" ||
      !productSizes.includes(entry.size) ||
      seen.has(entry.size) ||
      !sizes.includes(entry.size)
    )
      return "Enter quantities only for sizes this piece offers.";
    seen.add(entry.size);
    if (!Number.isInteger(entry.made) || entry.made < 0 || entry.made > 9999)
      return "Enter how many you made as a whole number.";
    if (!Number.isInteger(entry.left) || entry.left < 0 || entry.left > entry.made)
      return "What is left cannot be more than what you made.";
  }
  if (sizes.some((size) => !seen.has(size)))
    return "Enter how many you made, and how many are left, for each size.";
  return "";
}

export function orderedStock(product) {
  return productSizes
    .filter((size) => product.availableSizes.includes(size))
    .map((size) => {
      const entry = product.stock.find((row) => row.size === size);
      return { size, made: entry.made, left: entry.left };
    });
}
