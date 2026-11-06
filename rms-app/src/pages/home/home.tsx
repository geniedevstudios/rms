import { siteContent, mediaSlot } from "../../content/content";
import { HeroMedia } from "../../components/hero-media/hero-media";
import "../../components/editorial/editorial.styles.css";
import "./home.styles.css";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { ArrowRight, ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { products } from "../../data/products";
import { ProductCard } from "../../features/products/product-card/product-card";
import { Category } from "../../components/category-card/category-card";
import { AtelierVideo } from "../../components/atelier-video/atelier-video";
import { JournalCard } from "../../components/journal-card/journal-card";
export function Home() {
  const { openDialog } = useDialogs();
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
          <span className="image-label">
            FORM, FEELING & EVERYTHING IN BETWEEN.
          </span>
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">THE ART OF EVERYDAY DRESSING</span>
          <h2>
            Soft in form.
            <br />
            <em>Strong in spirit.</em>
          </h2>
          <p>
            There is power in feeling entirely yourself. Discover thoughtful
            proportions, expressive details and silhouettes with room to be you.
          </p>
          <Link to="/shop?category=Two%20piece" className="text-link">
            Explore two piece <ArrowRight size={16} />
          </Link>
          <span className="editorial-number">RMS / 001</span>
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
          <span className="eyebrow">BEHIND THE SILHOUETTE</span>
          <h2>
            It begins
            <br />
            with <em>intention.</em>
          </h2>
          <p>
            A closer look at the gestures, textures and details that give a
            garment its character.
          </p>
          <button
            className="text-link"
            onClick={() => openDialog({ type: "film" })}
          >
            <Play size={13} /> Watch the atelier film
          </button>
          <span className="film-note">AN ATELIER STUDY — 00:10</span>
        </div>
        <AtelierVideo openFilm={() => openDialog({ type: "film" })} />
      </section>
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
