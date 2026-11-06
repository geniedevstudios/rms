import { writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { HttpError } from "./content-store.mjs";
import { readJsonIfPresent } from "./studio-db.mjs";

const scryptAsync = promisify(scrypt);
const inviteLifetime = 7 * 24 * 60 * 60 * 1000;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function digest(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function sameHash(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32);
  return `${salt.toString("hex")}.${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored || "").split(".");
  if (!/^[0-9a-f]{32}$/.test(saltHex || "") || !/^[0-9a-f]{64}$/.test(hashHex || ""))
    return false;
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), 32);
  return timingSafeEqual(actual, Buffer.from(hashHex, "hex"));
}

export function createAdminStore(directory, ownerEmail, remote = null) {
  const file = resolve(directory, "admins.json");
  const owner = normalizeEmail(ownerEmail);

  async function read() {
    const data = remote ? await remote.load() : await readJsonIfPresent(file);
    const now = Date.now();
    const source = data && typeof data === "object" ? data : {};
    return {
      people: Array.isArray(source.people) ? source.people : [],
      invites: (Array.isArray(source.invites) ? source.invites : []).filter(
        (invite) =>
          invite &&
          invite.expiresAt > now &&
          invite.tokenHash &&
          invite.email,
      ),
    };
  }

  async function write(data) {
    if (remote) return remote.save(data);
    await mkdir(directory, { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2));
    await rename(temp, file);
  }

  function person(data, email) {
    return data.people.find((entry) => entry.email === email) || null;
  }

  function alreadyThere(email) {
    if (owner && email === owner)
      throw new HttpError(400, "They already have access to the studio.");
  }

  return {
    async list() {
      return read();
    },
    async find(email) {
      return person(await read(), normalizeEmail(email));
    },
    async invite(email) {
      const normalized = normalizeEmail(email);
      if (!validEmail(normalized))
        throw new HttpError(400, "Enter a valid email address.");
      alreadyThere(normalized);
      const data = await read();
      if (person(data, normalized))
        throw new HttpError(400, "They already have access to the studio.");
      const token = randomBytes(32).toString("base64url");
      const invites = data.invites.filter((invite) => invite.email !== normalized);
      invites.push({
        email: normalized,
        tokenHash: digest(token),
        expiresAt: Date.now() + inviteLifetime,
        createdAt: new Date().toISOString(),
      });
      await write({ people: data.people, invites });
      return { email: normalized, token };
    },
    async revoke(email) {
      const normalized = normalizeEmail(email);
      alreadyThere(normalized);
      const data = await read();
      if (person(data, normalized))
        throw new HttpError(400, "They already have access to the studio.");
      const invites = data.invites.filter((invite) => invite.email !== normalized);
      if (invites.length === data.invites.length)
        throw new HttpError(404, "There is no invitation for that email.");
      await write({ people: data.people, invites });
    },
    async preview(token) {
      if (typeof token !== "string" || token.length < 20)
        throw new HttpError(400, "This invitation is no longer available.");
      const data = await read();
      const invite = data.invites.find((entry) =>
        sameHash(entry.tokenHash, digest(token)),
      );
      if (!invite)
        throw new HttpError(400, "This invitation is no longer available.");
      return { email: invite.email };
    },
    async accept({ token, name, password }) {
      const cleanName = typeof name === "string" ? name.trim() : "";
      if (!cleanName || cleanName.length > 40)
        throw new HttpError(400, "Add a name of up to 40 characters.");
      if (
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128
      )
        throw new HttpError(400, "Use at least 12 characters.");
      if (typeof token !== "string" || token.length < 20)
        throw new HttpError(400, "This invitation is no longer available.");
      const data = await read();
      const hash = digest(token);
      const invite = data.invites.find((entry) => sameHash(entry.tokenHash, hash));
      if (!invite)
        throw new HttpError(400, "This invitation is no longer available.");
      alreadyThere(invite.email);
      if (person(data, invite.email))
        throw new HttpError(400, "They already have access to the studio.");
      data.people.push({
        email: invite.email,
        name: cleanName,
        password: await hashPassword(password),
        image: "",
        createdAt: new Date().toISOString(),
      });
      data.invites = data.invites.filter((entry) => !sameHash(entry.tokenHash, hash));
      await write(data);
      return { email: invite.email, name: cleanName };
    },
    async updateProfile(email, profile) {
      const data = await read();
      const entry = person(data, normalizeEmail(email));
      if (!entry)
        throw new HttpError(404, "That administrator could not be found.");
      entry.name = profile.name;
      entry.image = profile.image;
      await write(data);
      return { name: entry.name, image: entry.image || "" };
    },
  };
}
