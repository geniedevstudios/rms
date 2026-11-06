import { useEffect, useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { siteContent } from "../../content/content";
import { Link } from "../../routing/link";
import "./hero-media.styles.css";

const fadeMs = 1150;

export function HeroMedia() {
  const { slides, interval, caption } = siteContent.hero;
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovering, setHovering] = useState(false);
  const show = (next: number) => {
    if (next === index || slides.length < 2) return;
    setLeaving(index);
    setIndex(next);
  };

  useEffect(() => {
    if (paused || hovering || slides.length < 2) return;
    const timer = setInterval(
      () => show((index + 1) % slides.length),
      interval * 1000,
    );
    return () => clearInterval(timer);
  }, [paused, hovering, slides.length, interval, index]);

  useEffect(() => {
    if (leaving == null) return;
    const timer = setTimeout(() => setLeaving(null), fadeMs);
    return () => clearTimeout(timer);
  }, [leaving, index]);

  return (
    <div
      className="hero-image managed-hero"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false);
      }}
    >
      <Link to="/collection" className="hero-media-link">
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          const className = active
            ? "is-active"
            : slideIndex === leaving
              ? "is-leaving"
              : undefined;
          return slide.type === "video" ? (
            <video
              key={slide.id}
              className={className}
              src={slide.src}
              muted
              loop
              playsInline
              autoPlay={active && !paused}
              preload="metadata"
              aria-label={active ? slide.alt : undefined}
              aria-hidden={active ? undefined : true}
              ref={(video) => {
                if (!video) return;
                if (active && !paused) void video.play().catch(() => {});
                else video.pause();
              }}
            />
          ) : (
            <img
              key={slide.id}
              className={className}
              src={slide.src}
              alt={active ? slide.alt : ""}
              aria-hidden={active ? undefined : true}
              fetchPriority={slideIndex === 0 ? "high" : "auto"}
            />
          );
        })}
        <div className="hero-image-caption">
          <span>{caption}</span>
          <ArrowUpRight size={22} />
        </div>
      </Link>
      {(slides.length > 1 || slides[index]?.type === "video") && (
        <div className="hero-media-controls">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              className={slideIndex === index ? "active" : ""}
              onClick={() => show(slideIndex)}
              aria-label={`Show hero slide ${slideIndex + 1}`}
              aria-pressed={slideIndex === index}
            />
          ))}
          <button
            className="hero-pause"
            aria-label={paused ? "Resume hero rotation" : "Pause hero rotation"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}
