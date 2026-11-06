import { collections } from "../../data/collections";
import { products, shopCategories } from "../../data/products";
import { filterProducts } from "../../features/products/product-selectors";
import { productPath } from "../../routing/navigation";

export type MenuPhoto = {
  key: string;
  to: string;
  image: string;
  label: string;
};

const openFilters = {
  category: "All pieces",
  color: "All colours",
  maxPrice: "all",
  newEdit: false,
  sort: "",
};

/** Ready-to-wear pieces marked as new arrivals, in catalogue order. */
export function newArrivals() {
  return filterProducts({ ...openFilters, newEdit: true });
}

export function newArrivalPhotos(): MenuPhoto[] {
  return newArrivals()
    .slice(0, 2)
    .map((product) => ({
      key: product.id,
      to: productPath(product.id),
      image: product.image,
      label: product.name,
    }));
}

/** One photograph from the first and last shop categories that have a piece. */
export function shopMenuPhotos(): MenuPhoto[] {
  const available = shopCategories.flatMap((category) => {
    const product = products.find((item) => item.category === category);
    return product
      ? [
          {
            key: category,
            to: `/shop?category=${encodeURIComponent(category)}`,
            image: product.image,
            label: category,
          },
        ]
      : [];
  });
  if (available.length <= 2) return available;
  return [available[0], available[available.length - 1]];
}

export function collectionMenuPhotos(): MenuPhoto[] {
  return collections.slice(0, 2).flatMap((collection) => {
    const piece = products.find(
      (product) => product.id === collection.productIds[1],
    );
    const title = collection.title.map((line) => line.text).join(" ");
    return [
      {
        key: collection.id,
        to: "/collection",
        image: collection.image,
        label: title,
      },
      ...(collections.length === 1 && piece
        ? [
            {
              key: piece.id,
              to: productPath(piece.id),
              image: piece.image,
              label: piece.name,
            },
          ]
        : []),
    ];
  });
}
