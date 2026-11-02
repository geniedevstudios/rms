import { validateEntry, createSupabaseWaitlist } from "../server/waitlist.mjs";

const rates = new Map();

function address(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded)
    return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function limited(req) {
  const now = Date.now();
  for (const [key, value] of rates)
    if (now - value.start > 60000) rates.delete(key);
  const key = address(req);
  const rate = rates.get(key) || { start: now, count: 0 };
  rate.count += 1;
  rates.set(key, rate);
  return rate.count > 15;
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Use the invitation form to join." });
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== host)
        return res.status(403).json({ error: "Please submit from the RMS website." });
    } catch {
      return res.status(403).json({ error: "Please submit from the RMS website." });
    }
  }
  if (!req.headers["content-type"]?.startsWith("application/json"))
    return res.status(415).json({ error: "Please use the invitation form." });
  if (limited(req))
    return res.status(429).json({ error: "Please wait a minute before trying again." });
  let input = req.body;
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return res.status(400).json({ error: "Please check your details and try again." });
    }
  }
  const entry = validateEntry(input);
  if (!entry)
    return res.status(400).json({ error: "Enter your name and a valid email address." });
  const url = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !apiKey || !resendKey)
    return res.status(503).json({
      error: "Your invitation couldn’t be saved right now. Please try again shortly.",
    });
  try {
    const saved = await createSupabaseWaitlist({
      url,
      apiKey,
      resendKey,
      from: process.env.RESEND_FROM || "RIVERMINDSTYLE <hello@rivermindstyle.com>",
    })(entry);
    if (saved.emailed === false)
      console.error("Invitation saved, but the confirmation email was not accepted.");
    return res.status(200).json(saved);
  } catch (error) {
    return res.status(error.status || 503).json({
      error: error.status
        ? error.message
        : "Your invitation couldn’t be saved right now. Please try again shortly.",
    });
  }
}
