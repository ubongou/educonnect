import { defaultGlobals } from "@/lib/marketing/defaults";
import { getAppUrl, getFromAddress, getResend } from "./client";

/**
 * Tells the admin about a Monnify payment the webhook couldn't settle on its
 * own — a short payment, money landing on a plan that was already paid or
 * voided, or a transfer that matches no invoice. The money is real in every
 * one of these cases, so someone has to look; this is how they find out
 * without watching the Monnify dashboard.
 *
 * Best-effort: skipped silently without RESEND_API_KEY. The event is in
 * `monnify_events` either way.
 */
export async function sendMonnifyAlertEmail(input: {
  subject: string;
  summary: string;
  fields: Array<[string, string | number | null | undefined]>;
}): Promise<void> {
  const resend = getResend();
  const adminEmail = defaultGlobals.adminEmail;
  if (!resend || !adminEmail) return;

  const rows = input.fields.filter(([, v]) => v !== null && v !== undefined && v !== "");
  const paymentsUrl = `${getAppUrl().replace(/\/$/, "")}/admin/payments`;

  const text = [
    input.summary,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Payments: ${paymentsUrl}`,
  ].join("\n");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#04131C;background:#FBF9F4;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #f5b7b1;border-radius:18px;padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">${esc(input.summary)}</p>
          <table style="border-collapse:collapse;font-size:14px;">
            ${rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:6px 16px 6px 0;color:#6b7680;vertical-align:top;width:180px;">${esc(k)}</td><td style="padding:6px 0;">${esc(String(v))}</td></tr>`,
              )
              .join("\n")}
          </table>
          <p style="margin:24px 0 0;"><a href="${esc(paymentsUrl)}" style="color:#2451E0;font-weight:600;">Open payments</a></p>
        </div>
      </body>
    </html>`;

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: adminEmail,
      subject: input.subject,
      html,
      text,
    });
  } catch {
    // Nothing further to fall back to — the event log still has it.
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
