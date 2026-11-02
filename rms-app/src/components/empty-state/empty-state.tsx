import "./empty-state.styles.css";
import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action: () => void;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="button dark" onClick={action}>
        Explore the wardrobe <ArrowRight size={15} />
      </button>
    </div>
  );
}
