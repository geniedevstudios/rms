import "./journal-card.styles.css";
import { Link } from "../../routing/link";
import { ArrowUpRight } from "lucide-react";
import { HoverImage } from "../hover-image/hover-image";
export function JournalCard({
  title,
  label,
  image,
  hover,
  to,
}: {
  title: string;
  label: string;
  image: string;
  hover?: string;
  to: string;
}) {
  return (
    <Link to={to} className="journal-card">
      <div className="journal-image">
        <HoverImage src={image} hover={hover} alt={title} />
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
