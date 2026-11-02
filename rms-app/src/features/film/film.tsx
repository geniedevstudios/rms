import "./film.styles.css";

export function Film() {
  return (
    <div className="film-modal">
      <video
        src="/videos/atelier.mp4"
        controls
        autoPlay
        muted
        playsInline
        aria-label="A seamstress adjusting fabric on a mannequin"
      />
      <p>
        Atelier mood film · Placeholder footage by Michael Burrows / Pexels. No
        dialogue.
      </p>
    </div>
  );
}
