import type { Promotions, PromotionAdvert } from "./content.types";

export const emptyAdvert: PromotionAdvert = {
  enabled: false, title: "", message: "", buttonLabel: "", buttonHref: "/shop",
  image: "", imageAlt: "",
};
export const defaultPromotions: Promotions = {
  codes: [],
  banner: { ...emptyAdvert, enabled: true,
    message: "A new chapter. A wardrobe for becoming.",
    buttonLabel: "Discover the collection" },
  popup: { ...emptyAdvert },
};
