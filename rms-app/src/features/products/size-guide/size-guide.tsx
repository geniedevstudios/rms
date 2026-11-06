import "./size-guide.styles.css";
import { sizeGuide } from "../../../data/size-guide";

export function SizeGuide() {
  return (
    <div className="size-guide">
      <span className="eyebrow">A LITTLE GUIDANCE</span>
      <p>
        Measure around the fullest part of your bust and hips, and the narrowest
        part of your waist. Measurements below are in inches.
      </p>
      <table>
        <caption>RIVERMINDSTYLE · UK sizes 6–20 · Measurements in inches</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">UK</th>
            <th scope="col">Bust</th>
            <th scope="col">Waist</th>
            <th scope="col">Hip</th>
            <th scope="col">Pants<br />length</th>
          </tr>
        </thead>
        <tbody>
          {sizeGuide.flatMap(group => group.measurements.map(row => (
            <tr key={row.uk}>
              <td title={group.label}>{group.size}</td>
              <th scope="row">{row.uk}</th>
              <td>{row.bust}</td>
              <td>{row.waist}</td>
              <td>{row.hip}</td>
              <td>{row.pantsLength}</td>
            </tr>
          )))}
        </tbody>
      </table>
      <p className="demo-caption">
        We’re happy to adjust the measurements. Just let us know in the order
        notes when placing your order.
      </p>
    </div>
  );
}
