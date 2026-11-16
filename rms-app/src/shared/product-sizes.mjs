import sizeGuide from "./size-guide.json" with { type: "json" };

export const productSizes = sizeGuide.map(group => group.size);

// Products without saved availability predate the XXL size.
const originalSizes = ["S", "M", "L", "XL"];

export function availableSizes(product) {
  return product.availableSizes ?? originalSizes;
}

export function isSizeAvailable(product, size) {
  if (!productSizes.includes(size) || !availableSizes(product).includes(size)) return false;
  if (!Array.isArray(product.stock)) return true;
  const entry = product.stock.find((item) => item?.size === size);
  return !!entry && Number.isInteger(entry.left) && entry.left > 0;
}
