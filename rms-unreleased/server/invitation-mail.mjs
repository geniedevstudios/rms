import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { accessCard, finishes } from "./invitation-card.mjs";

const site = "https://rivermindstyle.com";
const inlineAssets = [
  {
    filename: "invitation-hero.jpg",
    path: "../public/invitation-hero.jpg",
    type: "image/jpeg",
    id: "invitation-hero",
  },
  {
    filename: "chip.png",
    path: "../public/email/chip.png",
    type: "image/png",
    id: "card-chip",
  },
  {
    filename: "contactless.png",
    path: "../public/email/contactless.png",
    type: "image/png",
    id: "card-contactless",
  },
];
const instagram = "https://www.instagram.com/rivermindstyle_/";

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

export function invitationMessage({ name, reference, finish = "obsidian" }) {
  const tone = finishes[finish] || finishes.obsidian;
  const safeName = escapeHtml(name.toUpperCase());
  const safeReference = escapeHtml(reference);
  const year = new Date().getFullYear();
  const text = [
    "RivermindStyle",
    "",
    `Your ${tone.label} access card is reserved for ${name}.`,
    `Reference ${reference}.`,
    "",
    "This confirms your place. We'll let you know when RivermindStyle is live.",
    "",
    `Website: ${site}`,
    `Instagram: ${instagram}`,
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your RivermindStyle invitation</title>
    <style>
      @media only screen and (max-width: 480px) {
        .email-shell { padding:0 !important; }
        .hero, .hero-link { height:200px !important; }
        .gutter { width:16px !important; }
        .panel-padding { padding:0 16px 32px !important; }
        .card-padding { padding:20px 18px !important; }
        .card-brand { font-size:32px !important; line-height:32px !important; }
        .card-wordmark { letter-spacing:1.5px !important; }
        .card-chip-row { padding-top:18px !important; }
        .card-chip { width:32px !important; height:auto !important; }
        .card-access { padding-top:12px !important; font-size:8px !important; letter-spacing:1px !important; }
        .card-bottom { padding-top:26px !important; }
        .headline { font-size:28px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f0efed;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your ${tone.label} access card is reserved. We'll let you know when RivermindStyle is live.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0efed;">
      <tr><td align="center" class="email-shell" style="padding:28px 12px;">
        <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#f7f6f4;">
          <tr>
            <td class="hero" height="240" align="center" valign="middle" background="cid:invitation-hero" bgcolor="#ecd8d7" role="img" aria-label="RivermindStyle" style="height:240px;background-color:#ecd8d7;background-image:url('cid:invitation-hero');background-position:center;background-size:cover;background-repeat:no-repeat;">
              <!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:240px;"><v:fill type="frame" src="cid:invitation-hero" color="#ecd8d7" aspect="atleast" /><v:textbox inset="0,0,0,0"><![endif]-->
              <a href="${site}" aria-label="RivermindStyle website" class="hero-link" style="display:block;height:240px;text-decoration:none;">&nbsp;</a>
              <!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
            </td>
          </tr>
          <tr><td>
            <!-- Colored side cells create the inset overlap without negative margins. -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="gutter" width="28" bgcolor="#ecd8d7" style="width:28px;">&nbsp;</td>
                <td height="32" bgcolor="#ffffff" style="height:32px;line-height:32px;">&nbsp;</td>
                <td class="gutter" width="28" bgcolor="#ecd8d7" style="width:28px;">&nbsp;</td>
              </tr>
              <tr>
                <td class="gutter" width="28" style="width:28px;">&nbsp;</td>
                <td class="panel-padding" bgcolor="#ffffff" style="padding:0 32px 40px;">
                  ${accessCard({ name: safeName, tone })}
                  <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.6;letter-spacing:2px;text-align:center;color:#88847a;">${tone.label.toUpperCase()} EDITION &nbsp; / &nbsp; ${safeReference}</p>
                  <p style="margin:30px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:3px;text-align:center;color:#555149;">THE INNER CIRCLE</p>
                  <h1 class="headline" style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;line-height:1.15;letter-spacing:-1px;color:#24231f;text-align:center;">Your place is reserved.</h1>
                  <p style="margin:18px auto 0;max-width:330px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#77746d;text-align:center;">This confirms your place. We'll let you know when RivermindStyle is live.</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 0;"><tr><td align="center" bgcolor="#252620" style="background:#252620;">
                    <a href="${site}" style="display:inline-block;padding:16px 42px;border:1px solid #252620;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;">VISIT SITE</a>
                  </td></tr></table>
                </td>
                <td class="gutter" width="28" style="width:28px;">&nbsp;</td>
              </tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding:32px 24px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;color:#77746d;">Rooted in identity. Open to the world.</td></tr>
          <tr><td align="center" style="padding:14px 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#96928b;">Connect with us<br /><a href="${instagram}" style="color:#77746d;text-decoration:none;">@rivermindstyle_</a></td></tr>
          <tr><td align="center" style="padding:24px 40px 28px;"><div style="border-top:1px solid #dedbd5;padding-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.8;color:#96928b;">© ${year} RivermindStyle. All rights reserved.<br /><a href="${site}" style="color:#77746d;text-decoration:none;">rivermindstyle.com</a></div></td></tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
  </body>
</html>`;
  return {
    subject: "Your RivermindStyle invitation",
    text,
    html,
  };
}

export async function sendInvitation({
  fetchImpl = fetch,
  apiKey,
  from,
  to,
  name,
  reference,
  finish,
}) {
  const message = invitationMessage({ name, reference, finish });
  const attachments = await Promise.all(
    inlineAssets.map(async (asset) => ({
      filename: asset.filename,
      content: (
        await readFile(fileURLToPath(new URL(asset.path, import.meta.url)))
      ).toString("base64"),
      content_type: asset.type,
      content_id: asset.id,
    })),
  );
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments,
    }),
  });
  return response.ok;
}
