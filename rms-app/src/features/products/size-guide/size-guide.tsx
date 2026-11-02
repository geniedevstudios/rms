import "./size-guide.styles.css";

export function SizeGuide() {
  return (
    <div className="size-guide">
      <span className="eyebrow">A LITTLE GUIDANCE</span>
      <p>
        Measure around the fullest part of your bust and hips, and the narrowest
        part of your waist. Measurements below are in centimetres.
      </p>
      <table>
        <caption>Indicative body measurements</caption>
        <thead>
          <tr>
            <th>Size</th>
            <th>Bust</th>
            <th>Waist</th>
            <th>Hip</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["XS", "80–84", "62–66", "86–90"],
            ["S", "85–89", "67–71", "91–95"],
            ["M", "90–94", "72–76", "96–100"],
            ["L", "95–101", "77–83", "101–107"],
            ["XL", "102–108", "84–90", "108–114"],
          ].map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={cell} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cell}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="demo-caption">
        Preview guide. RMS’s final garment measurements and fit recommendations
        will replace these sample values.
      </p>
    </div>
  );
}
