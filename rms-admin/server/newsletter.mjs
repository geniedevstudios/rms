import { HttpError } from "./content-store.mjs";
import { normalizeEmail, validEmail } from "./admins.mjs";

export function createNewsletter(client) {
  if (!client) return null;
  return {
    async join(emailValue) {
      const email = normalizeEmail(emailValue);
      if (!validEmail(email)) throw new HttpError(400, "Add a valid email address.");
      const { error } = await client.from("newsletter").insert({ email });
      if (error && error.code !== "23505") {
        const failure = new HttpError(
          502,
          "The list could not be updated. " + String(error.message || "Try again.").slice(0, 140),
        );
        throw failure;
      }
      return { ok: true };
    },
  };
}
