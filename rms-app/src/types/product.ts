export type Product = {
  id: string;
  name: string;
  category: "Pants" | "Tops" | "Two piece" | "Skirts" | "Dresses";
  price: number;
  color: string;
  swatch: string;
  image: string;
  hoverImage?: string;
  description: string;
  fabric: string;
  tag?: string;
  leadDays?: number;
};
