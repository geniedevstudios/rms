import PostalMime from "postal-mime";
import { Resend } from "resend";

const supportAddress = "hello@rivermindstyle.com";
const destination = "rivermindstyle.operations@gmail.com";
const forwardFrom = "RIVERMINDSTYLE <forwarding@rivermindstyle.com>";
const maxBodyBytes = 256 * 1024;
const emailIdPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function containsAddress(values, address) {
  return Array.isArray(values) && values.some((value) => {
    if (typeof value !== "string") return false;
    return (value.match(/<([^<>]+)>$/)?.[1] ?? value).trim().toLowerCase() === address;
  });
}

function end(res, statusCode) {
  res.statusCode = statusCode;
  res.end();
}

export default function handler(req, res) {
  return forwardReceivedEmail(req, res, process.env);
}

export async function forwardReceivedEmail(req, res, env) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return end(res, 405);
  }

  const key = env.RESEND_FORWARD_API_KEY?.trim();
  const secret = env.RESEND_FORWARD_WEBHOOK_SECRET?.trim();
  if (!key || !secret) return end(res, 503);

  const resend = new Resend(key);
  let event;
  try {
    const id = req.headers["svix-id"];
    const timestamp = req.headers["svix-timestamp"];
    const signature = req.headers["svix-signature"];
    if ([id, timestamp, signature].some((header) => typeof header !== "string")) {
      return end(res, 400);
    }
    // Resend signs the original bytes, so do not use Vercel's parsed req.body.
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > maxBodyBytes) return end(res, 413);
      chunks.push(bytes);
    }
    event = resend.webhooks.verify({
      payload: Buffer.concat(chunks).toString("utf8"),
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    });
  } catch {
    return end(res, 400);
  }

  if (event?.type !== "email.received") return end(res, 204);
  const message = event.data;
  if (
    ![message?.to, message?.cc, message?.bcc].some((list) => containsAddress(list, supportAddress)) ||
    containsAddress([message.from], "forwarding@rivermindstyle.com")
  ) {
    return end(res, 204);
  }
  if (typeof message.email_id !== "string" || !emailIdPattern.test(message.email_id)) {
    return end(res, 400);
  }

  try {
    const signal = AbortSignal.timeout(12000);
    const { data: received, error: receiveError } = await resend.emails.receiving.get(
      message.email_id, {}, { signal },
    );
    if (receiveError || !received?.raw?.download_url) {
      console.error("RMS inbound email retrieval failed", receiveError?.name, receiveError?.statusCode);
      return end(res, 502);
    }

    const raw = await fetch(received.raw.download_url, { signal });
    if (!raw.ok) {
      console.error("RMS inbound email download failed", raw.status);
      return end(res, 502);
    }
    const email = await PostalMime.parse(await raw.arrayBuffer(), { attachmentEncoding: "base64" });
    const replyTo = email.replyTo?.find((mailbox) => mailbox.address)?.address || email.from?.address;
    const attachments = email.attachments.map((attachment) => ({
      filename: attachment.filename || undefined,
      content: attachment.content,
      contentType: attachment.mimeType,
      contentId: attachment.contentId?.replace(/^<|>$/g, "") || undefined,
    }));
    const { error } = await resend.emails.send(
      {
        from: forwardFrom,
        to: destination,
        replyTo,
        subject: received.subject || "(no subject)",
        text: email.text || (email.html ? undefined : "See attached files."),
        html: email.html || undefined,
        attachments: attachments.length ? attachments : undefined,
      },
      { idempotencyKey: `rms-support-forward/${message.email_id}`, signal },
    );
    if (!error) return end(res, 204);
    console.error("RMS inbound forwarding failed", error.name, error.statusCode);
  } catch {
    console.error("RMS inbound forwarding request failed");
  }
  return end(res, 502);
}
