import { useCallback, useState } from "react";
import type { Media } from "../../../shared/content.types";

export type MediaSort = "newest" | "oldest" | "az" | "za";

export const mediaSortOptions: { value: MediaSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "Name A–Z" },
  { value: "za", label: "Name Z–A" },
];

const SORT_KEY = "rms-admin-media-sort";
const isMediaSort = (value: unknown): value is MediaSort =>
  mediaSortOptions.some((option) => option.value === value);

/** The chosen order, remembered in this browser until it is changed again. */
export function useMediaSort() {
  const [sort, setSort] = useState<MediaSort>(() => {
    try {
      const saved = window.localStorage.getItem(SORT_KEY);
      return isMediaSort(saved) ? saved : "newest";
    } catch {
      return "newest";
    }
  });
  const choose = useCallback((next: MediaSort) => {
    setSort(next);
    try {
      window.localStorage.setItem(SORT_KEY, next);
    } catch {
      /* The choice still applies for this visit. */
    }
  }, []);
  return [sort, choose] as const;
}

const time = (media: Media) => Date.parse(media.createdAt) || 0;
const byName = (a: Media, b: Media) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

export function sortMedia(list: Media[], order: MediaSort) {
  const sorted = [...list];
  if (order === "az") sorted.sort((a, b) => byName(a, b) || time(b) - time(a));
  else if (order === "za") sorted.sort((a, b) => byName(b, a) || time(b) - time(a));
  else if (order === "oldest") sorted.sort((a, b) => time(a) - time(b));
  else sorted.sort((a, b) => time(b) - time(a));
  return sorted;
}
