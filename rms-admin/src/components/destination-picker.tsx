import { useContent } from "../app/content.context";
import { SelectMenu } from "./select-menu/select-menu";

/** Shared storefront destinations, resolved from the current content draft. */
export function DestinationPicker({ value, onChange, label = "Button destination" }: {
  value: string; onChange: (value: string) => void; label?: string;
}) {
  const { content } = useContent();
  const options = [
    { value: "/", label: "Home" },
    { value: "/shop", label: "Shop · All pieces" },
    { value: "/shop?edit=new", label: "Shop · New arrivals" },
    ...["Pants", "Tops", "Two piece", "Skirts"].map((category) => ({
      value: `/shop?category=${encodeURIComponent(category)}`,
      label: `Shop · ${category}`,
    })),
    { value: "/collection", label: "All collections" },
    { value: "/custom", label: "Made to order" },
    { value: "/about", label: "Our world" },
    { value: "/journal", label: "Journal · All stories" },
    ...content.collections.filter(c => c.status === "published").map(c => ({ value: `/collection/${c.id}`, label: `Collection · ${c.label}` })),
    ...content.products.filter(p => p.status === "active").map(p => ({ value: `/product/${p.id}`, label: `Product · ${p.name}` })),
    ...content.customDesigns.filter(p => p.status === "active").map(p => ({ value: `/custom/${p.id}`, label: `Made to order · ${p.name}` })),
    ...content.journals.filter(j => j.status === "published").map(j => ({ value: `/journal/${j.id}`, label: `Story · ${j.title}` })),
  ];
  if (!options.some(option => option.value === value))
    options.unshift({ value, label: "Previous destination · Choose a page" });
  return <SelectMenu label={label} value={value} options={options} onChange={onChange} />;
}
