import { clientCareContent } from "./client-care.data";
import "./client-care.styles.css";

export function Help({ topic }: { topic: string }) {
  const entry = clientCareContent[topic] || clientCareContent["Contact us"];
  return (
    <div className="help-content">
      <span className="eyebrow">RIVERMINDSTYLE / CLIENT CARE</span>
      <h3>{entry.title}</h3>
      {entry.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
