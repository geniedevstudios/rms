export type Product = {
  id: string;
  name: string;
  category: "Dresses" | "Tailoring" | "Outerwear";
  price: number;
  color: string;
  swatch: string;
  image: string;
  description: string;
  fabric: string;
  tag?: string;
  leadDays?: number;
};
