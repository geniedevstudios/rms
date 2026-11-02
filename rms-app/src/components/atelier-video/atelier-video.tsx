import "./atelier-video.styles.css";
import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
export function AtelierVideo({ openFilm }: { openFilm: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="atelier-video">
      <video
        ref={ref}
        src="/videos/atelier.mp4"
        poster="/images/suit.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label="Preview film of a seamstress shaping fabric on a mannequin"
      />
      {failed ? (
        <button className="film-play" onClick={openFilm}>
          <Play /> Open film
        </button>
      ) : (
        <button
          className={`film-play ${playing ? "playing" : ""}`}
          aria-label={playing ? "Pause atelier film" : "Play atelier film"}
          onClick={() => {
            if (playing) ref.current?.pause();
            else void ref.current?.play().catch(() => setFailed(true));
          }}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      )}
      <span className="video-caption">THE ART OF MAKING</span>
    </div>
  );
}
