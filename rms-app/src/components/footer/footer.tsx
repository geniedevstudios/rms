import "./footer.styles.css";
import { useDialogs } from "../dialogs/dialogs.context";
import { Link } from "../../routing/link";
import { ArrowUp } from "lucide-react";
export function Footer() {
  const { openDialog } = useDialogs();
  const help = (topic: string) => openDialog({ type: "help", topic });
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-intro">
          <p>
            Considered silhouettes.
            <br />
            An expression of you.
          </p>
          <span className="eyebrow">
            ROOTED IN IDENTITY. OPEN TO THE WORLD.
          </span>
        </div>
        <div className="footer-col">
          <h3>Explore</h3>
          <Link to="/shop">All pieces</Link>
          <Link to="/shop?edit=new">New arrivals</Link>
          <Link to="/collection">The collection</Link>
          <Link to="/about">Our world</Link>
        </div>
        <div className="footer-col">
          <h3>Client care</h3>
          {["Contact us", "Delivery & returns", "Care guide"].map((topic) => (
            <button key={topic} onClick={() => help(topic)}>
              {topic}
            </button>
          ))}
          <button onClick={() => openDialog({ type: "size-guide" })}>
            Size guide
          </button>
        </div>
        <div className="footer-col">
          <h3>Your RMS</h3>
          <button onClick={() => openDialog({ type: "account" })}>
            Your account
          </button>
          <button onClick={() => openDialog({ type: "wishlist" })}>
            Saved pieces
          </button>
          <button onClick={() => openDialog({ type: "account" })}>
            Your orders
          </button>
          <Link to="/journal">The journal</Link>
        </div>
        <div className="footer-col">
          <h3>Legal</h3>
          <button onClick={() => help("Privacy")}>Privacy</button>
          <button onClick={() => help("Terms")}>Terms</button>
        </div>
      </div>
      <div className="footer-bottom">
        <Link to="/" className="footer-logo">
          RIVERMINDSTYLE
        </Link>
        <div className="footer-meta">
          <button
            type="button"
            className="footer-copy"
            onClick={() => openDialog({ type: "copyright" })}
          >
            © {new Date().getFullYear()} RIVERMINDSTYLE
          </button>
          <button
            type="button"
            className="text-link back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top <ArrowUp size={14} />
          </button>
          <div>
            <a
              href="https://geniedevstudios.com/services"
              className="curated-pill"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Developer portfolio — curated by"
            >
              <span className="curated-label">Curated by</span>
              <img
                src="/genie-logo.png"
                alt=""
                width={24}
                height={24}
                className="curated-logo"
              />
              <span className="curated-sep">|</span>
              <span className="curated-dev">dev</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
