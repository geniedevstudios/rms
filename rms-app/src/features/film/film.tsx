import "./film.styles.css";
import { atelierFilm, youtubeId } from "./film-source";

export function Film() {
  const id = youtubeId(atelierFilm);
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
          src={atelierFilm}
          controls
          autoPlay
          muted
          playsInline
          aria-label="A seamstress adjusting fabric on a mannequin"
        />
      )}
      <p>
        Atelier mood film · Placeholder footage by Michael Burrows / Pexels. No
        dialogue.
      </p>
    </div>
  );
}
