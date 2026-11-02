import "./journal-card.styles.css";
import { Link } from "../../routing/link";
import { ArrowUpRight } from "lucide-react";
export function JournalCard({
  title,
  label,
  image,
  to,
}: {
  title: string;
  label: string;
  image: string;
  to: string;
}) {
  return (
    <Link to={to} className="journal-card">
      <div className="journal-image">
        <img src={image} alt={title} loading="lazy" />
      </div>
      <div className="journal-card-meta">
        <span className="eyebrow">{label}</span>
        <span>03 MIN READ</span>
      </div>
      <div className="journal-card-heading">
        <h3>{title}</h3>
        <ArrowUpRight size={23} />
      </div>
    </Link>
  );
}
