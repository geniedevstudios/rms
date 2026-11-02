import "../../components/editorial/editorial.styles.css";
import "./collection.styles.css";
import { ArrowDown } from "lucide-react";
import { collections } from "../../data/collections";
import { products } from "../../data/products";
import { ProductCard } from "../../features/products/product-card/product-card";

export function Collection() {
  return (
    <>
      {collections.map((collection) => {
        const pieces = collection.productIds.flatMap((id) => {
          const product = products.find((item) => item.id === id);
          return product ? [product] : [];
        });
        return (
          <div key={collection.id}>
            <section className="collection-hero">
              <img src={collection.image} alt={collection.imageAlt} />
              <div>
                <span className="eyebrow">{collection.label}</span>
                <h1>
                  {collection.title.map((line, index) => (
                    <span key={line.text}>
                      {index > 0 && <br />}
                      {line.emphasis ? <em>{line.text}</em> : line.text}
                    </span>
                  ))}
                </h1>
                <p>
                  {collection.description.map((line, index) => (
                    <span key={line}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
                <a
                  href={`#${collection.id}-pieces`}
                  className="text-link"
                  onClick={(event) => {
                    event.preventDefault();
                    document
                      .getElementById(`${collection.id}-pieces`)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Explore the collection <ArrowDown size={15} />
                </a>
              </div>
            </section>
            {collection.statement && (
              <section className="manifesto">
                <span className="eyebrow">{collection.statement.eyebrow}</span>
                <h2>
                  {collection.statement.lines.map((line, index) => (
                    <span key={`${line.text}-${index}`}>
                      {index === 1 && <br />}
                      {line.emphasis ? <em>{line.text}</em> : line.text}
                    </span>
                  ))}
                </h2>
              </section>
            )}
            <section id={`${collection.id}-pieces`} className="section">
              <div className="product-grid">
                {pieces.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </div>
        );
      })}
    </>
  );
}
