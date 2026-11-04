import { mediaSlot } from "../../content/content";
import "./film.styles.css";
import { youtubeId } from "./film-source";

export function Film() {
  const film = mediaSlot("atelier-film").src;
  const id = youtubeId(film);
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
          src={film}
          controls
          autoPlay
          muted
          playsInline
          aria-label={mediaSlot("atelier-film").alt}
        />
      )}
      <p>{mediaSlot("atelier-film").alt}
      </p>
    </div>
  );
}
