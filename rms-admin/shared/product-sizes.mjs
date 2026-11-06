import sizeGuide from "./size-guide.json" with { type: "json" };

export const productSizes = sizeGuide.map(group => group.size);

// Existing products keep their sizes until an admin explicitly edits availability.
export function availableSizes(product) {
  return product.availableSizes ?? productSizes;
}

export function isSizeAvailable(product, size) {
  if (!productSizes.includes(size) || !availableSizes(product).includes(size)) return false;
  if (!Array.isArray(product.stock)) return true;
  const entry = product.stock.find((item) => item?.size === size);
  return !!entry && Number.isInteger(entry.left) && entry.left > 0;
}
