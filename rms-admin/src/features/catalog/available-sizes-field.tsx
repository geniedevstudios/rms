import { useState } from "react";
import chart from "../../../shared/size-guide.json";
import { productSizes } from "../../../shared/product-sizes.mjs";
import type { SizeStock } from "../../../shared/content.types";
import "./available-sizes-field.styles.css";

type Draft = Record<string, { made: string; left: string }>;

function parseQty(value: string) {
  if (!/^\d{1,4}$/.test(value)) return null;
  const number = Number(value);
  return number <= 9999 ? number : null;
}

function draftFrom(sizes: string[], stock: SizeStock[] | undefined): Draft {
  return Object.fromEntries(
    sizes.map((size) => {
      const entry = stock?.find((item) => item.size === size);
      return [size, { made: entry ? String(entry.made) : "", left: entry ? String(entry.left) : "" }];
    }),
  );
}

export function AvailableSizesField({
  sizes,
  stock,
  trackStock,
  onChange,
}: {
  sizes: string[];
  stock?: SizeStock[];
  trackStock: boolean;
  onChange: (sizes: string[], stock?: SizeStock[]) => void;
}) {
  const [chosen, setChosen] = useState(sizes);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(sizes, stock));
  function emit(nextChosen: string[], nextDraft: Draft) {
    setChosen(nextChosen);
    setDraft(nextDraft);
    const ordered = productSizes.filter((size) => nextChosen.includes(size));
    if (!trackStock) {
      onChange(ordered);
      return;
    }
    const nextStock = ordered.flatMap((size) => {
      const row = nextDraft[size] ?? { made: "", left: "" };
      const made = parseQty(row.made);
      const left = parseQty(row.left);
      return made == null || left == null ? [] : [{ size, made, left }];
    });
    onChange(ordered, nextStock);
  }
  function toggle(size: string, on: boolean) {
    const nextChosen = on ? [...chosen, size] : chosen.filter((item) => item !== size);
    const nextDraft = { ...draft };
    if (on && !nextDraft[size]) nextDraft[size] = { made: "", left: "" };
    if (!on) delete nextDraft[size];
    emit(nextChosen, nextDraft);
  }
  function changeMade(size: string, made: string) {
    const row = draft[size] ?? { made: "", left: "" };
    const follow = row.left === "" || row.left === row.made;
    emit(chosen, { ...draft, [size]: { made, left: follow ? made : row.left } });
  }
  return (
    <fieldset className="available-sizes-field">
      <legend>Available sizes</legend>
      <p>
        {trackStock
          ? "Choose each size you offer, then enter how many you made and how many are left. A paid order reduces what is left."
          : "Choose the sizes customers can order. Leave all unchecked to mark this piece as sold out."}
      </p>
      <div className={`available-sizes-options${trackStock ? " tracks-stock" : ""}`}>
        {chart.map((group) => {
          const on = chosen.includes(group.size);
          const row = draft[group.size] ?? { made: "", left: "" };
          return (
            <div key={group.size} className={on ? "is-on" : ""}>
              <label>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(event) => toggle(group.size, event.target.checked)}
                />
                <span>
                  <strong>{group.size}</strong>
                  <small>UK {group.measurements.map((row) => row.uk).join(" / ")}</small>
                </span>
              </label>
              {trackStock && on && (
                <div className="size-stock">
                  <label>
                    Made
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      step="1"
                      inputMode="numeric"
                      aria-label={`How many size ${group.size} were made`}
                      value={row.made}
                      onChange={(event) => changeMade(group.size, event.target.value)}
                    />
                  </label>
                  <label>
                    Left
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      step="1"
                      inputMode="numeric"
                      aria-label={`How many size ${group.size} are left`}
                      value={row.left}
                      onChange={(event) =>
                        emit(chosen, {
                          ...draft,
                          [group.size]: { ...row, left: event.target.value },
                        })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="available-sizes-actions">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            const nextDraft = { ...draft };
            for (const size of productSizes)
              if (!nextDraft[size]) nextDraft[size] = { made: "", left: "" };
            emit([...productSizes], nextDraft);
          }}
        >
          Select all
        </button>
        <button type="button" className="text-button" onClick={() => emit([], {})}>
          Clear sizes
        </button>
      </div>
    </fieldset>
  );
}
