import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

export function createStudioDb(config) {
  const url = config?.url;
  const secret = config?.secret;
  if (!url || !secret) return null;
  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { client };
}

export async function readJsonIfPresent(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
