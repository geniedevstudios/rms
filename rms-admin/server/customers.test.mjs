import assert from "node:assert/strict";
import test from "node:test";
import { acceptCustomer, cleanCart } from "./customers.mjs";
import { verificationMessage } from "./notifications/templates.mjs";
import { HttpError } from "./content-store.mjs";

test("a shop account needs a name, email, and a password of at least 8 characters", () => {
  const person = acceptCustomer({
    givenName: "Ada",
    familyName: "Mensah",
    email: "Ada@Example.com",
    password: "long-enough",
  });
  assert.equal(person.email, "ada@example.com");
  assert.throws(
    () => acceptCustomer({ givenName: "Ada", familyName: "Mensah", email: "ada@example.com", password: "short" }),
    (error) => error instanceof HttpError && error.status === 400,
  );
});

test("a saved bag keeps only the fields the shop sent", () => {
  const items = cleanCart([
    { productId: "dress", size: "M", quantity: 1, colourwayId: "sand", color: "Sand", image: "/media/image/dress.jpg", extra: "no" },
  ]);
  assert.deepEqual(items, [
    { productId: "dress", size: "M", quantity: 1, colourwayId: "sand", color: "Sand", image: "/media/image/dress.jpg" },
  ]);
});

test("the verification letter uses the shared RMS email design and shows the code", () => {
  const message = verificationMessage({
    name: "Ada",
    code: "048213",
    storefrontUrl: "https://rivermindstyle.com",
  });
  assert.match(message.subject, /verification code/);
  assert.match(message.text, /048213/);
  assert.match(message.html, /cid:invitation-hero/);
  assert.match(message.html, /YOUR RMS/);
  assert.match(message.html, /048213/);
  assert.match(message.html, /Rooted in identity/);
  assert.equal(message.html.includes("<script"), false);
});
