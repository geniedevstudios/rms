import "./atelier-video.styles.css";
import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { atelierPreview } from "../../features/film/film-source";
export function AtelierVideo({ openFilm }: { openFilm: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void video.play().catch(() => setFailed(true));
  }, []);
  return (
    <div className="atelier-video">
      <video
        ref={ref}
        src={atelierPreview}
        poster="/images/suit.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label="Atelier film of a seamstress shaping fabric on a mannequin"
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
