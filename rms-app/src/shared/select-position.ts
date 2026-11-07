export function selectPlacement(top: number, bottom: number, buttonTop: number, buttonBottom: number, desiredHeight: number) {
  const below = Math.max(0, bottom - buttonBottom - 14);
  const aboveSpace = Math.max(0, buttonTop - top - 14);
  const above = below < desiredHeight && aboveSpace > below;
  return { above, maxHeight: Math.min(desiredHeight, above ? aboveSpace : below) };
}

/** Intersect the visible viewport with every container that can clip a menu. */
export function measureSelectPosition(button: HTMLElement, list: HTMLElement) {
  const viewport = window.visualViewport;
  let top = viewport?.offsetTop ?? 0;
  let bottom = top + (viewport?.height ?? window.innerHeight);
  for (let parent = button.parentElement; parent; parent = parent.parentElement) {
    if (!/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) continue;
    const rect = parent.getBoundingClientRect();
    top = Math.max(top, rect.top + parent.clientTop);
    bottom = Math.min(bottom, rect.top + parent.clientTop + parent.clientHeight);
  }
  const rect = button.getBoundingClientRect();
  const height = Math.min(list.scrollHeight + 2, 280, (viewport?.height ?? window.innerHeight) * 0.52);
  return selectPlacement(top, bottom, rect.top, rect.bottom, height);
}

/** Scroll just the options, without moving the page or its containing dialog. */
export function revealSelectOption(list: HTMLElement, option: HTMLElement) {
  const bounds = list.getBoundingClientRect();
  const item = option.getBoundingClientRect();
  if (item.top < bounds.top + 6) list.scrollTop -= bounds.top + 6 - item.top;
  else if (item.bottom > bounds.bottom - 6) list.scrollTop += item.bottom - bounds.bottom + 6;
}
