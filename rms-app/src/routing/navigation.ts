export const go = (path: string) => {
  window.location.hash = path;
};
export const productPath = (id: string) => `/product/${encodeURIComponent(id)}`;
export const customPath = (id: string) => `/custom/${encodeURIComponent(id)}`;
export const piecePath = (piece: { id: string; leadDays?: number }) =>
  piece.leadDays ? customPath(piece.id) : productPath(piece.id);
