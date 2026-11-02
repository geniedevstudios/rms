import "../../components/editorial/editorial.styles.css";
import "./about.styles.css";
import { useDialogs } from "../../components/dialogs/dialogs.context";
import { Play } from "lucide-react";
import { AtelierVideo } from "../../components/atelier-video/atelier-video";
export function About() {
  const { openDialog } = useDialogs();
  const onFilm = () => openDialog({ type: "film" });
  return (
    <>
      <section className="about-hero">
        <div>
          <span className="eyebrow">THE WORLD OF RIVERMINDSTYLE</span>
          <h1>
            An expression
            <br />
            of <em>you.</em>
          </h1>
          <p>
            We believe the most compelling style begins with a sense of self.
            Not a formula, a fleeting moment or an expectation. A feeling of
            being entirely your own.
          </p>
        </div>
        <img
          src="/images/portrait.jpg"
          alt="A confident portrait in a black dress"
        />
      </section>
      <section className="manifesto">
        <span className="eyebrow">OUR POINT OF VIEW</span>
        <h2>
          Rooted in identity.
          <br />
          <em>Open to the world.</em>
        </h2>
        <p className="manifesto-body">
          RIVERMINDSTYLE explores the meeting of strength and softness. An
          African perspective, expressed through considered silhouettes,
          thoughtful detail and a contemporary eye. A wardrobe that leaves room
          for the individual.
        </p>
      </section>
      <section className="film-section about-film">
        <div className="film-intro">
          <span className="eyebrow">THE MAKING OF A SILHOUETTE</span>
          <h2>
            Thoughtful
            <br />
            by <em>nature.</em>
          </h2>
          <p>
            Form. Texture. Movement. An exploration of the details that make a
            piece feel personal.
          </p>
          <button className="text-link" onClick={onFilm}>
            <Play size={14} /> Watch the atelier study
          </button>
        </div>
        <AtelierVideo openFilm={onFilm} />
      </section>
      <section className="manifesto">
        <span className="eyebrow">BEHIND THE HOUSE</span>
        <h2>
          One eye.
          <br />
          <em>A whole wardrobe.</em>
        </h2>
        <p className="manifesto-body">
          The clothes begin with a person. RIVERMINDSTYLE is shaped by the
          woman who founded it, from the first line of a silhouette to the
          quiet left for the wearer.
        </p>
      </section>
      <section className="founder">
        <img
          src="/images/mimi.jpg"
          alt="Mirriam Elsa, owner of RIVERMINDSTYLE"
        />
        <div className="founder-story">
          <span className="eyebrow">THE FOUNDER</span>
          <h2>Mirriam Elsa</h2>
          <p className="founder-role">Owner of RIVERMINDSTYLE</p>
          <p>
            RIVERMINDSTYLE began with Mirriam Elsa. She wanted clothes that hold a
            woman’s own presence, not a borrowed one. Strength and softness, in
            the same line. An African way of seeing, made quietly and worn in
            the world.
          </p>
          <p>
            The house still follows her eye. Each piece is considered for the
            woman inside it, with room to move and room to become. This is her
            point of view, offered as a wardrobe.
          </p>
        </div>
      </section>
    </>
  );
}
