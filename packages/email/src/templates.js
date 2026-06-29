export function buildOtpEmailHtml({ title, greeting, otp, ttlMinutes, footer }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f2;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0e0f0c;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(14,15,12,0.08);border-radius:20px;overflow:hidden;box-shadow:0 18px 48px -28px rgba(14,15,12,0.28);">
            <tr>
              <td style="padding:28px 28px 8px;">
                <div style="display:inline-block;width:40px;height:40px;border-radius:12px;background:#0e0f0c;"></div>
                <p style="margin:16px 0 0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#868685;">Finboard</p>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.03em;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#454745;">${greeting}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;">
                <div style="border-radius:16px;background:linear-gradient(135deg,#e2f6d5 0%,#f7fcf2 100%);border:1px solid rgba(159,232,112,0.35);padding:20px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#054d28;">Your verification code</p>
                  <p style="margin:0;font-size:36px;line-height:1;font-weight:800;letter-spacing:0.28em;color:#163300;">${otp}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#868685;">This code expires in ${ttlMinutes} minutes. If you did not request it, you can safely ignore this email.</p>
                ${footer ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#868685;">${footer}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildNotificationEmailHtml({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f6f2;color:#0e0f0c;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;border:1px solid rgba(14,15,12,0.08);padding:28px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#868685;">Finboard</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${title}</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#454745;">${body}</p>
    </div>
  </body>
</html>`;
}
