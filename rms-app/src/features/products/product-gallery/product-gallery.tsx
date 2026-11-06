import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./product-gallery.styles.css";

export function productFrames(piece: {
  image: string;
  hoverImage?: string;
  gallery?: string[];
}) {
  return [piece.image, piece.hoverImage, ...(piece.gallery ?? [])].filter(
    (src): src is string => Boolean(src),
  );
}

export function ProductGallery({
  frames,
  name,
  label,
}: {
  frames: string[];
  name: string;
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(frames.length - 1, 0));
  const frame = frames[current];
  const several = frames.length > 1;
  const step = (direction: number) =>
    setIndex((value) => {
      const count = frames.length;
      return (Math.min(value, count - 1) + direction + count) % count;
    });
  if (!frame) return null;
  return (
    <div className="product-gallery">
      <img
        src={frame}
        alt={`${name} — photograph ${current + 1} of ${frames.length}`}
      />
      <span>
        {label} / {String(current + 1).padStart(2, "0")}
        {several ? ` / ${String(frames.length).padStart(2, "0")}` : ""}
      </span>
      {several && (
        <div className="gallery-nav">
          <button
            type="button"
            aria-label="Previous photograph"
            onClick={() => step(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next photograph"
            onClick={() => step(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
