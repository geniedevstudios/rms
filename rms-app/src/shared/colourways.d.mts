export type Colourway = {
  id: string;
  color: string;
  swatch: string;
  image: string;
  hoverImage?: string;
  gallery?: string[];
  availableSizes?: string[];
  stock?: { size: string; made?: number; left: number }[];
};

export function pieceColourways(product: {
  color?: string;
  swatch?: string;
  image?: string;
  hoverImage?: string;
  gallery?: string[];
  availableSizes?: string[];
  stock?: { size: string; made?: number; left: number }[];
  colourways?: Colourway[];
} | null | undefined): Colourway[];

export function resolveColourway(
  product: Parameters<typeof pieceColourways>[0],
  id?: string,
): Colourway | null;
