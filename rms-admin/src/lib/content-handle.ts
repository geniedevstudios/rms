/** Create a stable, unique URL segment when a new item is added to the draft. */
export function createContentHandle(name: string, existingIds: Iterable<string>, fallback = "item") {
  const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80).replace(/^-+|-+$/g, "") || fallback;
  const existing = new Set(existingIds);
  let candidate = base;
  for (let count = 2; existing.has(candidate); count++) {
    const suffix = `-${count}`;
    candidate = base.slice(0, 80 - suffix.length).replace(/-+$/g, "") + suffix;
  }
  return candidate;
}
