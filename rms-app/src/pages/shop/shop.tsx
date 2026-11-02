import { filterProducts } from "../../features/products/product-selectors";
import "./shop.styles.css";
import { useState } from "react";
import { products } from "../../data/products";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "../../features/products/product-card/product-card";
import { SelectMenu } from "../../components/select-menu/select-menu";

const colours = [
  "All colours",
  ...new Set(products.map((product) => product.color)),
];
export function Shop({
  category: initialCategory,
  newEdit,
}: {
  category: string;
  newEdit: boolean;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [color, setColor] = useState("All colours");
  const [maxPrice, setMaxPrice] = useState("all");
  const list = filterProducts({ category, color, maxPrice, newEdit, sort });
  return (
    <section className="shop-page section">
      <div className="page-intro">
        <span className="eyebrow">THE RIVERMINDSTYLE WARDROBE</span>
        <h1>
          {newEdit
            ? "A new expression."
            : initialCategory === "All pieces"
              ? "Pieces to become you."
              : initialCategory}
        </h1>
        <p>
          Thoughtful forms. Effortless presence. Discover your next chapter.
        </p>
      </div>
      <div className="shop-toolbar">
        <div className="category-tabs" aria-label="Product categories">
          {["All pieces", "Dresses", "Tailoring", "Outerwear"].map((value) => (
            <button
              key={value}
              aria-pressed={category === value}
              className={category === value ? "selected" : ""}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="filter-controls">
          <button
            aria-expanded={showFilters}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={14} /> Filters
            {(color !== "All colours" || maxPrice !== "all") && (
              <span className="filter-dot" />
            )}
          </button>
          <SelectMenu
            variant="toolbar"
            label="Sort products"
            value={sort}
            onChange={setSort}
            options={[
              { value: "featured", label: "Featured" },
              { value: "low", label: "Price: low to high" },
              { value: "high", label: "Price: high to low" },
            ]}
          />
        </div>
      </div>
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-field">
            <span>Colour</span>
            <SelectMenu
              variant="filter"
              label="Colour"
              value={color}
              onChange={setColor}
              options={colours.map((value) => ({ value, label: value }))}
            />
          </div>
          <div className="filter-field">
            <span>Price</span>
            <SelectMenu
              variant="filter"
              label="Price"
              value={maxPrice}
              onChange={setMaxPrice}
              options={[
                { value: "all", label: "All prices" },
                { value: "1600", label: "Up to GH₵ 1,600" },
                { value: "2000", label: "Up to GH₵ 2,000" },
              ]}
            />
          </div>
          <button
            className="text-link"
            onClick={() => {
              setCategory("All pieces");
              setColor("All colours");
              setMaxPrice("all");
            }}
          >
            Clear filters <X size={13} />
          </button>
        </div>
      )}
      <div className="results-count">
        {list.length} considered {list.length === 1 ? "piece" : "pieces"}
      </div>
      {list.length ? (
        <div className="product-grid shop-grid">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-page">
          <h2>A different combination?</h2>
          <p>No pieces match these filters.</p>
          <button
            className="button outline"
            onClick={() => {
              setCategory("All pieces");
              setColor("All colours");
              setMaxPrice("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
