import type { Product } from "../types/product";

export const shopCategories = ["Pants", "Tops", "Two piece", "Skirts"] as const;

// Preview catalogue only. Replace photography, prices, materials and availability
// with approved RMS product data before connecting this storefront to live sales.
export const products: Product[] = [
  {
    id: "noir-dress",
    name: "The Noir Skirt",
    category: "Skirts",
    price: 1450,
    color: "Onyx",
    swatch: "#282726",
    image: "/images/hero.jpg",
    hoverImage: "/images/portrait.jpg",
    tag: "NEW SEASON",
    description:
      "An expression of quiet confidence. A sculpted black skirt, considered from every angle, for the moments that become memories.",
    fabric: "Structured crepe · specialist clean",
  },
  {
    id: "form-suit",
    name: "The Form Set",
    category: "Two piece",
    price: 2200,
    color: "Sand",
    swatch: "#b5a18b",
    image: "/images/suit.jpg",
    hoverImage: "/images/tailoring.jpg",
    tag: "THE EDIT",
    description:
      "Soft structure meets a confident line. A two-piece set with a flared leg, designed to move between the everyday and the exceptional.",
    fabric: "Woven suiting · specialist clean",
  },
  {
    id: "muse-dress",
    name: "The Muse Top",
    category: "Tops",
    price: 1650,
    color: "Midnight",
    swatch: "#29252d",
    image: "/images/portrait.jpg",
    hoverImage: "/images/dress.jpg",
    description:
      "A timeless shape, with a point of view. Clean lines and an expressive silhouette make this the piece you return to, season after season.",
    fabric: "Soft stretch crepe · specialist clean",
  },
  {
    id: "daybreak-suit",
    name: "The Daybreak Pant",
    category: "Pants",
    price: 1950,
    color: "Oat",
    swatch: "#c8b7a1",
    image: "/images/city.jpg",
    hoverImage: "/images/cream.jpg",
    description:
      "A lighter approach to a pant. Easy proportions and a warm neutral tone bring a sense of ease to days that unfold on their own terms.",
    fabric: "Cotton-blend suiting · specialist clean",
  },
  {
    id: "soft-form-set",
    name: "The Soft Set",
    category: "Two piece",
    price: 2100,
    color: "Ecru",
    swatch: "#d5c7b2",
    image: "/images/cream.jpg",
    hoverImage: "/images/suit.jpg",
    description:
      "A study in balance. Fluid tailoring and an understated palette come together in a two-piece set with a beautifully relaxed sensibility.",
    fabric: "Textured suiting · specialist clean",
  },
  {
    id: "reverie-dress",
    name: "The Reverie Skirt",
    category: "Skirts",
    price: 1800,
    color: "Mist",
    swatch: "#a4bbc9",
    image: "/images/dress.jpg",
    hoverImage: "/images/editorial.jpg",
    description:
      "A little movement, beautifully considered. A fluid skirt in a soft mist blue, for sunlit days and moments worth celebrating.",
    fabric: "Fluid woven fabric · specialist clean",
  },
  {
    id: "azure-coat",
    name: "The Azure Top",
    category: "Tops",
    price: 2400,
    color: "Sky",
    swatch: "#8eaabd",
    image: "/images/editorial.jpg",
    hoverImage: "/images/city.jpg",
    description:
      "An easy top in a soft sky blue. A clean line and generous ease bring a fresh perspective to a familiar form.",
    fabric: "Wool-blend coating · specialist clean",
  },
  {
    id: "lace-dress",
    name: "The Solstice Pant",
    category: "Pants",
    price: 1750,
    color: "Indigo",
    swatch: "#302857",
    image: "/images/tailoring.jpg",
    hoverImage: "/images/hero.jpg",
    description:
      "Texture takes the lead. A considered pant with presence, lightness and a character all its own.",
    fabric: "Textured lace · specialist clean",
  },
];

export const sizes = ["XS", "S", "M", "L", "XL"];