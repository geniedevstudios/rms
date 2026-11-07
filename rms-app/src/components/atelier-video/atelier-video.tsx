import { filmMedia } from "../../content/content";
import "./atelier-video.styles.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

export function FilmLines({ text }: { text: string }) {
  return text.split("\n").map((line, index) => (
    <span key={index}>
      {index > 0 && <br />}
      <Marked line={line} />
    </span>
  ));
}

function Marked({ line }: { line: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /\*([^*]+)\*/g;
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(line.slice(last, start));
    nodes.push(<em key={start}>{match[1]}</em>);
    last = start + match[0].length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  if (!nodes.length) nodes.push(line);
  return <>{nodes}</>;
}

export function AtelierVideo({
  openFilm,
  caption,
  filmId = "atelier-film",
  posterId = "atelier-poster",
}: {
  openFilm: () => void;
  caption: string;
  filmId?: "atelier-film" | "about-film";
  posterId?: "atelier-poster" | "about-poster";
}) {
  const film = filmMedia(filmId);
  const poster = filmMedia(posterId);
  const src = film.src;
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void video.play().catch(() => {
      if (ref.current?.paused) setFailed(true);
    });
  }, [src]);
  return (
    <div className="atelier-video">
      <video
        ref={ref}
        src={src}
        poster={poster.src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
        onPlay={() => {
          setPlaying(true);
          setFailed(false);
        }}
        onPause={() => setPlaying(false)}
        aria-label={film.alt}
      />
      {playing ? (
        <button
          className="film-play playing"
          aria-label="Pause atelier film"
          onClick={() => ref.current?.pause()}
        >
          <Pause size={20} />
        </button>
      ) : failed ? (
        <button className="film-play" onClick={openFilm}>
          <Play /> Open film
        </button>
      ) : (
        <button
          className="film-play"
          aria-label="Play atelier film"
          onClick={() => {
            void ref.current?.play().catch(() => {
              if (ref.current?.paused) setFailed(true);
            });
          }}
        >
          <Play size={20} />
        </button>
      )}
      {caption.trim() && <span className="video-caption">{caption}</span>}
    </div>
  );
}
