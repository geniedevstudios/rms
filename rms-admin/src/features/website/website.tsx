import { useState } from "react";
import defaults from "../../../shared/default-content.json";
import { ArrowUp, ArrowDown, ArrowUpRight, Plus, Trash2, Image } from "lucide-react";
import { useContent } from "../../app/content.context";
import type { Content } from "../../../shared/content.types";
import { PageHeading, Field, Thumb, Modal } from "../../components/ui";
import { DestinationPicker } from "../../components/destination-picker";
import { MediaPicker, MediaField } from "../media/media-picker";
import { MediaLibrary } from "../media/media";
import { JournalEditor } from "../journal/journal";
import { Promotions } from "../promotions/promotions";

const storefrontTabs = ["Home hero", "Page imagery"];
const videoPlacements = new Set(["atelier-film", "about-film"]);

function ensureSlot(draft: Content, id: string) {
  if (draft.slots.some((slot) => slot.id === id)) return;
  const seedSlot = (defaults.slots as Content["slots"]).find((slot) => slot.id === id);
  if (!seedSlot) return;
  const twinId =
    id === "about-film" ? "atelier-film" : id === "about-poster" ? "atelier-poster" : "";
  const twin = twinId ? draft.slots.find((slot) => slot.id === twinId) : undefined;
  draft.slots.push({
    ...structuredClone(seedSlot),
    src: twin?.src || seedSlot.src,
    alt: twin?.alt || seedSlot.alt,
  });
}

function placementMedia(slots: Content["slots"], id: string) {
  return (
    slots.find((slot) => slot.id === id) ??
    (id === "about-film"
      ? slots.find((slot) => slot.id === "atelier-film")
      : id === "about-poster"
        ? slots.find((slot) => slot.id === "atelier-poster")
        : undefined)
  );
}

const imageryGuide = [
  {
    id: "home-editorial",
    title: "Editorial photograph",
    page: "Home",
    pages: ["Home"],
    where: "Beside the homepage editorial.",
  },
  {
    id: "atelier-film",
    title: "Atelier film",
    page: "Home",
    pages: ["Home"],
    where: "Plays beside the atelier wording on Home.",
  },
  {
    id: "atelier-poster",
    title: "Film cover",
    page: "Home",
    pages: ["Home"],
    where: "The still shown before the Home film plays.",
  },
  {
    id: "about-film",
    title: "Atelier film",
    page: "Our world",
    pages: ["Our world"],
    where: "Plays beside the atelier wording on Our world.",
  },
  {
    id: "about-poster",
    title: "Film cover",
    page: "Our world",
    pages: ["Our world"],
    where: "The still shown before the Our world film plays.",
  },
  {
    id: "about-hero",
    title: "Opening portrait",
    page: "Our world",
    pages: ["Our world"],
    where: "Beside “An expression of you.”",
  },
  {
    id: "founder",
    title: "Founder portrait",
    page: "Our world",
    pages: ["Our world"],
    where: "Beside the founder story.",
  },
  {
    id: "custom-hero",
    title: "Opening image",
    page: "Custom",
    pages: ["Custom"],
    where: "Beside “Custom made dresses.”",
  },
  {
    id: "custom-detail",
    title: "Consultation image",
    page: "Custom",
    pages: ["Custom"],
    where: "Beside “A piece that is only yours.”",
  },
];

const imageryPages = [
  { page: "Home", note: "These appear on the home page." },
  {
    page: "Our world",
    note: "These appear on Our world.",
  },
  { page: "Custom", note: "These appear on the Custom page." },
];

type FilmCopy = {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  note: string;
  caption: string;
};

function FilmFields({
  value,
  onChange,
}: {
  value: FilmCopy;
  onChange: (patch: Partial<FilmCopy>) => void;
}) {
  return (
    <>
      <Field label="Eyebrow">
        <input
          value={value.eyebrow}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </Field>
      <Field
        label="Headline"
        hint="One line per row. Wrap a word in *asterisks* to italicise it."
      >
        <textarea
          rows={3}
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>
      <Field label="Introduction">
        <textarea
          rows={3}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>
      <Field label="Button text" hint="Opens the film.">
        <input
          value={value.buttonLabel}
          onChange={(e) => onChange({ buttonLabel: e.target.value })}
        />
      </Field>
      <Field label="Small line" hint="Leave this empty to hide it.">
        <input
          value={value.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </Field>
      <Field label="Words on the film" hint="Leave this empty to hide them.">
        <input
          value={value.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
        />
      </Field>
      <p className="muted">This page’s film and cover are chosen under Page imagery.</p>
    </>
  );
}

export function Website({
  section = "website",
  onSection,
}: {
  section?: "website" | "media" | "journal" | "promotions";
  onSection?: (section: "website" | "media" | "journal" | "promotions") => void;
}) {
  const { content, update } = useContent();
  const [tab, setTab] = useState("Home hero");
  const [imageryPage, setImageryPage] = useState("Home");
  const storefrontTab = tab === "Home hero" ? "Home hero" : "Page imagery";
  const [adding, setAdding] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const h = content.hero;
  const editorial = content.editorial ?? defaults.editorial;
  const [editorialOpen, setEditorialOpen] = useState(false);
  const [editorialDraft, setEditorialDraft] = useState(editorial);
  const [editorialError, setEditorialError] = useState("");
  const films = {
    home: content.films?.home ?? defaults.films.home,
    about: content.films?.about ?? defaults.films.about,
  };
  const [filmEdit, setFilmEdit] = useState<"home" | "about" | null>(null);
  const [filmDraft, setFilmDraft] = useState<FilmCopy>(films.home);
  const [filmError, setFilmError] = useState("");
  const covers = {
    home: placementMedia(content.slots, "atelier-poster"),
    about: placementMedia(content.slots, "about-poster"),
  };
  const editorialPhoto = content.slots.find((slot) => slot.id === "home-editorial");
  function openEditorial() {
    setEditorialError("");
    setEditorialDraft(structuredClone(editorial));
    setEditorialOpen(true);
  }
  function saveEditorial() {
    if (
      !editorialDraft.eyebrow.trim() ||
      !editorialDraft.title.trim() ||
      !editorialDraft.description.trim() ||
      !editorialDraft.buttonLabel.trim()
    ) {
      setEditorialError("Add the eyebrow, headline, introduction, and button.");
      return;
    }
    update((c) => {
      c.editorial = editorialDraft;
    });
    setEditorialOpen(false);
  }
  function openFilm(place: "home" | "about") {
    setFilmError("");
    setFilmDraft(structuredClone(films[place]));
    setFilmEdit(place);
  }
  function saveFilm() {
    if (!filmEdit) return;
    if (
      !filmDraft.eyebrow.trim() ||
      !filmDraft.title.trim() ||
      !filmDraft.description.trim() ||
      !filmDraft.buttonLabel.trim()
    ) {
      setFilmError("Add the eyebrow, headline, introduction, and button.");
      return;
    }
    const place = filmEdit;
    update((c) => {
      c.films = {
        home: films.home,
        about: films.about,
        [place]: filmDraft,
      };
    });
    setFilmEdit(null);
  }
  return (
    <>
      <div className="tabs centered" aria-label="Website">
        {[...storefrontTabs, "Media library", "Journal", "Promotions"].map((item) => {
          const active =
            (section === "media" && item === "Media library") ||
            (section === "journal" && item === "Journal") ||
            (section === "promotions" && item === "Promotions") ||
            (section === "website" && item === storefrontTab);
          return (
            <button
              key={item}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (item === "Media library") onSection?.("media");
                else if (item === "Journal") onSection?.("journal");
                else if (item === "Promotions") onSection?.("promotions");
                else {
                  setTab(item);
                  if (section !== "website") onSection?.("website");
                }
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
      {section === "media" ? (
        <MediaLibrary />
      ) : section === "journal" ? (
        <JournalEditor />
      ) : section === "promotions" ? (
        <Promotions />
      ) : (
        <>
      <PageHeading
        eyebrow="THE STOREFRONT"
        title="Set the scene."
        description="Shape the first impression, and every moment that follows."
        action={
          storefrontTab === "Home hero" ? (
            <button
              className="button"
              disabled={h.slides.length >= 12}
              onClick={() => setAdding(true)}
            >
              <Plus size={15} /> Add slide
            </button>
          ) : undefined
        }
      />
      {storefrontTab === "Home hero" ? (
        <>
        <div className="editor-layout">
          <section className="panel form-panel">
            <div className="section-label">
              <Image size={16} /> THE OPENING CHAPTER
            </div>
            <Field label="Eyebrow">
              <input
                value={h.eyebrow}
                onChange={(e) =>
                  update((c) => {
                    c.hero.eyebrow = e.target.value;
                  })
                }
              />
            </Field>
            <Field
              label="Headline"
              hint="Use a new line to control the editorial line break."
            >
              <textarea
                rows={3}
                value={h.title}
                onChange={(e) =>
                  update((c) => {
                    c.hero.title = e.target.value;
                  })
                }
              />
            </Field>
            <Field label="Introduction">
              <textarea
                rows={3}
                value={h.description}
                onChange={(e) =>
                  update((c) => {
                    c.hero.description = e.target.value;
                  })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Button text">
                <input
                  value={h.buttonLabel}
                  onChange={(e) =>
                    update((c) => {
                      c.hero.buttonLabel = e.target.value;
                    })
                  }
                />
              </Field>
              <Field label="Button destination">
                <DestinationPicker
                  value={h.buttonHref}
                  onChange={(value) =>
                    update((c) => {
                      c.hero.buttonHref = value;
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Image caption">
              <input
                value={h.caption}
                onChange={(e) =>
                  update((c) => {
                    c.hero.caption = e.target.value;
                  })
                }
              />
            </Field>
            <Field
              label="Rotate slides every (seconds)"
              hint="Multiple slides rotate automatically. Visitors can also choose a slide."
            >
              <input
                type="number"
                min="4"
                max="30"
                value={h.interval}
                onChange={(e) =>
                  update((c) => {
                    c.hero.interval = Number(e.target.value);
                  })
                }
              />
            </Field>
          </section>
          <section>
            <div className="section-top">
              <h2>
                Hero sequence <span className="count">{h.slides.length}</span>
              </h2>
            </div>
            <div className="slides">
              {h.slides.map((slide, index) => (
                <div className="panel slide" key={slide.id}>
                  <Thumb
                    src={slide.src}
                    video={slide.type === "video"}
                    alt={slide.alt}
                  />
                  <div className="slide-details">
                    <span className="eyebrow">
                      SLIDE {String(index + 1).padStart(2, "0")} · {slide.type}
                    </span>
                    <MediaField
                      label="Source"
                      value={slide.src}
                      kind="any"
                      onChange={(m) =>
                        update((c) => {
                          c.hero.slides[index] = {
                            ...slide,
                            src: m.url,
                            type: m.type,
                            alt: m.alt,
                          };
                        })
                      }
                    />
                    <Field label="Description for accessibility">
                      <input
                        value={slide.alt}
                        onChange={(e) =>
                          update((c) => {
                            c.hero.slides[index].alt = e.target.value;
                          })
                        }
                      />
                    </Field>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        disabled={!index}
                        aria-label={`Move slide ${index + 1} up`}
                        onClick={() =>
                          update((c) => {
                            [c.hero.slides[index - 1], c.hero.slides[index]] = [
                              c.hero.slides[index],
                              c.hero.slides[index - 1],
                            ];
                          })
                        }
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={index === h.slides.length - 1}
                        aria-label={`Move slide ${index + 1} down`}
                        onClick={() =>
                          update((c) => {
                            [c.hero.slides[index + 1], c.hero.slides[index]] = [
                              c.hero.slides[index],
                              c.hero.slides[index + 1],
                            ];
                          })
                        }
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        disabled={h.slides.length === 1}
                        aria-label={`Remove slide ${index + 1}`}
                        onClick={() => setRemove(slide.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        </>
      ) : (
        <>
        <div className="toolbar">
          <div className="tabs compact">
            {imageryPages.map((group) => (
              <button
                className={imageryPage === group.page ? "active" : ""}
                onClick={() => setImageryPage(group.page)}
                key={group.page}
              >
                {group.page}
              </button>
            ))}
          </div>
        </div>
        {(imageryPage === "Home" || imageryPage === "Our world") && (
        <div className="collection-cards film-wording">
          {imageryPage === "Home" && (
          <section className="panel collection-tile">
            {editorialPhoto && (
              <Thumb src={editorialPhoto.src} alt={editorialPhoto.alt} />
            )}
            <div>
              <span className="eyebrow">HOMEPAGE EDITORIAL</span>
              <h2>{editorial.title.replace(/\n/g, " ")}</h2>
              <p>{editorial.description}</p>
              <button className="button secondary" onClick={openEditorial}>
                Edit wording <ArrowUpRight size={15} />
              </button>
            </div>
          </section>
          )}
          {(
            [
              ["home", "Home", films.home],
              ["about", "Our world", films.about],
            ] as const
          )
            .filter(([, page]) => page === imageryPage)
            .map(([place, page, copy]) => (
            <section className="panel collection-tile" key={place}>
              {covers[place] && (
                <Thumb src={covers[place].src} alt={covers[place].alt} />
              )}
              <div>
                <span className="eyebrow">ATELIER FILM · {page}</span>
                <h2>{copy.title.replace(/\*/g, "").replace(/\n/g, " ")}</h2>
                <p>{copy.description}</p>
                <button className="button secondary" onClick={() => openFilm(place)}>
                  Edit wording <ArrowUpRight size={15} />
                </button>
              </div>
            </section>
          ))}
        </div>
        )}
        <div className="placement-groups">
          {imageryPages.filter((group) => group.page === imageryPage).map((group) => {
            const cards = imageryGuide.filter((item) => item.page === group.page);
            return (
              <section key={group.page}>
                <div className="placement-page">
                  <h2>{group.page}</h2>
                  <p>{group.note}</p>
                </div>
                <div className="placements">
                  {cards.map((item) => {
                    const slot = placementMedia(content.slots, item.id);
                    if (!slot) return null;
                    const video = videoPlacements.has(item.id);
                    return (
                      <section key={item.id} className="panel placement">
                        <Thumb
                          src={slot.src}
                          video={video}
                          alt={slot.alt}
                        />
                        <div>
                          <div className="placement-pages">
                            {item.pages.map((page) => (
                              <span className="page-chip" key={page}>
                                {page}
                              </span>
                            ))}
                          </div>
                          <h2>{item.title}</h2>
                          <p className="placement-spot">{item.where}</p>
                          <MediaField
                            label="Media"
                            value={slot.src}
                            kind={video ? "video" : "image"}
                            onChange={(m) =>
                              update((c) => {
                                ensureSlot(c, item.id);
                                const current = c.slots.find((entry) => entry.id === item.id);
                                if (!current) return;
                                current.src = m.url;
                                current.alt = m.alt;
                              })
                            }
                          />
                          <Field label="Alternative text">
                            <input
                              value={slot.alt}
                              onChange={(e) =>
                                update((c) => {
                                  ensureSlot(c, item.id);
                                  const current = c.slots.find((entry) => entry.id === item.id);
                                  if (!current) return;
                                  current.alt = e.target.value;
                                })
                              }
                            />
                          </Field>
                        </div>
                      </section>
                    );
                  })}
                </div>
                {group.page === "Home" && (
                  <>
                    <div className="placement-page placement-subsection">
                      <h3>Category cards — A world of possibilities</h3>
                      <p>
                        The four cards on the home page. Each has a caption, a
                        photograph, and a hover photograph.
                      </p>
                    </div>
                    <div className="placements">
                      {content.categoryCards.map((card, index) => (
                        <section key={card.id} className="panel placement">
                          <Thumb src={card.image} alt={card.title} />
                          <div>
                            <div className="placement-pages">
                              <span className="page-chip">Home</span>
                            </div>
                            <h2>{card.title}</h2>
                            <Field label="Caption">
                              <input
                                value={card.subtitle}
                                onChange={(e) =>
                                  update((c) => {
                                    c.categoryCards[index].subtitle =
                                      e.target.value;
                                  })
                                }
                              />
                            </Field>
                            <MediaField
                              label="Photograph"
                              value={card.image}
                              onChange={(m) =>
                                update((c) => {
                                  c.categoryCards[index].image = m.url;
                                })
                              }
                            />
                            <MediaField
                              label="Hover photograph"
                              value={card.hover}
                              onChange={(m) =>
                                update((c) => {
                                  c.categoryCards[index].hover = m.url;
                                })
                              }
                            />
                          </div>
                        </section>
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
        </>
      )}
        </>
      )}
      {editorialOpen && (
        <Modal title="Homepage editorial" onClose={() => setEditorialOpen(false)}>
          <Field label="Eyebrow">
            <input
              value={editorialDraft.eyebrow}
              onChange={(e) => {
                setEditorialError("");
                setEditorialDraft((current) => ({ ...current, eyebrow: e.target.value }));
              }}
            />
          </Field>
          <Field
            label="Headline"
            hint="The first line stays upright. Each following line is italic."
          >
            <textarea
              rows={3}
              value={editorialDraft.title}
              onChange={(e) => {
                setEditorialError("");
                setEditorialDraft((current) => ({ ...current, title: e.target.value }));
              }}
            />
          </Field>
          <Field label="Introduction">
            <textarea
              rows={4}
              value={editorialDraft.description}
              onChange={(e) => {
                setEditorialError("");
                setEditorialDraft((current) => ({ ...current, description: e.target.value }));
              }}
            />
          </Field>
          <div className="form-grid">
            <Field label="Button text">
              <input
                value={editorialDraft.buttonLabel}
                onChange={(e) => {
                  setEditorialError("");
                  setEditorialDraft((current) => ({ ...current, buttonLabel: e.target.value }));
                }}
              />
            </Field>
            <Field label="Button destination">
              <DestinationPicker
                value={editorialDraft.buttonHref}
                onChange={(value) => {
                  setEditorialError("");
                  setEditorialDraft((current) => ({ ...current, buttonHref: value }));
                }}
              />
            </Field>
          </div>
          <Field label="Words on the photograph">
            <input
              value={editorialDraft.caption}
              onChange={(e) =>
                setEditorialDraft((current) => ({ ...current, caption: e.target.value }))
              }
            />
          </Field>
          <Field label="Corner mark">
            <input
              value={editorialDraft.mark}
              onChange={(e) =>
                setEditorialDraft((current) => ({ ...current, mark: e.target.value }))
              }
            />
          </Field>
          <p className="muted">The photograph beside this piece is chosen on this page.</p>
          {editorialError && (
            <p className="error" role="alert">
              {editorialError}
            </p>
          )}
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setEditorialOpen(false)}>
              Cancel
            </button>
            <button className="button" onClick={saveEditorial}>
              Apply to draft
            </button>
          </div>
        </Modal>
      )}
      {filmEdit && (
        <Modal
          title={filmEdit === "home" ? "Atelier film on Home" : "Atelier film on Our world"}
          onClose={() => setFilmEdit(null)}
        >
          <FilmFields
            value={filmDraft}
            onChange={(patch) => {
              setFilmError("");
              setFilmDraft((current) => ({ ...current, ...patch }));
            }}
          />
          {filmError && (
            <p className="error" role="alert">
              {filmError}
            </p>
          )}
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setFilmEdit(null)}>
              Cancel
            </button>
            <button className="button" onClick={saveFilm}>
              Apply to draft
            </button>
          </div>
        </Modal>
      )}
      {adding && (
        <MediaPicker
          onClose={() => setAdding(false)}
          onSelect={(m) =>
            update((c) => {
              c.hero.slides.push({
                id: crypto.randomUUID(),
                src: m.url,
                alt: m.alt,
                type: m.type,
              });
            })
          }
        />
      )}
      {remove && (
        <Modal title="Remove this slide?" onClose={() => setRemove(null)}>
          <p>The file will stay in your media library.</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setRemove(null)}
            >
              Keep slide
            </button>
            <button
              className="button"
              onClick={() => {
                update((c) => {
                  c.hero.slides = c.hero.slides.filter((s) => s.id !== remove);
                });
                setRemove(null);
              }}
            >
              Remove slide
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
