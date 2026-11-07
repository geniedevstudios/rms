export const lowStockLimit: number;

export function quantityCap(
  product: { stock?: { size: string; left: number }[] } | null | undefined,
  size: string,
  max?: number,
): number;

export function attentionSizes(
  product: { stock?: { size: string; made: number; left: number }[]; colourways?: { color?: string; stock?: { size: string; made: number; left: number }[] }[] } | null | undefined,
): { size: string; made: number; left: number; color: string }[];

export function reduceStock(
  products: { id: string; stock?: { size: string; left: number; made?: number }[] }[],
  items: { productId?: string; size?: string; quantity?: number }[],
): void;

export function stockError(product: {
  availableSizes?: string[];
  stock?: { size: string; made: number; left: number }[];
}): string;

export function orderedStock(product: {
  availableSizes: string[];
  stock: { size: string; made: number; left: number }[];
}): { size: string; made: number; left: number }[];
