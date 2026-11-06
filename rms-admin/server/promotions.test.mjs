import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { quoteCheckout, validatePromotions } from "./promotions.mjs";
import { publicContent, references, createContentStore } from "./content-store.mjs";
import { createNotifications } from "./notifications/service.mjs";
import { createOrderStore } from "./orders.mjs";
import { notificationMessage } from "./notifications/templates.mjs";

const ad = { enabled: false, title: "", message: "", buttonLabel: "", buttonHref: "/shop", image: "", imageAlt: "" };
const code = { code: "WELCOME10", type: "percentage", value: 10, minimumSpend: 0, expiresOn: "", active: true };
const content = () => ({
  products: [{ id: "dress", name: "Dress", price: 100.05, image: "/dress.jpg", status: "active" }],
  customDesigns: [], collections: [], journals: [], slots: [], categoryCards: [], hero: { slides: [] },
  promotions: { codes: [{ ...code }], banner: { ...ad }, popup: { ...ad } },
});
const bag = { items: [{ productId: "dress", size: "M", quantity: 1 }], promoCode: " welcome10 " };
const now = Date.parse("2026-11-05T12:00:00Z");

test("discounts use server prices and round to pesewas, with one case-insensitive code", () => {
  const quote = quoteCheckout(content(), { ...bag, total: 1, discount: 99, items: [{ ...bag.items[0], price: 1 }] }, now);
  assert.equal(quote.subtotal, 100.05);
  assert.equal(quote.discount, 10.01);
  assert.equal(quote.total, 90.04);
  assert.equal(quote.promoCode, "WELCOME10");
  const c = content(); c.promotions.codes[0] = { ...code, type: "fixed", value: 15.25 };
  assert.equal(quoteCheckout(c, bag, now).total, 84.8);
});

test("inactive, deleted, expired, under-minimum and zero-total offers cannot be applied", () => {
  for (const promo of [{ ...code, active: false }, { ...code, expiresOn: "2026-11-04" }, { ...code, minimumSpend: 101 }, { ...code, type: "fixed", value: 200 }]) {
    const c = content(); c.promotions.codes = [promo];
    assert.throws(() => quoteCheckout(c, bag, now), { status: 400 });
  }
  const c = content(); c.promotions.codes = [];
  assert.throws(() => quoteCheckout(c, bag, now), { status: 400 });
  c.promotions.codes = [{ ...code, expiresOn: "2026-11-05" }];
  assert.equal(quoteCheckout(c, bag, now).discount, 10.01);
  assert.throws(() => quoteCheckout(c, bag, Date.parse("2026-11-06T00:00:00Z")), { status: 400 });
});

test("public content hides the code list and advertisement images remain protected references", () => {
  const c = content(); c.promotions.popup.image = "/promo.jpg";
  const visible = publicContent(c);
  assert.deepEqual(visible.promotions.codes, []);
  assert.equal(c.promotions.codes.length, 1);
  assert.equal(references(c).some(ref => ref.url === "/promo.jpg"), true);
  validatePromotions(c.promotions, [{ url: "/promo.jpg", type: "image" }]);
  c.promotions.popup.buttonHref = "javascript:alert(1)";
  assert.throws(() => validatePromotions(c.promotions, []), { status: 400 });
});

test("draft promo changes take effect only after publish, including deactivation and deletion", async t => {
  const directory = await mkdtemp(join(tmpdir(), "rms-promo-publish-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createContentStore(directory);
  let state = await store.read();
  state.draft.promotions = content().promotions;
  state = await store.save(state.draft, state.revision);
  assert.equal(state.published.promotions, undefined);
  state = await store.publish(state.revision);
  assert.equal(state.published.promotions.codes[0].active, true);
  state.draft.promotions.codes[0].active = false;
  state = await store.save(state.draft, state.revision);
  assert.equal(state.published.promotions.codes[0].active, true);
  state = await store.publish(state.revision);
  assert.equal(state.published.promotions.codes[0].active, false);
  state.draft.promotions.codes = [];
  state = await store.save(state.draft, state.revision);
  state = await store.publish(state.revision);
  assert.deepEqual(state.published.promotions.codes, []);
});

test("discounted payment, verification, saved order and receipt use the same frozen amount", async t => {
  const directory = await mkdtemp(join(tmpdir(), "rms-promo-payment-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const published = content();
  const orderBook = createOrderStore(directory);
  let charged = 0, paidAmount = 9004, initializations = 0;
  const service = createNotifications({ directory, config: { enabled: false, paystackSecret: "fake" }, contentStore: { read: async () => ({ published }) }, orderBook, now: () => now,
    fetchImpl: async (url, options) => {
      if (url.endsWith("/initialize")) {
        initializations++; charged = Number(JSON.parse(options.body).amount);
        return { ok: true, json: async () => ({ status: true, data: { access_code: "fake-access" } }) };
      }
      return { ok: true, json: async () => ({ status: true, data: { status: "success", currency: "GHS", amount: paidAmount, customer: { email: "shopper@example.test" } } }) };
    },
  });
  const checkout = { ...bag, token: "a".repeat(64), reference: "RMS-PROMO1234567", email: "shopper@example.test", name: "Sample shopper", phone: "000000000", address: { street: "Sample street", city: "Accra", country: "Ghana" } };
  await service.checkout(checkout);
  await assert.rejects(service.initialize("b".repeat(64), checkout.reference), { status: 400 });
  await service.initialize(checkout.token, checkout.reference);
  await service.initialize(checkout.token, checkout.reference);
  assert.equal(charged, 9004); assert.equal(initializations, 1);
  published.promotions.codes = [];
  paidAmount = 1;
  await assert.rejects(service.complete(checkout.token, checkout.reference), { status: 402 });
  paidAmount = 9004;
  const saved = await service.complete(checkout.token, checkout.reference);
  await service.settled();
  assert.equal(saved.total, 90.04); assert.equal(saved.discount, 10.01); assert.equal(saved.promoCode, "WELCOME10");
  assert.equal((await orderBook.list())[0].total, 90.04);
  const message = notificationMessage("order", saved, "customer", { storefrontUrl: "https://example.test", adminUrl: "https://admin.example.test" });
  assert.match(message.text, /Discount \(WELCOME10\): −GH₵ 10.01/);
  assert.match(message.html, /90.04/);
  const data = JSON.parse(await readFile(join(directory, "notifications.json"), "utf8"));
  assert.equal(data.checkouts[0].references[0].order.total, 90.04);
});

test("deactivated offers cannot start a new payment from an old quote", async t => {
  const directory = await mkdtemp(join(tmpdir(), "rms-promo-expired-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const published = content();
  const service = createNotifications({ directory, config: { enabled: false, paystackSecret: "fake" }, contentStore: { read: async () => ({ published }) }, orderBook: createOrderStore(directory), now: () => now, fetchImpl: async () => { throw new Error("Must not contact payment provider"); } });
  const checkout = { ...bag, token: "a".repeat(64), email: "shopper@example.test", reference: "RMS-PROMO1234567" };
  await service.checkout(checkout);
  published.promotions.codes[0].active = false;
  await assert.rejects(service.initialize(checkout.token, checkout.reference), { status: 400 });
});
