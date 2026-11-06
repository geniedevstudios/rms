export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) =>
  `GH₵ ${Number(value || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const consultationMail = (kind) =>
  kind === "consultation" ||
  kind === "consultation-confirmed" ||
  kind === "consultation-rescheduled";
function appointmentWhen(record, withTime) {
  const value = withTime ? record.scheduledAt : record.appointment;
  if (!value) return "";
  const day = String(value).slice(0, 10);
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return "";
  const stamp = new Date(
    Date.UTC(
      year,
      month - 1,
      date,
      withTime ? Number(String(value).slice(11, 13)) || 0 : 12,
      withTime ? Number(String(value).slice(14, 16)) || 0 : 0,
    ),
  );
  return new Intl.DateTimeFormat("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" } : { timeZone: "UTC" }),
  }).format(stamp);
}
const paragraph = (value) =>
  `<p style="margin:14px 0 0;font:14px/1.7 Arial,Helvetica,sans-serif;color:#77746d;">${escapeHtml(value)}</p>`;
export function notificationMessage(
  kind,
  record,
  audience,
  config,
  imageSources = [],
) {
  const admin = audience === "admin";
  const titles = {
    order: ["Your next chapter, confirmed.", "A new paid order."],
    consultation: [
      "A conversation starts here.",
      "A new consultation request.",
    ],
    "consultation-confirmed": ["Your day is confirmed.", "An appointment was confirmed."],
    "consultation-rescheduled": ["Your appointment has a new day.", "An appointment was rescheduled."],
    abandoned: ["Still on your mind?", "A selection left behind."],
    failed: ["Let’s make it yours.", "A payment needs attention."],
    interrupted: [
      "Your checkout is still open.",
      "A checkout was interrupted.",
    ],
  };
  const title = titles[kind][admin ? 1 : 0];
  const detail = {
    order:
      "Your payment is confirmed. Your considered pieces are now in our hands, ready for their next chapter.",
    consultation:
      "Your payment of GH₵ 300 is confirmed. The day you asked for is with the studio. This is not yet a confirmed appointment. The studio may reschedule this day based on availability, and will email you when it is confirmed or if it needs to move.",
    "consultation-confirmed":
      "Your appointment is confirmed. The time on the day you asked for is below.",
    "consultation-rescheduled":
      "The studio has moved your appointment based on availability. The new day and time are below.",
    abandoned:
      "The pieces you chose are waiting. Return when you’re ready; we’ll check current prices and availability when you do.",
    failed:
      "Paystack reported this payment attempt as unsuccessful. Return to your bag to try again, or reply for help. If your bank shows a debit, please contact us before retrying.",
    interrupted:
      "Checkout closed before we could confirm your payment. Your selection is saved. If you completed payment or your bank shows a debit, please wait for confirmation or reply for help before trying again.",
  }[kind];
  const adminDetail = {
    order:
      "A verified payment has been received. The pieces and delivery details are below.",
    consultation: "A customer has paid for a consultation and chosen a day.",
    "consultation-confirmed": "The appointment day was confirmed.",
    "consultation-rescheduled": "The appointment was moved.",
    abandoned: "This checkout has been inactive for 24 hours.",
    failed: "Paystack reports this payment attempt as failed.",
    interrupted:
      "The customer closed checkout or reported an interruption. Payment is not confirmed; this is not a verified payment failure.",
  }[kind];
  const eyebrow = {
    order: "YOUR RMS ORDER",
    consultation: "MADE FOR YOU",
    "consultation-confirmed": "YOUR APPOINTMENT",
    "consultation-rescheduled": "YOUR APPOINTMENT",
    abandoned: "YOUR CONSIDERED SELECTION",
    failed: "A LITTLE HELP WITH CHECKOUT",
    interrupted: "HERE WHEN YOU’RE READY",
  }[kind];
  const base = config.storefrontUrl.replace(/\/$/, "");
  const link = admin
    ? `${config.adminUrl.replace(/\/$/, "")}/#/${kind === "consultation" ? "consultations" : kind === "order" ? "orders" : "overview"}`
    : kind === "order"
      ? `${base}/#/orders`
      : consultationMail(kind)
        ? `${base}/#/custom`
        : `${base}/#/checkout?recovery=${encodeURIComponent(record.token)}`;
  const cta = admin
    ? "OPEN THE STUDIO"
    : kind === "order"
      ? "VIEW YOUR ORDERS"
      : consultationMail(kind)
        ? "EXPLORE CUSTOM"
        : "RETURN TO YOUR BAG";
  const optout =
    !admin && kind === "abandoned"
      ? `${base}/#/checkout?stopReminder=${encodeURIComponent(record.token)}`
      : "";
  const lines = [
    admin
      ? `Customer: ${record.name || "Customer"} · ${record.email}`
      : `Hello ${record.name || "there"},`,
    admin ? adminDetail : detail,
  ];
  if (record.id) lines.push(`Reference: ${record.id}`);
  if (consultationMail(kind)) {
    const when = appointmentWhen(record, kind !== "consultation" && Boolean(record.scheduledAt));
    const whenLabel =
      kind === "consultation-rescheduled" ? "New time" : record.scheduledAt ? "Time" : "Day";
    lines.push(
      `Service: ${record.service}`,
      `Meeting: ${record.meeting}`,
      ...(when ? [`${whenLabel}: ${when}`] : []),
      ...(record.vision ? [`Your vision: ${record.vision}`] : []),
    );
  }
  const products = (record.items || [])
    .map((item, index) => {
      lines.push(
        `${item.name || item.productId} · ${item.color ? `${item.color} · ` : ""}Size ${item.size} · Qty ${item.quantity} · ${money(item.price * item.quantity)}`,
      );
      const src = imageSources[index];
      return `<tr><td style="padding:20px 0;border-bottom:1px solid #eee8e3;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${src ? `<td width="112" valign="top"><img src="${escapeHtml(src)}" alt="${escapeHtml(item.name || item.productId)}" width="112" style="display:block;width:112px;max-width:112px;height:auto;border:0;" /></td>` : ""}<td valign="middle" style="padding-left:${src ? "20" : "0"}px;"><p style="margin:0;font:normal 22px/1.25 Georgia,'Times New Roman',serif;color:#34272d;">${escapeHtml(item.name || item.productId)}</p><p style="margin:10px 0 0;font:11px/1.8 Arial,sans-serif;letter-spacing:1px;color:#8a7d80;">${item.color ? `${escapeHtml(item.color)} &nbsp; / &nbsp; ` : ""}SIZE ${escapeHtml(item.size)} &nbsp; / &nbsp; QTY ${item.quantity}</p><p style="margin:14px 0 0;font:14px Arial,sans-serif;color:#4c2938;">${money(item.price * item.quantity)}</p></td></tr></table></td></tr>`;
    })
    .join("");
  let details = "";
  if (consultationMail(kind)) {
    const when = appointmentWhen(record, kind !== "consultation" && Boolean(record.scheduledAt));
    const whenLabel =
      kind === "consultation-rescheduled" ? "New time" : record.scheduledAt ? "Time" : "Day";
    details = `<div style="margin-top:26px;padding:22px;background:#f7f6f4;text-align:left;">${when ? paragraph(`${whenLabel}: ${when}`) : ""}${paragraph(`Service: ${record.service}`)}${paragraph(`Meeting: ${record.meeting}`)}${record.vision ? paragraph(record.vision) : ""}</div>`;
  }
  if (kind === "order") {
    if (record.discount) lines.push(`Subtotal: ${money(record.subtotal)}`, `Discount (${record.promoCode}): −${money(record.discount)}`);
    lines.push(`Total paid: ${money(record.total)}`);
    const address = [
      record.address?.street,
      record.address?.city,
      record.address?.country,
    ]
      .filter(Boolean)
      .join(", ");
    if (address) lines.push(`Deliver to: ${address}`);
    details = `<table role="presentation" width="100%" style="margin-top:22px;"><tr><td style="font:12px Arial;color:#77746d;">TOTAL PAID</td><td align="right" style="font:24px Georgia;color:#4c2938;">${money(record.total)}</td></tr></table>${address ? `<div style="margin-top:24px;padding:20px;background:#f7f6f4;text-align:left;"><p style="margin:0;font:9px Arial;letter-spacing:2px;color:#8a7d80;">DELIVER TO</p>${paragraph(record.name)}${paragraph(address)}${record.note ? paragraph(`Note: ${record.note}`) : ""}</div>` : ""}`;
  }
  if (kind === "order" && record.discount)
    details = paragraph(`Subtotal: ${money(record.subtotal)} · Discount (${record.promoCode}): −${money(record.discount)}`) + details;
  if (admin && record.phone) lines.push(`Phone: ${record.phone}`);
  const subject =
    kind === "order"
      ? `RIVERMINDSTYLE · ${admin ? "New paid order" : "Order confirmed"} ${record.id}`
      : `RIVERMINDSTYLE · ${title}`;
  return {
    subject,
    text: [
      "RIVERMINDSTYLE",
      title,
      ...lines,
      `${cta}: ${link}`,
      ...(optout ? [`Stop cart reminders: ${optout}`] : []),
    ].join("\n\n"),
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title><style>@media only screen and (max-width:480px){.email-shell{padding:0!important}.hero,.hero-link{height:200px!important}.gutter{width:16px!important}.panel-padding{padding:0 18px 32px!important}.headline{font-size:28px!important}}</style></head><body style="margin:0;padding:0;background:#f0efed;"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(admin ? adminDetail : detail)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0efed;"><tr><td align="center" class="email-shell" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#f7f6f4;">
<tr><td class="hero" height="240" align="center" valign="middle" background="cid:invitation-hero" bgcolor="#ecd8d7" role="img" aria-label="RIVERMINDSTYLE" style="height:240px;background-color:#ecd8d7;background-image:url('cid:invitation-hero');background-position:center;background-size:cover;background-repeat:no-repeat;">
<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:240px;"><v:fill type="frame" src="cid:invitation-hero" color="#ecd8d7" aspect="atleast" /><v:textbox inset="0,0,0,0"><![endif]--><a href="${escapeHtml(base)}" aria-label="RIVERMINDSTYLE website" class="hero-link" style="display:block;height:240px;text-decoration:none;">&nbsp;</a><!--[if gte mso 9]></v:textbox></v:rect><![endif]--></td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="gutter" width="28" bgcolor="#ecd8d7">&nbsp;</td><td height="32" bgcolor="#ffffff">&nbsp;</td><td class="gutter" width="28" bgcolor="#ecd8d7">&nbsp;</td></tr><tr><td class="gutter" width="28">&nbsp;</td><td class="panel-padding" bgcolor="#ffffff" style="padding:0 32px 40px;">
<p style="margin:0;font:9px Arial,sans-serif;font-weight:bold;letter-spacing:3px;text-align:center;color:#555149;">${eyebrow}</p><h1 class="headline" style="margin:12px 0 0;font:normal 34px/1.15 Georgia,'Times New Roman',serif;letter-spacing:-1px;color:#24231f;text-align:center;">${escapeHtml(title)}</h1><div style="text-align:center;">${paragraph(admin ? adminDetail : detail)}${paragraph(admin ? `${record.name || "Customer"} · ${record.email}${record.phone ? " · " + record.phone : ""}` : `Hello ${record.name || "there"},`)}${record.id ? `<p style="margin:20px 0 4px;font:10px Arial;letter-spacing:1.5px;color:#88847a;">${escapeHtml(record.id)}</p>` : ""}</div>
${products ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">${products}</table>` : ""}${details}
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 0;"><tr><td align="center" bgcolor="#4c2938"><a href="${escapeHtml(link)}" style="display:inline-block;padding:16px 32px;border:1px solid #4c2938;color:#fff;text-decoration:none;font:10px Arial;letter-spacing:2px;">${cta}</a></td></tr></table><p style="margin:22px 0 0;font:12px/1.7 Arial;color:#96928b;text-align:center;">${admin ? "A note from your RMS studio." : "Questions? Reply to this email. We’re here to help."}</p>${optout ? `<p style="text-align:center"><a href="${escapeHtml(optout)}" style="font:11px Arial;color:#88717c;">Stop cart reminders</a></p>` : ""}</td><td class="gutter" width="28">&nbsp;</td></tr></table></td></tr>
<tr><td align="center" style="padding:32px 24px 0;font:16px/1.5 Georgia;color:#77746d;">Rooted in identity. Open to the world.</td></tr><tr><td align="center" style="padding:14px 24px 0;font:11px/1.6 Arial;color:#96928b;">Connect with us<br><a href="https://www.instagram.com/rivermindstyle_/" style="color:#77746d;text-decoration:none;">@rivermindstyle_</a></td></tr><tr><td align="center" style="padding:24px 40px 28px;"><div style="border-top:1px solid #dedbd5;padding-top:18px;font:10px/1.8 Arial;color:#96928b;">© ${new Date().getFullYear()} RIVERMINDSTYLE. All rights reserved.<br><a href="${escapeHtml(base)}" style="color:#77746d;text-decoration:none;">rivermindstyle.com</a></div></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`,
  };
}

export function verificationMessage({ name, code, storefrontUrl }) {
  const base = String(storefrontUrl || "https://rivermindstyle.com").replace(/\/$/, "");
  const safeName = name || "there";
  const detail = "Enter this 6-digit code to finish creating your RMS. It expires in 15 minutes.";
  const subject = "RIVERMINDSTYLE · Your verification code";
  return {
    subject,
    text: ["RIVERMINDSTYLE", "Confirm it's you.", `Hello ${safeName},`, detail, `Code: ${code}`, `Website: ${base}`].join("\n\n"),
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title><style>@media only screen and (max-width:480px){.email-shell{padding:0!important}.hero,.hero-link{height:200px!important}.gutter{width:16px!important}.panel-padding{padding:0 18px 32px!important}.headline{font-size:28px!important}}</style></head><body style="margin:0;padding:0;background:#f0efed;"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(detail)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0efed;"><tr><td align="center" class="email-shell" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#f7f6f4;">
<tr><td class="hero" height="240" align="center" valign="middle" background="cid:invitation-hero" bgcolor="#ecd8d7" role="img" aria-label="RIVERMINDSTYLE" style="height:240px;background-color:#ecd8d7;background-image:url('cid:invitation-hero');background-position:center;background-size:cover;background-repeat:no-repeat;">
<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:240px;"><v:fill type="frame" src="cid:invitation-hero" color="#ecd8d7" aspect="atleast" /><v:textbox inset="0,0,0,0"><![endif]--><a href="${escapeHtml(base)}" aria-label="RIVERMINDSTYLE website" class="hero-link" style="display:block;height:240px;text-decoration:none;">&nbsp;</a><!--[if gte mso 9]></v:textbox></v:rect><![endif]--></td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="gutter" width="28" bgcolor="#ecd8d7">&nbsp;</td><td height="32" bgcolor="#ffffff">&nbsp;</td><td class="gutter" width="28" bgcolor="#ecd8d7">&nbsp;</td></tr><tr><td class="gutter" width="28">&nbsp;</td><td class="panel-padding" bgcolor="#ffffff" style="padding:0 32px 40px;">
<p style="margin:0;font:9px Arial,sans-serif;font-weight:bold;letter-spacing:3px;text-align:center;color:#555149;">YOUR RMS</p><h1 class="headline" style="margin:12px 0 0;font:normal 34px/1.15 Georgia,'Times New Roman',serif;letter-spacing:-1px;color:#24231f;text-align:center;">Confirm it's you.</h1><div style="text-align:center;">${paragraph(detail)}${paragraph(`Hello ${safeName},`)}<p style="margin:28px 0 0;font:32px/1 Georgia,'Times New Roman',serif;letter-spacing:10px;text-align:center;color:#24231f;">${escapeHtml(code)}</p></div>
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 0;"><tr><td align="center" bgcolor="#4c2938"><a href="${escapeHtml(base)}" style="display:inline-block;padding:16px 32px;border:1px solid #4c2938;color:#fff;text-decoration:none;font:10px Arial;letter-spacing:2px;">VISIT RIVERMINDSTYLE</a></td></tr></table><p style="margin:22px 0 0;font:12px/1.7 Arial;color:#96928b;text-align:center;">Questions? Reply to this email. We’re here to help.</p></td><td class="gutter" width="28">&nbsp;</td></tr></table></td></tr>
<tr><td align="center" style="padding:32px 24px 0;font:16px/1.5 Georgia;color:#77746d;">Rooted in identity. Open to the world.</td></tr><tr><td align="center" style="padding:14px 24px 0;font:11px/1.6 Arial;color:#96928b;">Connect with us<br><a href="https://www.instagram.com/rivermindstyle_/" style="color:#77746d;text-decoration:none;">@rivermindstyle_</a></td></tr><tr><td align="center" style="padding:24px 40px 28px;"><div style="border-top:1px solid #dedbd5;padding-top:18px;font:10px/1.8 Arial;color:#96928b;">© ${new Date().getFullYear()} RIVERMINDSTYLE. All rights reserved.<br><a href="${escapeHtml(base)}" style="color:#77746d;text-decoration:none;">rivermindstyle.com</a></div></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`,
  };
}
