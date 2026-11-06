function escapeHtml(value) {
  return String(value).replace(
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

export function adminInviteMessage(link) {
  const safeLink = escapeHtml(link);
  const year = new Date().getFullYear();
  const text = [
    "RIVERMINDSTYLE",
    "",
    "You've been invited to the studio.",
    "Set your name and password to begin:",
    link,
    "",
    "This link expires in 7 days. If you weren't expecting it, you can ignore this email.",
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your RIVERMINDSTYLE studio access</title>
  </head>
  <body style="margin:0;padding:0;background:#f0efed;">
    <div style="display:none;max-height:0;overflow:hidden;">Set your name and password to join the RIVERMINDSTYLE studio.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0efed;">
      <tr><td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#f7f6f4;">
          <tr><td style="padding:42px 36px 36px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:#8d7d83;">RIVERMINDSTYLE</p>
            <h1 style="margin:22px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;line-height:1.15;letter-spacing:-0.6px;color:#24231f;">You're invited to the studio.</h1>
            <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#77746d;">Set your name and password to begin. This link expires in 7 days.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;"><tr><td bgcolor="#3a2c32" style="background:#3a2c32;">
              <a href="${safeLink}" style="display:inline-block;padding:16px 28px;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;">Set up your studio</a>
            </td></tr></table>
            <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#96928b;">If you weren't expecting this invitation, you can ignore the email.</p>
          </td></tr>
          <tr><td align="center" style="padding:0 36px 28px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.8;color:#96928b;">© ${year} RIVERMINDSTYLE</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return {
    subject: "Your RIVERMINDSTYLE studio access",
    text,
    html,
  };
}

export async function sendAdminInvite({
  fetchImpl = fetch,
  apiKey,
  from,
  to,
  link,
}) {
  if (!apiKey || !from) throw new Error("Studio email is not configured.");
  const message = adminInviteMessage(link);
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
    }),
  });
  if (!response.ok) throw new Error("The invitation email could not be sent.");
}
