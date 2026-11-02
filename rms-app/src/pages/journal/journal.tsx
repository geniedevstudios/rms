import "./journal.styles.css";
import { JournalCard } from "../../components/journal-card/journal-card";
import { Link } from "../../routing/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
export function Journal({ pathname }: { pathname: string }) {
  if (pathname === "/journal")
    return (
      <section className="section">
        <div className="page-intro">
          <span className="eyebrow">NOTES FROM OUR WORLD</span>
          <h1>The RMS journal</h1>
          <p>Ideas, perspectives and the art of getting dressed.</p>
        </div>
        <div className="journal-grid">
          <JournalCard
            title="The beauty of becoming"
            label="THE POINT OF VIEW"
            image="/images/hero.jpg"
            to="/journal/becoming"
          />
          <JournalCard
            title="A study in soft structure"
            label="THE WARDROBE"
            image="/images/cream.jpg"
            to="/journal/structure"
          />
        </div>
      </section>
    );
  const structure = pathname.endsWith("/structure");
  return (
    <article className="journal-article">
      <div className="page-intro">
        <Link to="/journal" className="text-link">
          <ArrowLeft size={14} /> The journal
        </Link>
        <span className="eyebrow">
          {structure ? "THE WARDROBE" : "THE POINT OF VIEW"} / 03 MIN READ
        </span>
        <h1>
          {structure ? "A study in soft structure" : "The beauty of becoming"}
        </h1>
        <p>
          {structure
            ? "On the quiet power of a beautifully considered silhouette."
            : "A wardrobe is a conversation with the person you are becoming."}
        </p>
      </div>
      <img
        className="article-cover"
        src={structure ? "/images/cream.jpg" : "/images/hero.jpg"}
        alt={
          structure
            ? "Relaxed neutral tailoring"
            : "Sculptural black dress editorial"
        }
      />
      <div className="article-body">
        <p className="article-lead">
          {structure
            ? "There is a particular kind of confidence in clothes that never need to announce themselves."
            : "Personal style is rarely a destination. More often, it is a practice of noticing what feels like you."}
        </p>
        <p>
          {structure
            ? "A generous sleeve. A shoulder with just enough definition. The way a trouser falls when you take a step. These small decisions shape how a garment lives with you, and how you feel within it."
            : "Some days call for a clear, sculptural line. Others need a little softness, a familiar shape or a colour that shifts your mood. A considered wardrobe makes space for all of those versions of yourself."}
        </p>
        <h2>{structure ? "Room to move" : "Less noise. More you."}</h2>
        <p>
          {structure
            ? "Soft tailoring begins with balance: structure without stiffness, ease without losing intention. Wear a full set for a composed silhouette, or separate the pieces and let each find its own rhythm."
            : "Begin with the pieces you reach for instinctively. Notice their proportions, textures and the way they move. Let these become the foundation, then add something unexpected: a stronger silhouette, a new shade, a detail that makes you look twice."}
        </p>
        <p>
          {structure
            ? "The result is a wardrobe that works with you. For the planned moments, and the ones that happen in between."
            : "The most lasting style is personal. It is not about arriving at a finished version of yourself. It is about enjoying the becoming."}
        </p>
        <Link
          to={structure ? "/shop?category=Tailoring" : "/collection"}
          className="text-link"
        >
          Explore the edit <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
