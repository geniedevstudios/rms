import { createNotifications, notificationConfig } from "./notifications/service.mjs";
import { createReadStream } from "node:fs";
import { readFile, writeFile, mkdir, stat, rename, unlink } from "node:fs/promises";
import { resolve, extname, basename } from "node:path";
import {
  randomUUID,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { Transform } from "node:stream";
import { createWriteStream } from "node:fs";
import {
  createContentStore,
  publicContent,
  HttpError,
} from "./content-store.mjs";
import { uploadToCloudinary, destroyCloudinary } from "./cloudinary.mjs";
import {
  createAdminStore,
  normalizeEmail,
  verifyPassword,
} from "./admins.mjs";
import { sendAdminInvite } from "./admin-mail.mjs";
import { createStorefrontSync } from "./storefront-sync.mjs";
import { createStudioDb, readJsonIfPresent } from "./studio-db.mjs";
import { createCustomerAccounts } from "./customers.mjs";
import { createNewsletter } from "./newsletter.mjs";
import { createRecords } from "./records.mjs";
import { serialTask } from "./serial-task.mjs";
import { acceptOrder, createOrderStore, orderStatuses } from "./orders.mjs";
import {
  acceptConsultation,
  consultationStatuses,
  createConsultationStore,
  sameBooking,
} from "./consultations.mjs";
const root = resolve(import.meta.dirname, "..");
const types = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".css": "text/css",
  ".js": "text/javascript",
  ".html": "text/html",
};
export async function serveFile(req, res, path) {
  const info = await stat(path);
  if (!info.isFile()) throw new HttpError(404, "File not found.");
  const headers = {
    "Content-Type": types[extname(path)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
      res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
      return res.end();
    }
    const start = Number(match[1]);
    const end = match[2]
      ? Math.min(Number(match[2]), info.size - 1)
      : info.size - 1;
    if (start > end || start >= info.size) {
      res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
      return res.end();
    }
    res.writeHead(206, {
      ...headers,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${info.size}`,
    });
    if (req.method === "HEAD") return res.end();
    return pipeline(createReadStream(path, { start, end }), res);
  }
  res.writeHead(200, { ...headers, "Content-Length": info.size });
  if (req.method === "HEAD") return res.end();
  return pipeline(createReadStream(path), res);
}
async function jsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2e6) throw new HttpError(413, "Content is too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
}
function mediaType(bytes) {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return ["png", "image"];
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return ["jpg", "image"];
  if (["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString()))
    return ["gif", "image"];
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  )
    return ["webp", "image"];
  if (bytes.subarray(4, 8).toString() === "ftyp") return ["mp4", "video"];
  if (bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])))
    return ["webm", "video"];
  throw new HttpError(400, "Upload a JPG, PNG, WebP, GIF, MP4, or WebM file.");
}
export function createApi({
  directory = resolve(root, "data"),
  password = process.env.RMS_ADMIN_PASSWORD,
  email = process.env.RMS_ADMIN_EMAIL,
  production = false,
  cloudinary = null,
  resend = null,
  notificationsConfig = notificationConfig(),
  onWorkerCreated = () => {},
  supabase = null,
  worker = true,
} = {}) {
  const adminEmail = String(email || "").trim().toLowerCase();
  const inviteOwner = "rivermindstyle.operations@gmail.com";
  const mail =
    resend?.apiKey && resend?.from
      ? resend
      : process.env.RESEND_API_KEY && process.env.RESEND_FROM
        ? {
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.RESEND_FROM,
          }
        : null;
  if (production && (!password || password.length < 12 || !adminEmail))
    throw new Error(
      "Set RMS_ADMIN_EMAIL and RMS_ADMIN_PASSWORD (at least 12 characters) before starting a production admin server.",
    );
  const db = createStudioDb(supabase);
  const records = createRecords(db?.client);
  const newsletter = createNewsletter(db?.client);
  const accounts = createCustomerAccounts(db?.client, {
    apiKey: notificationsConfig.apiKey,
    from: notificationsConfig.senders.verification,
    storefrontUrl: notificationsConfig.storefrontUrl,
  });
  const store = createContentStore(directory, {
    sync: createStorefrontSync(supabase),
    remote: records?.catalogue ?? null,
  });
  void store.pushLive().catch((error) =>
    console.error("RMS live storefront sync failed.", error.message),
  );
  const admins = createAdminStore(directory, adminEmail, records?.admins ?? null);
  const orderBook = records?.orders ?? createOrderStore(directory);
  const consultations = records?.consultations ?? createConsultationStore(directory);
  const notifications = createNotifications({ directory, config: { ...notificationsConfig, apiKey: mail?.apiKey, from: mail?.from, adminEmail: notificationsConfig.adminEmail || adminEmail }, contentStore: store, orderBook, remote: records?.mail ?? null });
  const secureCookie = process.env.COOKIE_SECURE === "true" || process.env.VERCEL === "1" ? "; Secure" : "";
  if (worker) {
    const notificationTimer = setInterval(() => { void notifications.tick().catch((error) => console.error("RMS email worker could not finish. Pending messages will retry.", error?.stack || error?.message || error)); }, 10000);
    notificationTimer.unref();
    onWorkerCreated(notificationTimer);
  }
  const profileFile = resolve(directory, "profile.json");
  const profileRemote = records?.profile ?? null;
  function presentProfile(data) {
    return {
      name: String(data?.name || "Mimi").trim().slice(0, 40) || "Mimi",
      image: typeof data?.image === "string" ? data.image : "",
    };
  }
  async function readProfile() {
    if (profileRemote) {
      const saved = await profileRemote.load();
      return presentProfile(saved || { name: "Mimi", image: "" });
    }
    return presentProfile((await readJsonIfPresent(profileFile)) || { name: "Mimi", image: "" });
  }
  async function writeProfile(profile) {
    if (profileRemote) {
      await profileRemote.save(profile);
      return profile;
    }
    await mkdir(directory, { recursive: true });
    const temp = profileFile + "." + randomUUID() + ".tmp";
    await writeFile(temp, JSON.stringify(profile, null, 2));
    await rename(temp, profileFile);
    return profile;
  }
  const sessions = new Map();
  const sessionRemote = records?.sessions ?? null;
  const sessionLock = serialTask();
  async function sessionList() {
    const saved = await sessionRemote.load();
    const list = Array.isArray(saved) ? saved : [];
    return list.filter((item) => item && item.expires > Date.now() && item.token && item.email);
  }
  const attempts = new Map();
  const joinAttempts = new Map();
  const orderAttempts = new Map();
  const statusAttempts = new Map();
  const consultAttempts = new Map();
  const checkoutAttempts = new Map();
  const accountAttempts = new Map();
  const newsletterAttempts = new Map();
  const send = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  };
  function canGiveAccess(address) {
    return address === inviteOwner;
  }
  function readCookie(req) {
    return (req.headers.cookie || "")
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("rms_admin="))
      ?.slice(10);
  }
  async function currentSession(req) {
    if (!password) return { email: adminEmail };
    const id = readCookie(req);
    if (!id) return null;
    if (!sessionRemote) {
      const session = sessions.get(id);
      if (!session || session.expires <= Date.now()) {
        sessions.delete(id);
        return null;
      }
      return session;
    }
    const list = await sessionList();
    return list.find((item) => item.token === id) || null;
  }
  async function beginSession(res, address) {
    const token = randomBytes(32).toString("hex");
    const entry = { token, email: address, expires: Date.now() + 8 * 60 * 60e3 };
    if (sessionRemote) {
      await sessionLock(async () => {
        const list = await sessionList();
        list.push(entry);
        await sessionRemote.save(list);
      });
    } else {
      sessions.set(token, { email: address, expires: entry.expires });
    }
    res.setHeader(
      "Set-Cookie",
      `rms_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secureCookie}`,
    );
    return {
      authenticated: true,
      localMode: false,
      canInvite: canGiveAccess(address),
    };
  }
  function guard(map, ip, limit = 10) {
    const previous = map.get(ip);
    const entry =
      previous && previous.until > Date.now()
        ? previous
        : { count: 0, until: Date.now() + 15 * 60e3 };
    if (entry.count >= limit)
      throw new HttpError(429, "Too many attempts. Try again in 15 minutes.");
    entry.count += 1;
    map.set(ip, entry);
    return () => map.delete(ip);
  }
  function publicOrigin(req) {
    const forwarded = req.headers["x-forwarded-proto"];
    const proto =
      (typeof forwarded === "string" ? forwarded.split(",")[0] : "http").trim() ||
      "http";
    const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    return `${proto}://${host}`;
  }
  function requireOwner(session) {
    if (!canGiveAccess(session.email))
      throw new HttpError(403, "Only the studio owner can give access.");
  }
  function portraitId(address) {
    if (!address || address === adminEmail) return "admin-portrait";
    return (
      "portrait-" + createHash("sha256").update(address).digest("hex").slice(0, 16)
    );
  }
  async function profileFor(address) {
    if (!address || address === adminEmail) return readProfile();
    const person = await admins.find(address);
    if (!person) throw new HttpError(401, "Please sign in to continue.");
    return {
      name: String(person.name || "").trim().slice(0, 40) || "Studio",
      image: typeof person.image === "string" ? person.image : "",
    };
  }
  function cleanProfile(body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    if (!name || name.length > 40)
      throw new HttpError(400, "Add a name of up to 40 characters.");
    if (
      image &&
      !image.startsWith("https://res.cloudinary.com/") &&
      !image.startsWith("/uploads/")
    )
      throw new HttpError(400, "Choose a photo from your studio.");
    return { name, image };
  }
  return async function api(
    req,
    res,
    next = () => send(res, 404, { error: "Not found." }),
  ) {
    const path = new URL(req.url, "http://localhost").pathname;
    const isApi = path.startsWith("/api/cms/");
    const isUpload = path.startsWith("/uploads/");
    const isMedia = path.startsWith("/media/");
    const isAsset = path.startsWith("/images/") || path.startsWith("/videos/");
    if (!isApi && !isUpload && !isMedia && !isAsset) return next();
    try {
      if (isUpload || isAsset) {
        if (!["GET", "HEAD"].includes(req.method))
          throw new HttpError(405, "Method not allowed.");
        const allowed = isUpload
          ? /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp|gif|mp4|webm)$/
          : /^\/(images|videos)\/[a-zA-Z0-9._-]+$/;
        if (!allowed.test(path)) throw new HttpError(404, "File not found.");
        return await serveFile(
          req,
          res,
          isUpload
            ? resolve(directory, path.slice(1))
            : resolve(root, "public", path.slice(1)),
        );
      }
      const mediaPath = /^\/media\/(image|video)\/([A-Za-z0-9][A-Za-z0-9_.,/-]*)$/.exec(
        path,
      );
      if (mediaPath) {
        if (!["GET", "HEAD"].includes(req.method))
          throw new HttpError(405, "Method not allowed.");
        const cloudName = cloudinary?.cloudName;
        const objectPath = mediaPath[2];
        if (!cloudName || objectPath.includes(".."))
          throw new HttpError(404, "File not found.");
        const upstream = await fetch(
          `https://res.cloudinary.com/${cloudName}/${mediaPath[1]}/upload/${objectPath}`,
          { method: req.method },
        );
        const type = upstream.headers.get("content-type") || "";
        if (!upstream.ok || !/^(image|video)\//.test(type))
          throw new HttpError(404, "File not found.");
        res.writeHead(200, {
          "Content-Type": type,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        });
        if (req.method === "HEAD" || !upstream.body) return res.end();
        return await pipeline(Readable.fromWeb(upstream.body), res);
      }
      if (path === "/api/cms/published" && req.method === "GET") {
        const s = await store.read();
        return send(res, 200, {
          content: publicContent(s.published),
          revision: s.publishedRevision,
        });
      }
      if (path === "/api/cms/orders" && req.method === "POST") {
        const clear = guard(orderAttempts, req.socket.remoteAddress, 20);
        const saved = await notifications.order(acceptOrder(await jsonBody(req)));
        clear();
        return send(res, 200, saved);
      }
      if (path === "/api/cms/orders/status" && req.method === "POST") {
        const clear = guard(statusAttempts, req.socket.remoteAddress, 60);
        const body = await jsonBody(req);
        const ids = Array.isArray(body?.ids) ? body.ids.slice(0, 40) : [];
        clear();
        return send(res, 200, await orderBook.statuses(ids));
      }
      function accountCookie(req) {
        return (req.headers.cookie || "")
          .split(";")
          .map((value) => value.trim())
          .find((value) => value.startsWith("rms_account="))
          ?.slice(12);
      }
      function setAccountCookie(response, token) {
        response.setHeader(
          "Set-Cookie",
          `rms_account=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secureCookie}`,
        );
      }
      function requireAccounts() {
        if (!accounts) throw new HttpError(503, "Accounts are not ready yet.");
        return accounts;
      }
      if (path === "/api/cms/newsletter" && req.method === "POST") {
        guard(newsletterAttempts, req.socket.remoteAddress, 8);
        if (!newsletter) throw new HttpError(503, "The newsletter is not ready yet.");
        const body = await jsonBody(req);
        return send(res, 200, await newsletter.join(body.email));
      }
      if (path === "/api/cms/account" && req.method === "GET") {
        const shop = requireAccounts();
        return send(res, 200, { customer: await shop.current(accountCookie(req)) });
      }
      if (path === "/api/cms/account/signup" && req.method === "POST") {
        guard(accountAttempts, req.socket.remoteAddress, 8);
        return send(res, 200, await requireAccounts().startSignup(await jsonBody(req)));
      }
      if (path === "/api/cms/account/code" && req.method === "POST") {
        guard(accountAttempts, req.socket.remoteAddress, 8);
        const body = await jsonBody(req);
        return send(res, 200, await requireAccounts().resend(body.email));
      }
      if (path === "/api/cms/account/verify" && req.method === "POST") {
        guard(accountAttempts, req.socket.remoteAddress, 12);
        const body = await jsonBody(req);
        const signed = await requireAccounts().verify(body.email, body.code);
        setAccountCookie(res, signed.token);
        return send(res, 200, { customer: signed.customer });
      }
      if (path === "/api/cms/account/login" && req.method === "POST") {
        const clear = guard(accountAttempts, req.socket.remoteAddress, 8);
        const body = await jsonBody(req);
        const signed = await requireAccounts().signIn(body.email, body.password);
        clear();
        setAccountCookie(res, signed.token);
        return send(res, 200, { customer: signed.customer });
      }
      if (path === "/api/cms/account/logout" && req.method === "POST") {
        await requireAccounts().end(accountCookie(req));
        res.setHeader(
          "Set-Cookie",
          `rms_account=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie}`,
        );
        return send(res, 200, { ok: true });
      }
      if (path === "/api/cms/account/cart" && req.method === "GET")
        return send(res, 200, await requireAccounts().cart(accountCookie(req)));
      if (path === "/api/cms/account/cart" && req.method === "PUT")
        return send(res, 200, await requireAccounts().saveCart(accountCookie(req), (await jsonBody(req)).items));
      if (path === "/api/cms/account/wishlist" && req.method === "GET")
        return send(res, 200, await requireAccounts().wishlist(accountCookie(req)));
      if (path === "/api/cms/account/wishlist" && req.method === "PUT")
        return send(res, 200, await requireAccounts().saveWishlist(accountCookie(req), (await jsonBody(req)).ids));
      if (path === "/api/cms/consultations/pay" && req.method === "POST") {
        guard(consultAttempts, req.socket.remoteAddress, 20);
        const booking = acceptConsultation(await jsonBody(req));
        const existing = await consultations.find(booking.id);
        if (existing?.paid)
          throw new HttpError(400, "This appointment is already requested.");
        if (existing && !sameBooking(existing, booking))
          throw new HttpError(400, "Start the appointment again.");
        if (existing?.accessCode)
          return send(res, 200, { accessCode: existing.accessCode, reference: booking.id });
        const started = await notifications.startConsultation(booking);
        await consultations.save({
          ...booking,
          paid: false,
          paymentReference: booking.id,
          accessCode: started.accessCode,
        });
        return send(res, 200, started);
      }
      if (path === "/api/cms/consultations" && req.method === "POST") {
        guard(consultAttempts, req.socket.remoteAddress, 20);
        const body = await jsonBody(req);
        const reference = typeof body?.reference === "string" ? body.reference : "";
        const existing = await consultations.find(reference);
        if (!existing) throw new HttpError(400, "Start the appointment again.");
        if (!existing.paid) {
          await notifications.confirmConsultationPayment(reference, existing);
          const saved = await consultations.save({
            ...existing,
            paid: true,
            paymentReference: reference,
          });
          await notifications.event("consultation", saved);
          return send(res, 200, saved);
        }
        return send(res, 200, existing);
      }
      if (path === "/api/cms/checkouts" && req.method === "POST") {
        guard(checkoutAttempts, req.socket.remoteAddress, 120);
        return send(res, 200, await notifications.checkout(await jsonBody(req)));
      }
      if (path === "/api/cms/checkouts/quote" && req.method === "POST") {
        guard(checkoutAttempts, req.socket.remoteAddress, 120);
        return send(res, 200, await notifications.quote(await jsonBody(req)));
      }
      if (path === "/api/cms/checkouts/initialize" && req.method === "POST") {
        guard(checkoutAttempts, req.socket.remoteAddress, 120);
        const body = await jsonBody(req);
        return send(res, 200, await notifications.initialize(body.token, body.reference));
      }
      if (path === "/api/cms/checkouts/issue" && req.method === "POST") {
        guard(checkoutAttempts, req.socket.remoteAddress, 120);
        const body = await jsonBody(req);
        return send(res, 200, await notifications.issue(body.token, body.reference, body.reason));
      }
      if (path === "/api/cms/checkouts/verify" && req.method === "POST") {
        guard(checkoutAttempts, req.socket.remoteAddress, 120);
        const body = await jsonBody(req);
        const saved = await notifications.complete(body.token, body.reference);
        return send(res, 200, { reference: saved.id, email: saved.email, total: saved.total, subtotal: saved.subtotal, discount: saved.discount, promoCode: saved.promoCode });
      }
      if (path === "/api/cms/checkouts/recover" && req.method === "POST") {
        guard(statusAttempts, req.socket.remoteAddress, 120);
        const body = await jsonBody(req);
        return send(res, 200, await notifications.recover(body.token));
      }
      if (path === "/api/cms/checkouts/stop" && req.method === "POST") {
        guard(statusAttempts, req.socket.remoteAddress, 120);
        const body = await jsonBody(req);
        return send(res, 200, await notifications.optOut(body.token));
      }
      if (path === "/api/cms/cron" && (req.method === "GET" || req.method === "POST")) {
        const secret = process.env.CRON_SECRET || "";
        const header = req.headers.authorization || "";
        const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
        if (!secret || bearer !== secret) throw new HttpError(401, "Unauthorized");
        await notifications.tick();
        return send(res, 200, { ok: true });
      }
      // Writes and private reads must come from this admin origin, never a third-party page.
      if (req.headers.origin) {
        const origin = new URL(req.headers.origin);
        if (origin.host !== req.headers.host)
          throw new HttpError(
            403,
            "Open the admin dashboard to make this change.",
          );
      }
      const session = await currentSession(req);
      if (path === "/api/cms/session" && req.method === "GET")
        return send(res, 200, {
          authenticated: Boolean(session),
          localMode: !password,
          canInvite: canGiveAccess(session?.email || ""),
        });
      if (path === "/api/cms/login" && req.method === "POST") {
        const clear = guard(attempts, req.socket.remoteAddress);
        const body = await jsonBody(req);
        const hash = (value) => createHash("sha256").update(value).digest();
        const suppliedEmail = normalizeEmail(body.email);
        if (!password || !adminEmail)
          throw new HttpError(500, "Studio sign-in is not configured.");
        let signedIn = "";
        const ownerEmailMatch = timingSafeEqual(
          hash(suppliedEmail),
          hash(adminEmail),
        );
        const ownerPasswordMatch =
          typeof body.password === "string" &&
          timingSafeEqual(hash(body.password), hash(password));
        if (ownerEmailMatch && ownerPasswordMatch) signedIn = adminEmail;
        else if (!ownerEmailMatch && typeof body.password === "string") {
          const person = await admins.find(suppliedEmail);
          const stored =
            person?.password ||
            "00112233445566778899aabbccddeeff.00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
          if ((await verifyPassword(body.password, stored)) && person)
            signedIn = person.email;
        }
        if (!signedIn)
          throw new HttpError(401, "That email or password is not correct.");
        clear();
        return send(res, 200, await beginSession(res, signedIn));
      }
      if (
        (path === "/api/cms/join/preview" || path === "/api/cms/join") &&
        req.method === "POST"
      ) {
        const clear = guard(joinAttempts, req.socket.remoteAddress);
        const body = await jsonBody(req);
        if (path === "/api/cms/join/preview")
          return send(res, 200, await admins.preview(body.token));
        const person = await admins.accept(body);
        clear();
        return send(res, 200, await beginSession(res, person.email));
      }
      if (!session) throw new HttpError(401, "Please sign in to continue.");
      if (path === "/api/cms/notifications" && req.method === "GET") return send(res, 200, await notifications.status());
      if (path === "/api/cms/orders" && req.method === "GET")
        return send(res, 200, await orderBook.list());
      const orderMatch = /^\/api\/cms\/orders\/(RMS-[A-Z0-9]{8,24})$/.exec(path);
      if (orderMatch && req.method === "PATCH") {
        const body = await jsonBody(req);
        if (!orderStatuses.includes(body?.status))
          throw new HttpError(400, "Choose a step on the order.");
        return send(
          res,
          200,
          await orderBook.setStatus(orderMatch[1], body.status),
        );
      }
      if (path === "/api/cms/consultations" && req.method === "GET")
        return send(res, 200, await consultations.list());
      const consultMatch = /^\/api\/cms\/consultations\/(CST-[A-Z0-9]{8,24})$/.exec(
        path,
      );
      if (consultMatch && req.method === "PATCH") {
        const body = await jsonBody(req);
        if (body?.action === "approve") {
          const saved = await consultations.approve(consultMatch[1], body.scheduledAt);
          await notifications.event("consultation-confirmed", saved);
          return send(res, 200, saved);
        }
        if (body?.action === "reschedule") {
          const saved = await consultations.reschedule(consultMatch[1], body.scheduledAt);
          await notifications.event("consultation-rescheduled", saved);
          return send(res, 200, saved);
        }
        if (!consultationStatuses.includes(body?.status))
          throw new HttpError(400, "Choose a step on the consultation.");
        return send(
          res,
          200,
          await consultations.setStatus(consultMatch[1], body.status),
        );
      }
      if (path === "/api/cms/logout" && req.method === "POST") {
        if (sessionRemote) {
          const id = readCookie(req);
          await sessionLock(async () => {
            const list = await sessionList();
            await sessionRemote.save(list.filter((item) => item.token !== id));
          });
        } else {
          sessions.delete(readCookie(req));
        }
        res.setHeader(
          "Set-Cookie",
          `rms_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie}`,
        );
        return send(res, 200, { ok: true });
      }
      if (path === "/api/cms/admins" && req.method === "GET") {
        requireOwner(session);
        const data = await admins.list();
        const owner = await readProfile();
        return send(res, 200, {
          people: [
            ...(adminEmail
              ? [
                  {
                    email: adminEmail,
                    name: owner.name,
                    status: "active",
                    you: session.email === adminEmail,
                  },
                ]
              : []),
            ...data.people.map((person) => ({
              email: person.email,
              name: person.name,
              status: "active",
              you: false,
            })),
            ...data.invites.map((invite) => ({
              email: invite.email,
              name: "",
              status: "invited",
              you: false,
            })),
          ],
        });
      }
      if (path === "/api/cms/admins" && req.method === "POST") {
        requireOwner(session);
        const body = await jsonBody(req);
        const invited = await admins.invite(body.email);
        const link = `${publicOrigin(req)}/#/join/${invited.token}`;
        try {
          await sendAdminInvite({
            apiKey: mail?.apiKey,
            from: mail?.from,
            to: invited.email,
            link,
          });
        } catch {
          await admins.revoke(invited.email).catch(() => {});
          throw new HttpError(
            mail?.apiKey && mail?.from ? 502 : 500,
            mail?.apiKey && mail?.from
              ? "The invitation email could not be sent."
              : "Studio email is not configured.",
          );
        }
        return send(res, 200, { email: invited.email, status: "invited" });
      }
      if (path === "/api/cms/admins" && req.method === "DELETE") {
        requireOwner(session);
        const body = await jsonBody(req);
        await admins.revoke(body.email);
        return send(res, 200, { ok: true });
      }
      if (path === "/api/cms/profile" && req.method === "GET")
        return send(res, 200, await profileFor(session.email));
      if (path === "/api/cms/profile" && req.method === "PUT") {
        const profile = cleanProfile(await jsonBody(req));
        if (!session.email || session.email === adminEmail)
          return send(res, 200, await writeProfile(profile));
        return send(res, 200, await admins.updateProfile(session.email, profile));
      }
      if (path === "/api/cms/profile/photo" && req.method === "POST") {
        const dir = resolve(directory, "uploads");
        await mkdir(dir, { recursive: true });
        const id = randomUUID();
        const temp = resolve(dir, id + ".tmp");
        let size = 0;
        let head = Buffer.alloc(0);
        try {
          await pipeline(
            req,
            new Transform({
              transform(chunk, _, done) {
                size += chunk.length;
                if (size > 15 * 1024 * 1024)
                  return done(new HttpError(413, "Images must be under 15 MB."));
                if (head.length < 32)
                  head = Buffer.concat([
                    head,
                    chunk.subarray(0, 32 - head.length),
                  ]);
                done(null, chunk);
              },
            }),
            createWriteStream(temp, { flags: "wx" }),
          );
          const [extension, type] = mediaType(head);
          if (type !== "image")
            throw new HttpError(400, "Choose a JPG, PNG, WebP, or GIF.");
          const stored = resolve(dir, id + "." + extension);
          await rename(temp, stored);
          let url = "/uploads/" + id + "." + extension;
          if (cloudinary) {
            try {
              url = await uploadToCloudinary(stored, {
                ...cloudinary,
                resourceType: "image",
                publicId: portraitId(session.email),
                overwrite: true,
              });
            } finally {
              await unlink(stored).catch(() => {});
            }
          }
          return send(res, 201, { url });
        } finally {
          await unlink(temp).catch(() => {});
        }
      }
      if (path === "/api/cms/state" && req.method === "GET")
        return send(res, 200, await store.read());
      if (path === "/api/cms/draft" && req.method === "PUT") {
        const b = await jsonBody(req);
        return send(res, 200, await store.save(b.content, b.revision));
      }
      if (path === "/api/cms/publish" && req.method === "POST") {
        const b = await jsonBody(req);
        return send(res, 200, await store.publish(b.revision));
      }
      if (path === "/api/cms/discard" && req.method === "POST") {
        const b = await jsonBody(req);
        return send(res, 200, await store.discard(b.revision));
      }
      if (path === "/api/cms/upload" && req.method === "POST") {
        const dir = resolve(directory, "uploads");
        await mkdir(dir, { recursive: true });
        const id = randomUUID();
        const temp = resolve(dir, id + ".tmp");
        let size = 0;
        let head = Buffer.alloc(0);
        try {
          await pipeline(
            req,
            new Transform({
              transform(chunk, _, done) {
                size += chunk.length;
                if (size > 100 * 1024 * 1024)
                  return done(
                    new HttpError(413, "Files must be under 100 MB."),
                  );
                if (head.length < 32)
                  head = Buffer.concat([
                    head,
                    chunk.subarray(0, 32 - head.length),
                  ]);
                done(null, chunk);
              },
            }),
            createWriteStream(temp, { flags: "wx" }),
          );
          const [extension, type] = mediaType(head);
          if (type === "image" && size > 15 * 1024 * 1024)
            throw new HttpError(413, "Images must be under 15 MB.");
          const filename = id + "." + extension;
          const stored = resolve(dir, filename);
          await rename(temp, stored);
          let name;
          try {
            name = decodeURIComponent(req.headers["x-file-name"] || "Upload");
          } catch {
            name = "Upload";
          }
          let url = "/uploads/" + filename;
          if (cloudinary) {
            try {
              url = await uploadToCloudinary(stored, {
                ...cloudinary,
                resourceType: type === "video" ? "video" : "image",
                publicId: id,
              });
            } finally {
              await unlink(stored).catch(() => {});
            }
          }
          const asset = {
            id,
            name: basename(name).slice(0, 160),
            url,
            type,
            alt: "",
            size,
            createdAt: new Date().toISOString(),
          };
          try {
            const state = await store.addMedia(asset);
            return send(res, 201, { asset, state });
          } catch (error) {
            if (cloudinary)
              await destroyCloudinary(url, cloudinary).catch(() => {});
            else await unlink(stored).catch(() => {});
            throw error;
          }
        } finally {
          await unlink(temp).catch(() => {});
        }
      }
      const match = /^\/api\/cms\/media\/([a-z0-9-]+)$/.exec(path);
      if (match && req.method === "PATCH") {
        const b = await jsonBody(req);
        return send(res, 200, await store.editMedia(match[1], b.alt));
      }
      if (match && req.method === "DELETE") {
        const before = await store.read();
        const asset = before.media.find((m) => m.id === match[1]);
        const state = await store.removeMedia(match[1]);
        if (asset?.url.startsWith("/uploads/"))
          await unlink(resolve(directory, asset.url.slice(1))).catch(() => {});
        else if (asset)
          await destroyCloudinary(asset.url, cloudinary).catch(() => {});
        return send(res, 200, state);
      }
      throw new HttpError(404, "Not found.");
    } catch (error) {
      if (res.headersSent) return res.destroy();
      send(res, error.status || (error.code === "ENOENT" ? 404 : 500), {
        error: error.status
          ? error.message
          : error.code === "ENOENT"
            ? "File not found."
            : "Unable to complete the request. Please try again.",
        ...(error.verify ? { verify: true } : {}),
      });
    }
  };
}
