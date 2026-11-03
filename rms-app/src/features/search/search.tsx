import "./search.styles.css";
import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { searchProducts } from "../products/product-selectors";
import { Link } from "../../routing/link";
import { productPath } from "../../routing/navigation";
import { money } from "../../lib/format-currency";
export function SearchPanel() {
  const [query, setQuery] = useState("");
  const results = searchProducts(query);
  return (
    <div className="search-panel">
      <label className="search-input">
        <Search size={18} />
        <input
          autoFocus
          type="search"
          placeholder="Search pants, tops, skirts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
      </label>
      <span className="eyebrow">
        {query ? "YOUR RESULTS" : "A FEW PIECES TO DISCOVER"}
      </span>
      <div className="search-results">
        {results.map((p) => (
          <Link key={p.id} to={productPath(p.id)} className="search-result">
            <img src={p.image} alt={p.name} />
            <div>
              <h3>{p.name}</h3>
              <p>{p.color}</p>
              <span>{money(p.price)}</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>
        ))}
        {results.length === 0 && (
          <p className="no-results">
            No pieces found. Try “skirt”, “sand” or “top”.
          </p>
        )}
      </div>
    </div>
  );
}
