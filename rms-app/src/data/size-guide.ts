import chart from '../shared/size-guide.json';

export const sizeGuide = chart;
export { productSizes as sizes, availableSizes, isSizeAvailable } from '../shared/product-sizes.mjs';
export { pieceColourways, resolveColourway } from '../shared/colourways.mjs';
export function sizeLabel(size: string) {
  const group = chart.find(group => group.size === size);
  return group ? `${group.label} · UK ${group.measurements.map(row => row.uk).join(' / ')}` : size;
}
