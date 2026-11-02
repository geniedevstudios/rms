// Table layout and attached PNGs keep the website's card details usable in email.
export const finishes = {
  obsidian: {
    label: "Obsidian",
    background: "#1a1c18",
    gradient:
      "linear-gradient(125deg,#464740 0%,#252722 35%,#11130f 75%,#35382f 100%)",
    color: "#dbd3b9",
    border: "#6f6f5e",
    ring: "#c3bca0",
  },
  pearl: {
    label: "Pearl",
    background: "#e4dfd2",
    gradient:
      "linear-gradient(125deg,#f1eee3 0%,#cecabb 45%,#e8e4d7 73%,#b8b5a7 100%)",
    color: "#575344",
    border: "#bdb8a6",
    ring: "#5d584a",
  },
};

export function accessCard({ name, tone }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;background-color:${tone.background};background-image:${tone.gradient};border:1px solid ${tone.border};border-radius:18px;color:${tone.color};">
    <tr><td class="card-padding" style="padding:30px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;color:${tone.color};">
        <tr>
          <td width="55%" valign="top">
            <div class="card-brand" style="font-family:Georgia,'Times New Roman',serif;font-size:46px;line-height:46px;letter-spacing:-2px;">RMS</div>
            <div class="card-wordmark" style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:6px;letter-spacing:2.4px;">RIVERMINDSTYLE</div>
          </td>
          <td align="right" valign="top" style="padding-top:3px;font-family:Arial,Helvetica,sans-serif;font-size:7px;line-height:2.1;letter-spacing:1.5px;">THE INNER CIRCLE<br /><span style="font-size:6px;">ACCESS CARD</span></td>
        </tr>
        <tr><td colspan="2" class="card-chip-row" style="padding-top:25px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td><img class="card-chip" src="cid:card-chip" alt="Card chip" width="42" height="33" style="display:block;border:0;" /></td>
            <td style="padding-left:13px;"><img src="cid:card-contactless" alt="Contactless" width="17" height="25" style="display:block;border:0;" /></td>
          </tr></table>
        </td></tr>
        <tr>
          <td class="card-access" style="padding-top:17px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;">PRIVATE ACCESS</td>
          <td align="right" class="card-access" style="padding-top:17px;font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;">RMS / 001</td>
        </tr>
        <tr>
          <td class="card-bottom" valign="bottom" style="padding-top:40px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:6px;letter-spacing:2px;">RESERVED FOR</div>
            <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.6;letter-spacing:1.5px;overflow-wrap:anywhere;word-break:break-word;">${name}</div>
          </td>
          <td align="right" valign="bottom" class="card-bottom" style="padding-top:40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
              <td width="30" height="30" align="center" style="border:1px solid ${tone.ring};border-radius:50%;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:30px;color:${tone.color};">R</td>
              <td style="padding-left:8px;font-family:Arial,Helvetica,sans-serif;font-size:6px;line-height:1.7;letter-spacing:1.2px;color:${tone.color};">MEMBER<br />ACCESS</td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}
