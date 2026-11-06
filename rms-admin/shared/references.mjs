export function references(content) {
  const refs = [];
  const add = (url, label) => {
    if (url) refs.push({ url, label });
  };
  content.hero.slides.forEach((s) => add(s.src, "Home hero"));
  content.slots.forEach((s) => add(s.src, s.label));
  content.categoryCards.forEach((s) => {
    add(s.image, s.title + " category");
    add(s.hover, s.title + " hover");
  });
  [...content.products, ...content.customDesigns].forEach((p) => {
    add(p.image, p.name);
    add(p.hoverImage, p.name + " hover");
    (Array.isArray(p.gallery) ? p.gallery : []).forEach((url, index) =>
      add(url, p.name + " photograph " + (index + 3)),
    );
    (Array.isArray(p.colourways) ? p.colourways : []).forEach((way) => {
      const colour = way.color ? ` ${way.color}` : "";
      add(way.image, p.name + colour);
      add(way.hoverImage, p.name + colour + " hover");
      (Array.isArray(way.gallery) ? way.gallery : []).forEach((url, index) =>
        add(url, p.name + colour + " photograph " + (index + 3)),
      );
    });
  });
  content.collections.forEach((c) => add(c.image, c.label));
  content.journals.forEach((j) => {
    add(j.image, j.title);
    add(j.hover, j.title + " hover");
  });
  add(content.promotions?.banner?.image, "Announcement banner");
  add(content.promotions?.popup?.image, "Promotional popup");
  return refs;
}
