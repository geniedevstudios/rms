export type Media = {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  alt: string;
  size: number;
  createdAt: string;
};
export type SizeStock = { size: string; made: number; left: number };
export type Colourway = {
  id: string;
  color: string;
  swatch: string;
  image: string;
  hoverImage?: string;
  gallery?: string[];
  availableSizes?: string[];
  stock?: SizeStock[];
};
export type Product = {
  availableSizes?: string[];
  stock?: SizeStock[];
  colourways?: Colourway[];
  id: string;
  name: string;
  category: "Pants" | "Tops" | "Two piece" | "Skirts" | "Dresses";
  price: number;
  color: string;
  swatch: string;
  image: string;
  hoverImage?: string;
  gallery?: string[];
  description: string;
  fabric: string;
  tag?: string;
  leadDays?: number;
  newArrival?: boolean;
  status: "active" | "draft";
};
export type Journal = {
  id: string;
  title: string;
  label: string;
  excerpt: string;
  image: string;
  hover: string;
  alt: string;
  body: string;
  status: "published" | "draft";
  featured: boolean;
  readMinutes: number;
};
export type Collection = {
  id: string;
  label: string;
  image: string;
  imageAlt: string;
  title: { text: string; emphasis?: boolean }[];
  description: string[];
  productIds: string[];
  statement?: {
    eyebrow: string;
    lines: { text: string; emphasis?: boolean }[];
  };
  status: "published" | "draft";
};
export type PromoCode = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumSpend: number;
  expiresOn: string;
  active: boolean;
};
export type PromotionAdvert = {
  enabled: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  buttonHref: string;
  image: string;
  imageAlt: string;
};
export type Promotions = {
  codes: PromoCode[];
  banner: PromotionAdvert;
  popup: PromotionAdvert;
};
export type Content = {
  promotions?: Promotions;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
    caption: string;
    interval: number;
    slides: { id: string; src: string; alt: string; type: "image" | "video" }[];
  };
  slots: {
    id: string;
    label: string;
    group: string;
    src: string;
    alt: string;
    description: string;
  }[];
  categoryCards: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    hover: string;
    to: string;
  }[];
  products: Product[];
  customDesigns: Product[];
  collections: Collection[];
  journals: Journal[];
};
export type Activity = { id: string; at: string; message: string };
export type AdminState = {
  draft: Content;
  published: Content;
  media: Media[];
  revision: number;
  publishedRevision: number;
  publishedAt: string | null;
  activity: Activity[];
};
