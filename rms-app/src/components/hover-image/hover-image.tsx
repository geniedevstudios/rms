import "./hover-image.styles.css";
import { optimizedImage } from "../../shared/media-url.mjs";

const widths = [480, 800, 1200];
const sizes = "(max-width: 760px) 50vw, 33vw";

/** Small, lazy-loaded copies for cards. Falls back to the plain address elsewhere. */
function photo(url: string) {
  const sources = widths.map((width) => ({ width, url: optimizedImage(url, width) }));
  const resized = sources.some((source) => source.url !== url);
  return {
    src: resized ? sources[1].url : url,
    srcSet: resized
      ? sources.map((source) => `${source.url} ${source.width}w`).join(", ")
      : undefined,
    sizes: resized ? sizes : undefined,
  };
}

export function HoverImage({
  src,
  hover,
  alt,
}: {
  src: string;
  hover?: string;
  alt: string;
}) {
  return (
    <>
      <img {...photo(src)} alt={alt} loading="lazy" decoding="async" />
      {hover && hover !== src ? (
        <img
          className="hover-shot"
          {...photo(hover)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </>
  );
}
