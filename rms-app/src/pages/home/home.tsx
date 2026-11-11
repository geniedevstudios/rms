import { siteContent, mediaSlot } from "../../content/content";
import defaults from "../../shared/default-content.json";
import { HeroMedia } from "../../components/hero-media/hero-media";
import "../../components/editorial/editorial.styles.css";
import "./home.styles.css";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { ArrowRight, ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { products } from "../../data/products";
import { ProductCard } from "../../features/products/product-card/product-card";
import { Category } from "../../components/category-card/category-card";
import { AtelierVideo, FilmLines } from "../../components/atelier-video/atelier-video";
import { JournalCard } from "../../components/journal-card/journal-card";
export function Home() {
  const { openDialog } = useDialogs();
  const editorial = siteContent.editorial?.title
    ? siteContent.editorial
    : defaults.editorial;
  const film = siteContent.films?.home?.title
    ? siteContent.films.home
    : defaults.films.home;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">{siteContent.hero.eyebrow}</div>
          <h1>{siteContent.hero.title.split("\n").map((line, index) => <span key={index}>{index > 0 && <br />}{index === 0 ? line : <em>{line}</em>}</span>)}</h1>
          <p>{siteContent.hero.description}</p>
          <Link to={siteContent.hero.buttonHref} className="button dark">{siteContent.hero.buttonLabel} <ArrowRight size={17}/></Link>
          <div className="hero-footnote">
            <span>A NEW EXPRESSION OF YOU</span>
            <a
              href="#new-arrivals"
              aria-label="Explore new arrivals"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("new-arrivals")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <ArrowDown size={18} />
            </a>
          </div>
        </div>
        <HeroMedia />
      </section>
      <section className="manifesto">
        <span className="eyebrow">THE RIVERMINDSTYLE POINT OF VIEW</span>
        <h2>
          Style is not just what you wear.
          <br />
          It’s how you <em>come into your own.</em>
        </h2>
        <Link to="/about" className="text-link">
          Enter our world <ArrowUpRight size={15} />
        </Link>
      </section>
      {products.some((product) => product.newArrival) && (
      <section className="section new-arrivals" id="new-arrivals">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A CONSIDERED WARDROBE</span>
            <h2>New & noteworthy</h2>
          </div>
          <Link to="/shop?edit=new" className="text-link">
            Explore new arrivals <ArrowRight size={15} />
          </Link>
        </div>
        <div className="product-grid">
          {products.filter((product) => product.newArrival).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      )}
      <section className="editorial-split">
        <div className="editorial-photo">
          <img
            src={mediaSlot("home-editorial").src}
            alt={mediaSlot("home-editorial").alt}
            loading="lazy"
          />
          {editorial.caption.trim() && (
            <span className="image-label">{editorial.caption}</span>
          )}
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">{editorial.eyebrow}</span>
          <h2>
            {editorial.title.split("\n").map((line, index) => (
              <span key={index}>
                {index > 0 && <br />}
                {index === 0 ? line : <em>{line}</em>}
              </span>
            ))}
          </h2>
          <p>
            {editorial.description.split("\n").map((line, index) => (
              <span key={index}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          {editorial.buttonLabel.trim() && (
            <Link to={editorial.buttonHref} className="text-link">
              {editorial.buttonLabel} <ArrowRight size={16} />
            </Link>
          )}
          {editorial.mark.trim() && (
            <span className="editorial-number">{editorial.mark}</span>
          )}
        </div>
      </section>
      <section className="section category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR EXPRESSION</span>
            <h2>A world of possibilities</h2>
          </div>
        </div>
        <div className="category-grid">
          {siteContent.categoryCards.map(card => <Category key={card.id} {...card} />)}
        </div>
      </section>
      <section className="film-section">
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
            <button
              className="text-link"
              onClick={() => openDialog({ type: "film", place: "home" })}
            >
              <Play size={13} /> {film.buttonLabel}
            </button>
          )}
          {film.note.trim() && <span className="film-note">{film.note}</span>}
        </div>
        <AtelierVideo
          filmId="atelier-film"
          posterId="atelier-poster"
          openFilm={() => openDialog({ type: "film", place: "home" })}
          caption={film.caption}
        />
      </section>
      {products.some((product) => product.bestSeller) && (
        <section className="section best-sellers" id="best-sellers">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MOST LOVED</span>
              <h2>Best sellers</h2>
            </div>
          </div>
          <div className="product-grid">
            {products
              .filter((product) => product.bestSeller)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </section>
      )}
      <section className="section journal-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NOTES FROM OUR WORLD</span>
            <h2>The RMS journal</h2>
          </div>
          <Link to="/journal" className="text-link">
            Read the journal <ArrowRight size={16} />
          </Link>
        </div>
        <div className="journal-grid">
          {siteContent.journals.filter(j => j.status === "published" && j.featured).map(j => <JournalCard key={j.id} title={j.title} label={j.label} image={j.image} hover={j.hover} to={`/journal/${j.id}`} />)}
        </div>
      </section>
    </>
  );
}
