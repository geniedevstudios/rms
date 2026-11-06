export function pieceColourways(product) {
  if (Array.isArray(product?.colourways) && product.colourways.length)
    return product.colourways;
  if (!product) return [];
  return [
    {
      id: "colour",
      color: typeof product.color === "string" ? product.color : "",
      swatch: typeof product.swatch === "string" ? product.swatch : "",
      image: product.image || "",
      hoverImage: product.hoverImage,
      gallery: product.gallery,
      availableSizes: product.availableSizes,
      stock: product.stock,
    },
  ];
}

export function resolveColourway(product, id) {
  const ways = pieceColourways(product);
  if (!ways.length) return null;
  if (typeof id === "string" && id)
    return ways.find((way) => way.id === id) ?? null;
  return ways[0];
}
