import { Wishlist } from "../../features/wishlist/wishlist";

export function SavedPage() {
  return (
    <section className="section saved-page">
      <div className="page-intro">
        <span className="eyebrow">YOUR RMS</span>
        <h1>Saved pieces</h1>
        <p>The pieces you kept for another moment.</p>
      </div>
      <Wishlist />
    </section>
  );
}
