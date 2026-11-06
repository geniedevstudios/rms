const hex = /^#[0-9a-fA-F]{6}$/;

export function pieceColour(piece: { color?: string; swatch?: string }) {
  const name = piece.color?.trim() ?? "";
  if (!name) return null;
  return { name, swatch: hex.test(piece.swatch ?? "") ? piece.swatch! : "" };
}

export function pieceLine(
  color: string | undefined,
  size: string,
  quantity?: number,
) {
  return [
    color?.trim(),
    size,
    quantity != null ? `Qty ${quantity}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}
