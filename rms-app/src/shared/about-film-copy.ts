import defaults from "./default-content.json";
import type { FilmCopy } from "./content.types";

const previousCopy = {
  eyebrow: "THE MAKING OF A SILHOUETTE",
  title: "Thoughtful\nby *nature.*",
  description: "Form. Texture. Movement. An exploration of the details that make a piece feel personal.",
  buttonLabel: "Watch the atelier study",
  caption: "THE ART OF MAKING",
} satisfies Partial<FilmCopy>;

export function aboutFilmCopy(saved?: FilmCopy): FilmCopy {
  const copy = { ...defaults.films.about, ...saved };

  // Published snapshots can contain the previous defaults alongside Studio edits.
  for (const field of Object.keys(previousCopy) as (keyof typeof previousCopy)[]) {
    if (copy[field] === previousCopy[field]) copy[field] = defaults.films.about[field];
  }

  return copy;
}
