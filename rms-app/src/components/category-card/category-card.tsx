import "./category-card.styles.css";
import { Link } from "../../routing/link";
import { ArrowUpRight } from "lucide-react";
import { HoverImage } from "../hover-image/hover-image";
export function Category({
  title,
  subtitle,
  image,
  hover,
  to,
}: {
  title: string;
  subtitle: string;
  image: string;
  hover?: string;
  to: string;
}) {
  return (
    <Link to={to} className="category-card">
      <div className="category-image">
        <HoverImage src={image} hover={hover} alt={title} />
      </div>
      <div>
        <h3>{title}</h3>
        <ArrowUpRight size={20} />
      </div>
      <p>{subtitle}</p>
    </Link>
  );
}
