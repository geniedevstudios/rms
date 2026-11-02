import "./category-card.styles.css";
import { Link } from "../../routing/link";
import { ArrowUpRight } from "lucide-react";
export function Category({
  title,
  subtitle,
  image,
  to,
}: {
  title: string;
  subtitle: string;
  image: string;
  to: string;
}) {
  return (
    <Link to={to} className="category-card">
      <div className="category-image">
        <img src={image} alt={title} loading="lazy" />
      </div>
      <div>
        <h3>{title}</h3>
        <ArrowUpRight size={20} />
      </div>
      <p>{subtitle}</p>
    </Link>
  );
}
