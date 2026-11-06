import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { availableSizes, isSizeAvailable } from "../shared/product-sizes.mjs";
import { createContentStore } from "./content-store.mjs";
import { quoteCheckout } from "./promotions.mjs";

test("existing products default to the chart; explicit size selections and sold-out states are respected", () => {
  assert.deepEqual(availableSizes({}), ["S", "M", "L", "XL"]);
  assert.equal(isSizeAvailable({ availableSizes: ["S", "L"] }, "M"), false);
  assert.equal(isSizeAvailable({ availableSizes: ["S", "L"] }, "L"), true);
  assert.equal(isSizeAvailable({ availableSizes: [] }, "S"), false);
  assert.equal(isSizeAvailable({}, "XS"), false);
  assert.equal(isSizeAvailable({ availableSizes: ["S"], stock: [{ size: "S", left: 2 }] }, "S"), true);
  assert.equal(isSizeAvailable({ availableSizes: ["S"], stock: [{ size: "S", left: 0 }] }, "S"), false);
});

test("size changes are validated, saved and published for ready-to-wear and custom pieces", async t => {
  const directory = await mkdtemp(join(tmpdir(), "rms-sizes-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createContentStore(directory);
  let state = await store.read();
  const draft = structuredClone(state.draft);
  draft.products[0].availableSizes = ["S", "XL"];
  draft.products[0].stock = [
    { size: "XL", made: 3, left: 2 },
    { size: "S", made: 4, left: 4 },
  ];
  draft.customDesigns[0].availableSizes = [];
  state = await store.save(draft, state.revision);
  assert.equal(state.published.products[0].availableSizes, undefined);
  state = await store.publish(state.revision);
  assert.deepEqual(state.published.products[0].availableSizes, ["S", "XL"]);
  assert.deepEqual(state.published.products[0].stock, [
    { size: "S", made: 4, left: 4 },
    { size: "XL", made: 3, left: 2 },
  ]);
  assert.deepEqual(state.published.customDesigns[0].availableSizes, []);
  const missing = structuredClone(state.draft);
  delete missing.products[0].stock;
  await assert.rejects(store.save(missing, state.revision), { status: 400 });
  for (const invalid of [["XXL"], ["S", "S"], "S"]) {
    const bad = structuredClone(state.draft);
    bad.products[0].availableSizes = invalid;
    await assert.rejects(store.save(bad, state.revision), { status: 400 });
  }
});

test("checkout rejects disabled sizes even when a stale or modified client submits them", () => {
  const piece = { id: "dress", name: "Dress", price: 100, status: "active", image: "", availableSizes: ["S"] };
  const catalog = { products: [piece], customDesigns: [] };
  const body = { items: [{ productId: "dress", size: "M", quantity: 1 }] };
  assert.throws(() => quoteCheckout(catalog, body), /no longer available/);
  body.items[0].size = "S";
  assert.equal(quoteCheckout(catalog, body).total, 100);
  piece.availableSizes = [];
  assert.throws(() => quoteCheckout(catalog, body), /no longer available/);
  piece.availableSizes = ["S"];
  piece.stock = [{ size: "S", made: 2, left: 1 }];
  body.items[0].quantity = 2;
  assert.throws(() => quoteCheckout(catalog, body), /Only 1 left/);
  body.items[0].quantity = 1;
  assert.equal(quoteCheckout(catalog, body).total, 100);
  piece.availableSizes = [];
  catalog.products = []; catalog.customDesigns = [piece];
  assert.throws(() => quoteCheckout(catalog, body), /no longer available/);
});

test("a paid order reduces what is left once, in the draft and on the storefront", async t => {
  const directory = await mkdtemp(join(tmpdir(), "rms-stock-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createContentStore(directory);
  let state = await store.read();
  const draft = structuredClone(state.draft);
  const piece = draft.products[0];
  piece.availableSizes = ["M"];
  piece.stock = [{ size: "M", made: 5, left: 4 }];
  state = await store.publish((await store.save(draft, state.revision)).revision);
  const sale = [{ productId: piece.id, size: "M", quantity: 2 }];
  await store.takeStock("RMS-STOCKTEST1", sale);
  await store.takeStock("RMS-STOCKTEST1", sale);
  const after = await store.read();
  assert.equal(after.draft.products[0].stock[0].left, 2);
  assert.equal(after.published.products[0].stock[0].left, 2);
  assert.equal(after.draft.products[0].stock[0].made, 5);
});

test("a sale reduces only the colour that was bought", async t => {
  const directory = await mkdtemp(join(tmpdir(), "rms-colour-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createContentStore(directory);
  let state = await store.read();
  const draft = structuredClone(state.draft);
  const piece = draft.products[0];
  piece.colourways = [
    { id: "onyx", color: "Onyx", swatch: "#282726", image: piece.image, availableSizes: ["M"], stock: [{ size: "M", made: 4, left: 4 }] },
    { id: "sand", color: "Sand", swatch: "#d7c4a3", image: piece.image, availableSizes: ["M"], stock: [{ size: "M", made: 2, left: 2 }] },
  ];
  state = await store.publish((await store.save(draft, state.revision)).revision);
  await store.takeStock("RMS-SAND1", [{ productId: piece.id, colourwayId: "sand", size: "M", quantity: 1 }]);
  const after = await store.read();
  const ways = after.published.products[0].colourways;
  assert.equal(ways.find((way) => way.id === "sand").stock[0].left, 1);
  assert.equal(ways.find((way) => way.id === "onyx").stock[0].left, 4);
  assert.equal(after.published.products[0].stock[0].left, 4);
  assert.throws(
    () => quoteCheckout(after.published, { items: [{ productId: piece.id, colourwayId: "sand", size: "M", quantity: 2 }] }),
    /Only 1 left/,
  );
  const quote = quoteCheckout(after.published, { items: [{ productId: piece.id, colourwayId: "sand", size: "M", quantity: 1 }] });
  assert.equal(quote.items[0].color, "Sand");
  assert.equal(quote.items[0].colourwayId, "sand");
});
