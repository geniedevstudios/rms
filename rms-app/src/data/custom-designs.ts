import type { Product } from "../types/product";

export type CustomDesign = Product & { leadDays: number };

export const consultationFee = 250;

export const customDesigns: CustomDesign[] = [
  {
    id: "column-dress",
    name: "The Column Dress",
    category: "Dresses",
    price: 1850,
    color: "Ivory",
    swatch: "#f3efe6",
    image: "/images/dress.jpg",
    description: "A long, quiet column cut to your measurements in silk.",
    fabric: "Silk column · specialist clean",
    leadDays: 21,
  },
  {
    id: "private-gown",
    name: "The Private Gown",
    category: "Dresses",
    price: 2400,
    color: "Midnight",
    swatch: "#29252d",
    image: "/images/portrait.jpg",
    description: "An evening gown shaped through a fitting, for one occasion.",
    fabric: "Evening crepe · specialist clean",
    leadDays: 28,
  },
  {
    id: "ceremony-dress",
    name: "The Ceremony Dress",
    category: "Dresses",
    price: 2650,
    color: "Champagne",
    swatch: "#e4d2bc",
    image: "/images/editorial.jpg",
    description: "A ceremonial dress with a longer hand-finish.",
    fabric: "Hand-finished silk · specialist clean",
    leadDays: 35,
  },
  {
    id: "soft-commission",
    name: "The Soft Commission",
    category: "Dresses",
    price: 1600,
    color: "Cream",
    swatch: "#f7f1e8",
    image: "/images/cream.jpg",
    description: "A lighter dress in cream, made for the way you move.",
    fabric: "Soft cream weave · specialist clean",
    leadDays: 18,
  },
];
