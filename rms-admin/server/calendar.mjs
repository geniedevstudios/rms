import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { HttpError } from "./content-store.mjs";

const scope = "https://www.googleapis.com/auth/calendar";
const tokenUrl = "https://oauth2.googleapis.com/token";
const envFile = resolve(import.meta.dirname, "../.env.local");

export function calendarConfig(env = process.env) {
  const id = String(env.GOOGLE_CALENDAR_ID || "").trim();
  const clientId = String(env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = String(env.GOOGLE_CLIENT_SECRET || "").trim();
  const refreshToken = String(env.GOOGLE_REFRESH_TOKEN || "").trim();
  if (!id || !clientId || !clientSecret) return null;
  return { id, clientId, clientSecret, refreshToken };
}

export function googleAuthUrl({ clientId, redirectUri, state, loginHint }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url.toString();
}

export async function exchangeAuthCode(calendar, code, redirectUri, fetchImpl = fetch) {
  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: calendar.clientId,
      client_secret: calendar.clientSecret,
      redirect_uri: redirectUri,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok && !data.refresh_token)
    throw new HttpError(502, "Google did not return a refresh token. Connect the calendar again.");
  if (!response.ok || !data.refresh_token)
    throw new HttpError(502, "Google did not connect the studio calendar.");
  return data.refresh_token;
}

export async function storeRefreshToken(token, file = envFile) {
  if (!token || /[\s"'\\]/.test(token) || token.length > 512)
    throw new HttpError(502, "Google did not connect the studio calendar.");
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const line = `GOOGLE_REFRESH_TOKEN="${token}"`;
  const body = text.replace(/\s*$/, "");
  const next = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text)
    ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line)
    : `${body ? `${body}\n` : ""}${line}\n`;
  await writeFile(file, next.endsWith("\n") ? next : `${next}\n`, { mode: 0o600 });
}

async function accessToken(calendar, fetchImpl) {
  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: calendar.refreshToken,
      client_id: calendar.clientId,
      client_secret: calendar.clientSecret,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token)
    throw new HttpError(502, "The meeting calendar could not be reached.");
  return data.access_token;
}

function eventBody(item, creating) {
  const start = new Date(item.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const body = {
    summary: `RIVERMINDSTYLE · ${item.service}`,
    description: `${item.name}\n${item.email}\n${item.id}`,
    start: { dateTime: start.toISOString(), timeZone: "Africa/Accra" },
    end: { dateTime: end.toISOString(), timeZone: "Africa/Accra" },
  };
  if (creating) {
    body.conferenceData = {
      createRequest: {
        requestId: `${item.id}-${start.getTime()}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  return body;
}

function meetingLink(event) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((point) => point.entryPointType === "video")?.uri ||
    ""
  );
}

async function writeEvent(token, calendarId, item, fetchImpl) {
  const existing = item.calendarEventId || "";
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${existing ? `/${encodeURIComponent(existing)}` : ""}`,
  );
  url.searchParams.set("conferenceDataVersion", "1");
  const response = await fetchImpl(url, {
    method: existing ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody(item, !existing)),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data.error?.errors?.[0]?.reason || data.error?.status || "";
    if (response.status === 404 || reason === "notFound")
      throw new HttpError(502, "The studio calendar could not be found.");
    if (String(data.error?.message || "").toLowerCase().includes("conference"))
      throw new HttpError(502, "Google did not create a meeting link for this calendar.");
    throw new HttpError(502, "The Google meeting could not be created.");
  }
  const link = meetingLink(data);
  if (!link) throw new HttpError(502, "Google did not return a meeting link.");
  return { meetLink: link, calendarEventId: data.id };
}

export async function attachOnlineMeeting(item, calendar, fetchImpl = fetch) {
  if (item.meeting !== "Online meeting") return item;
  if (!calendar?.id || !calendar.clientId || !calendar.clientSecret)
    throw new HttpError(503, "The meeting calendar is not ready.");
  if (!calendar.refreshToken)
    throw new HttpError(503, "Connect the studio Google account, then confirm the time again.");
  const token = await accessToken(calendar, fetchImpl);
  const meeting = await writeEvent(token, calendar.id, item, fetchImpl);
  return { ...item, ...meeting };
}
