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
};

/** Add another object here to publish another collection. */
export const collections: Collection[] = [
  {
    id: "becoming",
    label: "RIVERMINDSTYLE / COLLECTION 01",
    image: "/images/hero.jpg",
    imageAlt: "The Becoming collection editorial",
    title: [{ text: "The art of" }, { text: "becoming.", emphasis: true }],
    description: [
      "A new chapter in self-expression.",
      "Quiet confidence, in every silhouette.",
    ],
    productIds: [
      "noir-dress",
      "form-suit",
      "muse-dress",
      "daybreak-suit",
      "soft-form-set",
      "reverie-dress",
      "azure-coat",
      "lace-dress",
    ],
    statement: {
      eyebrow: "A WARDROBE WITH A POINT OF VIEW",
      lines: [
        { text: "For the woman you are." },
        { text: "For the woman you’re ", emphasis: false },
        { text: "becoming.", emphasis: true },
      ],
    },
  },
];
