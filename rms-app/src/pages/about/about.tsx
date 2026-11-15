import { useState } from "react";
import { mediaSlot, siteContent } from "../../content/content";
import { aboutFilmCopy } from "../../shared/about-film-copy";
import "../../components/editorial/editorial.styles.css";
import "./about.styles.css";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { ArrowRight, Play } from "lucide-react";
import { AtelierVideo, FilmLines } from "../../components/atelier-video/atelier-video";
import { Link } from "../../routing/link";
import { StudioMap } from "./studio-map";
export function About() {
  const { openDialog } = useDialogs();
  const onFilm = () => openDialog({ type: "film", place: "about" });
  const [atStudio, setAtStudio] = useState(false);
  const film = aboutFilmCopy(siteContent.films?.about);
  return (
    <>
      <section className="about-hero">
        <div>
          <span className="eyebrow">OUR STORY</span>
          <h1>
            A considered
            <br />
            <em>way to dress.</em>
          </h1>
          <p>
            Rivermindstyle is an Accra-based fashion house rooted in a considered
            approach to dressing. Our collections explore the relationship
            between clothing, personal style and the way women move through life.
          </p>
        </div>
        <img
          src={mediaSlot("about-hero").src}
          alt={mediaSlot("about-hero").alt}
        />
      </section>
      <section className="manifesto">
        <span className="eyebrow">OUR APPROACH</span>
        <h2>
          Softness
          <br />
          <em>with structure.</em>
        </h2>
        <p className="manifesto-body">
          We create distinctive womenswear defined by clean silhouettes,
          thoughtful construction and considered details. Our designs bring
          together form, texture and shape to create pieces that feel both
          expressive and enduring.
        </p>
      </section>
      <section className="film-section about-film">
        <div className="film-intro">
          <span className="eyebrow">{film.eyebrow}</span>
          <h2>
            <FilmLines text={film.title} />
          </h2>
          <p>
            {film.description.split("\n").map((line, index) => (
              <span key={index}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          {film.buttonLabel.trim() && (
            <button className="text-link" onClick={onFilm}>
              <Play size={14} /> {film.buttonLabel}
            </button>
          )}
          {film.note.trim() && <span className="film-note">{film.note}</span>}
        </div>
        <AtelierVideo
          filmId="about-film"
          posterId="about-poster"
          openFilm={onFilm}
          caption={film.caption}
        />
      </section>
      <section className="manifesto">
        <span className="eyebrow">OUR PHILOSOPHY</span>
        <h2>
          Style
          <br />
          <em>in motion.</em>
        </h2>
        <p className="manifesto-body">
          Inspired by the nature of a river, our philosophy is centred on
          movement, evolution and the beauty of becoming. We believe in a
          style that is intentional, adaptable and distinctly personal.
        </p>
      </section>
      <section className="founder">
        <img
          src={mediaSlot("founder").src}
          alt={mediaSlot("founder").alt.replace(
            /\bMirriam Elsa\b(?! Kurankyi\b)/,
            "Mirriam Elsa Kurankyi",
          )}
        />
        <div className="founder-story">
          <span className="eyebrow">THE FOUNDER</span>
          <h2>Mirriam Elsa Kurankyi</h2>
          <p className="founder-role">Founder of RIVERMINDSTYLE</p>
          <p>
            Mirriam founded Rivermindstyle in October 2021 with an appreciation
            for thoughtful design. Her approach to womenswear leaves room for
            each wearer to express her own style.
          </p>
        </div>
      </section>
      <section className="manifesto studio-break">
        <span className="eyebrow">BY APPOINTMENT</span>
        <h2>
          Visit the
          <br />
          <em>Accra studio.</em>
        </h2>
        <p className="manifesto-body">
          You’ll find us on Vanilla Street in Adenta. Visits are by appointment,
          daily from 9:00 to 17:45.
        </p>
      </section>
      <section className="studio-locator" aria-label="Studio location">
        <div className="studio-panel">
          <h2>Our studio</h2>
          <p className="studio-count">1 studio in Adenta</p>
          <div
            className={atStudio ? "studio-card is-open" : "studio-card"}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) return;
              setAtStudio(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setAtStudio(true);
              }
            }}
          >
            <h3>RIVERMINDSTYLE</h3>
            <p className="eyebrow">By appointment</p>
            <address>
              Vanilla Street
              <br />
              Adenta, Accra, Ghana
            </address>
            <div className="studio-hours">
              <span className="eyebrow">Hours</span>
              <p>Every day, 9:00–17:45</p>
              <p>A visit is arranged ahead.</p>
            </div>
            <Link to="/custom" className="text-link">
              Book an appointment <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="studio-map-frame">
          <button type="button" className="studio-reset" onClick={() => setAtStudio(false)}>
            Studio locator
          </button>
          <StudioMap focused={atStudio} onSelect={() => setAtStudio(true)} />
        </div>
      </section>
    </>
  );
}
