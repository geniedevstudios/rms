import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { HttpError } from "./content-store.mjs";
import { hashPassword, normalizeEmail, validEmail, verifyPassword } from "./admins.mjs";
import { verificationMessage } from "./notifications/templates.mjs";

const codeLifetime = 15 * 60 * 1000;
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const dummyPassword =
  "00112233445566778899aabbccddeeff.00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

function clip(value, max) {
  const clean = typeof value === "string" ? value.trim() : "";
  return clean.length > max ? "" : clean;
}

function hashCode(code) {
  return createHash("sha256").update(String(code)).digest("hex");
}

function sameHash(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

function present(row) {
  return {
    email: row.email,
    givenName: row.given_name,
    familyName: row.family_name,
  };
}

function remoteError(error) {
  const failure = new HttpError(
    502,
    "Your RMS could not be saved. " + String(error?.message || "Try again.").slice(0, 140),
  );
  return failure;
}

export function acceptCustomer(body) {
  const givenName = clip(body?.givenName, 40);
  const familyName = clip(body?.familyName, 40);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!givenName || !familyName)
    throw new HttpError(400, "Add your first and last name.");
  if (!validEmail(email)) throw new HttpError(400, "Add a valid email address.");
  if (password.length < 8 || password.length > 128)
    throw new HttpError(400, "Use at least 8 characters.");
  return { givenName, familyName, email, password };
}

export function cleanCart(items) {
  if (!Array.isArray(items) || items.length > 30)
    throw new HttpError(400, "That bag could not be saved.");
  return items.map((item) => {
    const productId = clip(item?.productId, 80);
    const size = clip(item?.size, 20);
    const colourwayId = clip(item?.colourwayId, 80);
    const color = clip(item?.color, 40);
    const image = clip(item?.image, 500);
    const quantity = Number(item?.quantity);
    if (
      !productId ||
      !size ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    )
      throw new HttpError(400, "That bag could not be saved.");
    return {
      productId,
      size,
      quantity,
      ...(colourwayId ? { colourwayId } : {}),
      ...(color ? { color } : {}),
      ...(image ? { image } : {}),
    };
  });
}

export function createCustomerAccounts(client, mail) {
  if (!client) return null;
  const fetchImpl = mail?.fetchImpl || fetch;

  async function issueCode(email, name) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await client
      .from("customer_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if (countError) throw remoteError(countError);
    if ((count || 0) >= 5)
      throw new HttpError(429, "Too many codes. Try again in a little while.");
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const { error } = await client.from("customer_codes").insert({
      email,
      code_hash: hashCode(code),
      expires_at: new Date(Date.now() + codeLifetime).toISOString(),
    });
    if (error) throw remoteError(error);
    try {
      await deliverCode({ to: email, name, code });
    } catch (error) {
      await client.from("customer_codes").delete().eq("email", email).eq("code_hash", hashCode(code));
      throw error;
    }
  }

  async function deliverCode({ to, name, code }) {
    if (!mail?.apiKey)
      throw new HttpError(503, "Account email is not configured.");
    const message = verificationMessage({
      name,
      code,
      storefrontUrl: mail.storefrontUrl,
    });
    const hero = await readFile(
      new URL("./notifications/assets/invitation-hero.jpg", import.meta.url),
    );
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${mail.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mail.from || "RIVERMINDSTYLE <verification@rivermindstyle.com>",
        to: [to],
        reply_to: "verification@rivermindstyle.com",
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: [
          {
            filename: "invitation-hero.jpg",
            content: hero.toString("base64"),
            content_type: "image/jpeg",
            content_id: "invitation-hero",
          },
        ],
      }),
    });
    if (!response.ok)
      throw new HttpError(502, "The verification email could not be sent.");
  }

  async function openSession(customerId) {
    const token = randomBytes(32).toString("hex");
    const { error } = await client.from("customer_sessions").insert({
      token,
      customer_id: customerId,
      expires_at: new Date(Date.now() + sessionLifetime).toISOString(),
    });
    if (error) throw remoteError(error);
    return token;
  }

  return {
    async startSignup(body) {
      const person = acceptCustomer(body);
      const { data: existing, error: readError } = await client
        .from("customers")
        .select("id, verified_at")
        .eq("email", person.email)
        .maybeSingle();
      if (readError) throw remoteError(readError);
      if (existing?.verified_at)
        throw new HttpError(409, "That email already has an RMS. Sign in.");
      const password = await hashPassword(person.password);
      const row = {
        email: person.email,
        given_name: person.givenName,
        family_name: person.familyName,
        password,
      };
      const saved = existing
        ? await client.from("customers").update(row).eq("id", existing.id).select("id").single()
        : await client.from("customers").insert(row).select("id").single();
      if (saved.error) throw remoteError(saved.error);
      await issueCode(person.email, person.givenName);
      return { pending: true };
    },
    async resend(emailValue) {
      const email = normalizeEmail(emailValue);
      if (!validEmail(email)) throw new HttpError(400, "Add a valid email address.");
      const { data, error } = await client
        .from("customers")
        .select("given_name, verified_at")
        .eq("email", email)
        .maybeSingle();
      if (error) throw remoteError(error);
      if (!data || data.verified_at) return { pending: true };
      await issueCode(email, data.given_name);
      return { pending: true };
    },
    async verify(emailValue, code) {
      const email = normalizeEmail(emailValue);
      const digits = typeof code === "string" ? code.trim() : "";
      if (!validEmail(email) || !/^\d{6}$/.test(digits))
        throw new HttpError(400, "Enter the 6-digit code from your email.");
      const { data: row, error } = await client
        .from("customer_codes")
        .select("id, code_hash, expires_at, attempts")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw remoteError(error);
      if (!row || Date.parse(row.expires_at) <= Date.now())
        throw new HttpError(400, "That code has expired. Request a new one.");
      if (row.attempts >= 5)
        throw new HttpError(400, "That code has expired. Request a new one.");
      const { error: attemptError } = await client
        .from("customer_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      if (attemptError) throw remoteError(attemptError);
      if (!sameHash(row.code_hash, hashCode(digits)))
        throw new HttpError(400, "That code is not correct.");
      const { data: customer, error: customerError } = await client
        .from("customers")
        .update({ verified_at: new Date().toISOString() })
        .eq("email", email)
        .select("id, email, given_name, family_name")
        .single();
      if (customerError) throw remoteError(customerError);
      await client.from("customer_codes").delete().eq("email", email);
      return { customer: present(customer), token: await openSession(customer.id) };
    },
    async signIn(emailValue, password) {
      const email = normalizeEmail(emailValue);
      const { data, error } = await client
        .from("customers")
        .select("id, email, given_name, family_name, password, verified_at")
        .eq("email", email)
        .maybeSingle();
      if (error) throw remoteError(error);
      const matches = await verifyPassword(password, data?.password || dummyPassword);
      if (!data || !matches)
        throw new HttpError(401, "That email or password is not correct.");
      if (!data.verified_at) {
        const failure = new HttpError(403, "Enter the 6-digit code from your email.");
        failure.verify = true;
        throw failure;
      }
      return { customer: present(data), token: await openSession(data.id) };
    },
    async current(token) {
      if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
      const { data, error } = await client
        .from("customer_sessions")
        .select("expires_at, customers(email, given_name, family_name)")
        .eq("token", token)
        .maybeSingle();
      if (error) throw remoteError(error);
      const row = Array.isArray(data?.customers) ? data.customers[0] : data?.customers;
      if (!data || Date.parse(data.expires_at) <= Date.now() || !row) return null;
      return present(row);
    },
    async end(token) {
      if (typeof token !== "string") return;
      await client.from("customer_sessions").delete().eq("token", token);
    },
    async cart(token) {
      const customer = await this.customerId(token);
      const { data, error } = await client
        .from("customer_carts")
        .select("items")
        .eq("customer_id", customer)
        .maybeSingle();
      if (error) throw remoteError(error);
      return { items: Array.isArray(data?.items) ? data.items : [] };
    },
    async saveCart(token, items) {
      const customer = await this.customerId(token);
      const { error } = await client.from("customer_carts").upsert({
        customer_id: customer,
        items: cleanCart(items),
        updated_at: new Date().toISOString(),
      });
      if (error) throw remoteError(error);
      return { ok: true };
    },
    async wishlist(token) {
      const customer = await this.customerId(token);
      const { data, error } = await client
        .from("customer_wishlists")
        .select("product_ids")
        .eq("customer_id", customer)
        .maybeSingle();
      if (error) throw remoteError(error);
      return { ids: Array.isArray(data?.product_ids) ? data.product_ids : [] };
    },
    async saveWishlist(token, ids) {
      if (
        !Array.isArray(ids) ||
        ids.length > 200 ||
        ids.some((id) => typeof id !== "string" || !id || id.length > 80)
      )
        throw new HttpError(400, "Those saved pieces could not be kept.");
      const customer = await this.customerId(token);
      const { error } = await client.from("customer_wishlists").upsert({
        customer_id: customer,
        product_ids: [...new Set(ids)],
        updated_at: new Date().toISOString(),
      });
      if (error) throw remoteError(error);
      return { ok: true };
    },
    async customerId(token) {
      if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
        throw new HttpError(401, "Sign in to keep this bag.");
      const { data, error } = await client
        .from("customer_sessions")
        .select("customer_id, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (error) throw remoteError(error);
      if (!data || Date.parse(data.expires_at) <= Date.now())
        throw new HttpError(401, "Sign in to keep this bag.");
      return data.customer_id;
    },
  };
}
