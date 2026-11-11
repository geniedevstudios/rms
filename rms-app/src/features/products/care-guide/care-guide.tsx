import "./care-guide.styles.css";

const notes = [
  "Wash on a cool, gentle cycle, or by hand.",
  "Keep pieces of a similar colour together.",
  "Avoid bleach.",
  "Dry away from direct sun, and reshape the piece while it is still damp.",
  "Steam, or iron on the reverse, at the heat the label allows.",
  "Hang to store, with a little room between pieces.",
];

export function CareGuide() {
  return (
    <div className="care-guide">
      <span className="eyebrow">A LITTLE GUIDANCE</span>
      <p>
        Always follow the care label sewn into your garment. These notes are
        general, and the label on the piece comes first.
      </p>
      <ul>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
