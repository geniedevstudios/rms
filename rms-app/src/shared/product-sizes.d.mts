export const productSizes: string[];
export function availableSizes(product: { availableSizes?: string[] }): string[];
export function isSizeAvailable(product: { availableSizes?: string[] }, size: string): boolean;
