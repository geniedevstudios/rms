import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Image } from "lucide-react";
import { useContent } from "../../app/content.context";
import { PageHeading, Field, Thumb, Modal } from "../../components/ui";
import { DestinationPicker } from "../../components/destination-picker";
import { MediaPicker, MediaField } from "../media/media-picker";
import { MediaLibrary } from "../media/media";
import { JournalEditor } from "../journal/journal";
import { Promotions } from "../promotions/promotions";

const storefrontTabs = ["Home hero", "Page imagery"];

const imageryGuide = [
  {
    id: "home-editorial",
    title: "Editorial photograph",
    page: "Home",
    pages: ["Home"],
    where: "Beside “Soft in form. Strong in spirit.”",
  },
  {
    id: "atelier-film",
    title: "Atelier film",
    page: "Home",
    pages: ["Home", "Our world"],
    where:
      "Plays from “It begins with intention.” on Home, and from “Thoughtful by nature.” on Our world.",
  },
  {
    id: "atelier-poster",
    title: "Film cover",
    page: "Home",
    pages: ["Home", "Our world"],
    where: "The still shown before that film plays, on Home and on Our world.",
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
    note: "These appear on Our world. The atelier film from Home also plays here.",
  },
  { page: "Custom", note: "These appear on the Custom page." },
];

export function Website({
  section = "website",
  onSection,
}: {
  section?: "website" | "media" | "journal" | "promotions";
  onSection?: (section: "website" | "media" | "journal" | "promotions") => void;
}) {
  const { content, update } = useContent();
  const [tab, setTab] = useState("Home hero");
  const storefrontTab = tab === "Home hero" ? "Home hero" : "Page imagery";
  const [adding, setAdding] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const h = content.hero;
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
      ) : (
        <div className="placement-groups">
          {imageryPages.map((group) => {
            const cards = imageryGuide.filter((item) => item.page === group.page);
            return (
              <section key={group.page}>
                <div className="placement-page">
                  <h2>{group.page}</h2>
                  <p>{group.note}</p>
                </div>
                <div className="placements">
                  {cards.map((item) => {
                    const index = content.slots.findIndex(
                      (slot) => slot.id === item.id,
                    );
                    const slot = content.slots[index];
                    if (!slot) return null;
                    return (
                      <section key={slot.id} className="panel placement">
                        <Thumb
                          src={slot.src}
                          video={slot.id === "atelier-film"}
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
                            kind={slot.id === "atelier-film" ? "video" : "image"}
                            onChange={(m) =>
                              update((c) => {
                                c.slots[index].src = m.url;
                                c.slots[index].alt = m.alt;
                              })
                            }
                          />
                          <Field label="Alternative text">
                            <input
                              value={slot.alt}
                              onChange={(e) =>
                                update((c) => {
                                  c.slots[index].alt = e.target.value;
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
      )}
    </>
  );
}
