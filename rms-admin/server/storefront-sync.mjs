import { createClient } from "@supabase/supabase-js";

export function createStorefrontSync(config) {
  const url = config?.url;
  const secret = config?.secret;
  if (!url || !secret) return null;
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return async function syncStorefront(content, revision, publishedAt) {
    const { error } = await supabase.from("storefront").upsert({
      id: "live",
      revision,
      published_at: publishedAt,
      content,
      updated_at: new Date().toISOString(),
    });
    if (!error) return;
    const failure = new Error(
      "The live storefront did not update. " +
        String(error.message || "Try again.").slice(0, 180),
    );
    failure.status = 502;
    throw failure;
  };
}
