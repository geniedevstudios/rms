import { useState } from "react";
import { Plus } from "lucide-react";
import type { Colourway, Product, SizeStock } from "../../../shared/content.types";
import { availableSizes } from "../../../shared/product-sizes.mjs";
import { createContentHandle } from "../../lib/content-handle";
import { MediaField } from "../media/media-picker";
import { AvailableSizesField } from "./available-sizes-field";
import { Field } from "../../components/ui";
import "./colourways-field.styles.css";

const hex = /^#[0-9a-fA-F]{6}$/;

type Draft = Colourway & { draftKey: string };

function blank(sizes: string[]): Draft {
  return {
    draftKey: crypto.randomUUID(),
    id: "",
    color: "",
    swatch: "",
    image: "",
    hoverImage: "",
    gallery: [],
    availableSizes: [...sizes],
    stock: [],
  };
}

export function colourwaysFrom(product: Product): Colourway[] {
  if (product.colourways?.length)
    return product.colourways.map((way) => ({
      ...way,
      gallery: way.gallery ? [...way.gallery] : undefined,
      availableSizes: way.availableSizes ? [...way.availableSizes] : undefined,
      stock: way.stock?.map((row) => ({ ...row })),
    }));
  return [
    {
      id: product.color.trim()
        ? createContentHandle(product.color, [], "colour")
        : "colour",
      color: product.color,
      swatch: product.swatch,
      image: product.image,
      hoverImage: product.hoverImage,
      gallery: product.gallery ? [...product.gallery] : undefined,
      availableSizes: product.availableSizes ? [...product.availableSizes] : undefined,
      stock: product.stock?.map((row) => ({ ...row })),
    },
  ];
}

export function commitColourways(
  ways: Colourway[],
  custom: boolean,
): { colourways: Colourway[] } | { error: string } {
  if (!ways.length) return { error: "Add a colour for this piece." };
  const ids = new Set<string>();
  const colourways: Colourway[] = [];
  for (const way of ways) {
    const color = way.color.trim();
    if (hex.test(way.swatch) && !color)
      return { error: "Name the colour, or leave both the name and the swatch empty." };
    if (ways.length > 1 && !color) return { error: "Name each colour." };
    if (!way.image)
      return {
        error: color
          ? `Add a photograph for ${color}.`
          : "Upload or choose a main photograph for this piece.",
      };
    let id = way.id && way.id !== "colour" ? way.id : createContentHandle(color || "colour", ids, "colour");
    if (ids.has(id)) id = createContentHandle(color || "colour", ids, "colour");
    ids.add(id);
    const sizes = Array.isArray(way.availableSizes) ? way.availableSizes : availableSizes(way);
    if (!custom && sizes.length) {
      const counted = sizes.map((size) => (way.stock ?? []).find((entry) => entry.size === size));
      if (
        counted.some(
          (entry) =>
            !entry ||
            !Number.isInteger(entry.made) ||
            !Number.isInteger(entry.left) ||
            entry.made < 0 ||
            entry.made > 9999 ||
            entry.left < 0 ||
            entry.left > entry.made,
        )
      )
        return {
          error: color
            ? `Enter how many you made, and how many are left, for ${color}.`
            : "Enter how many you made, and how many are left, for each size.",
        };
    }
    const gallery = (way.gallery ?? []).map((url) => url.trim()).filter(Boolean).slice(0, 2);
    const stock: SizeStock[] | undefined =
      custom || !sizes.length
        ? undefined
        : sizes.map((size) => {
            const entry = way.stock!.find((item) => item.size === size)!;
            return { size, made: entry.made, left: entry.left };
          });
    colourways.push({
      id,
      color,
      swatch: color && hex.test(way.swatch) ? way.swatch : "",
      image: way.image,
      hoverImage: way.hoverImage || undefined,
      gallery: gallery.length ? gallery : undefined,
      availableSizes: sizes,
      stock,
    });
  }
  return { colourways };
}

export function ColourwaysField({
  product,
  trackStock,
  onChange,
}: {
  product: Product;
  trackStock: boolean;
  onChange: (colourways: Colourway[]) => void;
}) {
  const [draft, setDraft] = useState<Draft[]>(() =>
    colourwaysFrom(product).map((way) => ({ ...way, draftKey: way.id || crypto.randomUUID() })),
  );
  function emit(next: Draft[]) {
    setDraft(next);
    onChange(next.map((way) => {
      const { draftKey, ...colour } = way;
      void draftKey;
      return colour;
    }));
  }
  function patchWay(draftKey: string, patch: Partial<Colourway>) {
    emit(draft.map((way) => (way.draftKey === draftKey ? { ...way, ...patch } : way)));
  }
  return (
    <section className="colourways">
      <div className="colourways-heading">
        <div>
          <h2>Colours</h2>
          <p>Each colour has its own photographs and, for ready-to-wear, its own quantities.</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            emit([
              ...draft,
              blank(availableSizes(draft[0] ?? {})),
            ])
          }
        >
          <Plus size={15} /> Add a colour
        </button>
      </div>
      {draft.map((way, index) => (
        <article className="colourway" key={way.draftKey}>
          <div className="colourway-title">
            <strong>{way.color.trim() || `Colour ${index + 1}`}</strong>
            {draft.length > 1 && (
              <button
                type="button"
                className="text-button"
                onClick={() => emit(draft.filter((item) => item.draftKey !== way.draftKey))}
              >
                Remove colour
              </button>
            )}
          </div>
          <div className="colourway-grid">
            <div>
              <div className="form-grid">
                <Field label="Colour name">
                  <input
                    value={way.color}
                    placeholder="Onyx"
                    onChange={(event) => {
                      const color = event.target.value;
                      patchWay(
                        way.draftKey,
                        color.trim() ? { color } : { color: "", swatch: "" },
                      );
                    }}
                  />
                </Field>
                <Field label="Colour swatch">
                  <div className="swatch-choice">
                    {!hex.test(way.swatch) ? (
                      <label className="text-button swatch-trigger">
                        Choose a swatch
                        <input
                          className="swatch-input is-waiting"
                          type="color"
                          aria-label={`Swatch for ${way.color || `colour ${index + 1}`}`}
                          value="#282726"
                          onChange={(event) => patchWay(way.draftKey, { swatch: event.target.value })}
                        />
                      </label>
                    ) : (
                      <input
                        className="swatch-input"
                        type="color"
                        aria-label={`Swatch for ${way.color || `colour ${index + 1}`}`}
                        value={way.swatch}
                        onChange={(event) => patchWay(way.draftKey, { swatch: event.target.value })}
                      />
                    )}
                    {(way.color.trim() || hex.test(way.swatch)) && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => patchWay(way.draftKey, { color: "", swatch: "" })}
                      >
                        Clear colour
                      </button>
                    )}
                  </div>
                </Field>
              </div>
              <AvailableSizesField
                key={way.draftKey}
                sizes={availableSizes(way)}
                stock={way.stock}
                trackStock={trackStock}
                onChange={(nextSizes, stock) =>
                  patchWay(way.draftKey, { availableSizes: nextSizes, stock })
                }
              />
            </div>
            <div>
              <MediaField
                label="Main photograph"
                value={way.image}
                onChange={(media) => patchWay(way.draftKey, { image: media.url })}
              />
              <MediaField
                label="Hover photograph"
                value={way.hoverImage || ""}
                onChange={(media) => patchWay(way.draftKey, { hoverImage: media.url })}
                onClear={() => patchWay(way.draftKey, { hoverImage: "" })}
              />
              <MediaField
                label="Photograph 3"
                value={way.gallery?.[0] || ""}
                onChange={(media) =>
                  patchWay(way.draftKey, { gallery: [media.url, way.gallery?.[1] || ""] })
                }
                onClear={() => patchWay(way.draftKey, { gallery: ["", way.gallery?.[1] || ""] })}
              />
              <MediaField
                label="Photograph 4"
                value={way.gallery?.[1] || ""}
                onChange={(media) =>
                  patchWay(way.draftKey, { gallery: [way.gallery?.[0] || "", media.url] })
                }
                onClear={() => patchWay(way.draftKey, { gallery: [way.gallery?.[0] || "", ""] })}
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
