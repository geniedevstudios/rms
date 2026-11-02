import { mkdir, readFile, appendFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { sendInvitation } from "./invitation-mail.mjs";
export function validateEntry(input) {
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.name !== "string" ||
    typeof input.email !== "string"
  )
    return null;
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  if (
    !name ||
    name.length > 80 ||
    /[\x00-\x1f]/.test(name) ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    input.website
  )
    return null;
  return {
    name,
    email,
    finish: input.finish === "pearl" ? "pearl" : "obsidian",
  };
}
export function createWaitlistStore(file) {
  let queue = Promise.resolve();
  return function reserve(entry) {
    const operation = queue.then(async () => {
      let content = "";
      try {
        content = await readFile(file, "utf8");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const records = content.trim()
        ? content
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line))
        : [];
      // Report an existing membership without returning stored names or references.
      if (records.some((record) => record.email === entry.email))
        return { status: "already_registered" };
      const reference = `RMS-${randomUUID().slice(0, 8).toUpperCase()}`;
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      await appendFile(
        file,
        JSON.stringify({
          ...entry,
          reference,
          createdAt: new Date().toISOString(),
          consent: "RMS launch updates",
          consentVersion: "2026-11-02",
        }) + "\n",
        { mode: 0o600 },
      );
      return { status: "reserved", reference };
    });
    queue = operation.catch(() => {});
    return operation;
  };
}
export function createSupabaseWaitlist({
  url,
  apiKey,
  resendKey,
  from,
  fetchImpl = fetch,
}) {
  return async function reserve(entry) {
    const reference = `RMS-${randomUUID().slice(0, 8).toUpperCase()}`;
    const response = await fetchImpl(`${url}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: entry.name,
        email: entry.email,
        reference,
        finish: entry.finish,
        consent: "RMS launch updates",
        consent_version: "2026-11-02",
      }),
    });
    if (response.status === 409) return { status: "already_registered" };
    if (!response.ok) {
      let code = "";
      try {
        code = (await response.json()).code || "";
      } catch {
        code = "";
      }
      if (code === "23505") return { status: "already_registered" };
      const error = new Error(
        code === "PGRST205"
          ? "The invitation list isn't ready yet. Please try again shortly."
          : "Your invitation couldn’t be saved right now. Please try again shortly.",
      );
      error.status = 503;
      throw error;
    }
    const emailed = await sendInvitation({
      fetchImpl,
      apiKey: resendKey,
      from,
      to: entry.email,
      name: entry.name,
      reference,
      finish: entry.finish,
    });
    return { status: "reserved", reference, emailed };
  };
}
