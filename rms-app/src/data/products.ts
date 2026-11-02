import type { Product } from "../types/product";
// Preview catalogue only. Replace photography, prices, materials and availability
// with approved RMS product data before connecting this storefront to live sales.
export const products: Product[] = [
  {
    id: "noir-dress",
    name: "The Noir Dress",
    category: "Dresses",
    price: 1450,
    color: "Onyx",
    swatch: "#282726",
    image: "/images/hero.jpg",
    tag: "NEW SEASON",
    description:
      "An expression of quiet confidence. A sculpted black silhouette, considered from every angle, for the moments that become memories.",
    fabric: "Structured crepe · specialist clean",
  },
  {
    id: "form-suit",
    name: "The Form Jumpsuit",
    category: "Tailoring",
    price: 2200,
    color: "Sand",
    swatch: "#b5a18b",
    image: "/images/suit.jpg",
    tag: "THE EDIT",
    description:
      "Soft structure meets a confident line. A strapless tailored jumpsuit with a flared leg, designed to move between the everyday and the exceptional.",
    fabric: "Woven suiting · specialist clean",
  },
  {
    id: "muse-dress",
    name: "The Muse Dress",
    category: "Dresses",
    price: 1650,
    color: "Midnight",
    swatch: "#29252d",
    image: "/images/portrait.jpg",
    description:
      "A timeless shape, with a point of view. Clean lines and an expressive silhouette make this the piece you return to, season after season.",
    fabric: "Soft stretch crepe · specialist clean",
  },
  {
    id: "daybreak-suit",
    name: "The Daybreak Suit",
    category: "Tailoring",
    price: 1950,
    color: "Oat",
    swatch: "#c8b7a1",
    image: "/images/city.jpg",
    description:
      "A lighter approach to tailoring. Easy proportions and a warm neutral tone bring a sense of ease to days that unfold on their own terms.",
    fabric: "Cotton-blend suiting · specialist clean",
  },
  {
    id: "soft-form-set",
    name: "The Soft Form Set",
    category: "Tailoring",
    price: 2100,
    color: "Ecru",
    swatch: "#d5c7b2",
    image: "/images/cream.jpg",
    description:
      "A study in balance. Fluid tailoring and an understated palette come together in a two-piece set with a beautifully relaxed sensibility.",
    fabric: "Textured suiting · specialist clean",
  },
  {
    id: "reverie-dress",
    name: "The Reverie Dress",
    category: "Dresses",
    price: 1800,
    color: "Mist",
    swatch: "#a4bbc9",
    image: "/images/dress.jpg",
    description:
      "A little movement, beautifully considered. A fluid wrap silhouette in a soft mist blue, for sunlit days and moments worth celebrating.",
    fabric: "Fluid woven fabric · specialist clean",
  },
  {
    id: "azure-coat",
    name: "The Azure Coat",
    category: "Outerwear",
    price: 2400,
    color: "Sky",
    swatch: "#8eaabd",
    image: "/images/editorial.jpg",
    description:
      "An architectural outer layer in a soft sky blue. An elongated silhouette and generous proportions bring a fresh perspective to a familiar form.",
    fabric: "Wool-blend coating · specialist clean",
  },
  {
    id: "lace-dress",
    name: "The Solstice Dress",
    category: "Dresses",
    price: 1750,
    color: "Indigo",
    swatch: "#302857",
    image: "/images/tailoring.jpg",
    description:
      "Texture takes the lead. Intricate openwork and a close-fitting silhouette create a piece with presence, lightness and a character all its own.",
    fabric: "Textured lace · specialist clean",
  },
];

export const sizes = ["XS", "S", "M", "L", "XL"];
