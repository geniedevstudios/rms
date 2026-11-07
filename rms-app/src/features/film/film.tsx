import { filmMedia } from "../../content/content";
import "./film.styles.css";
import { youtubeId } from "./film-source";

export function Film({ place = "home" }: { place?: "home" | "about" }) {
  const media = filmMedia(place === "about" ? "about-film" : "atelier-film");
  const id = youtubeId(media.src);
  return (
    <div className="film-modal">
      {id ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&rel=0&playsinline=1`}
          title="Atelier film"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          src={media.src}
          controls
          autoPlay
          muted
          playsInline
          aria-label={media.alt}
        />
      )}
      <p>{media.alt}
      </p>
    </div>
  );
}
