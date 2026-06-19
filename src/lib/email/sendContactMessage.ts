import { getGlobals } from "@/lib/marketing/content";
import { getFromAddress, getResend } from "./client";

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type SendContactMessageResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Forwards a contact-form submission to the admin email pulled from the
 * `globals` CMS row. The visitor's email is set as `reply_to` so admins
 * can respond directly without copy-pasting. Mirrors the
 * RESEND_API_KEY-not-set fallthrough used by `sendLessonReportEmail` —
 * dev/preview deploys without the secret skip rather than fail.
 */
export async function sendContactMessage(
  input: ContactMessageInput,
): Promise<SendContactMessageResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: true, skipped: true, reason: "RESEND_API_KEY not set" };
  }

  const globals = getGlobals();
  const adminEmail = globals.adminEmail;
  if (!adminEmail) {
    return { ok: false, error: "Admin email not configured" };
  }

  const { html, text } = renderContactEmail(input);

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: adminEmail,
    replyTo: input.email,
    subject: `[Masani contact] ${input.subject}`,
    html,
    text,
  });

  if (error) {
    return {
      ok: false,
      error: error.message ?? "Resend send failed",
    };
  }
  return { ok: true, skipped: false };
}

// -----------------------------------------------------------------------------
// Plain-HTML / plain-text rendering — no template engine to keep this small.
// All user content is escaped before interpolation.
// -----------------------------------------------------------------------------

function renderContactEmail(input: ContactMessageInput): {
  html: string;
  text: string;
} {
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#04131C;background:#FBF9F4;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e3d6;border-radius:18px;padding:32px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6b7680;">Masani contact form</p>
          <h1 style="margin:0 0 20px;font-size:22px;line-height:1.2;color:#04131C;">${safeSubject}</h1>
          <table style="border-collapse:collapse;font-size:14px;color:#3a4750;">
            <tr><td style="padding:4px 12px 4px 0;color:#6b7680;">From</td><td style="padding:4px 0;">${safeName}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b7680;">Email</td><td style="padding:4px 0;"><a href="mailto:${safeEmail}" style="color:#3EBEFF;text-decoration:none;">${safeEmail}</a></td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e8e3d6;margin:20px 0;" />
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b7680;">Message</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#04131C;white-space:pre-wrap;">${safeMessage}</p>
          <hr style="border:none;border-top:1px solid #e8e3d6;margin:24px 0 16px;" />
          <p style="margin:0;font-size:12px;color:#6b7680;">Reply directly to this email — it will go to <strong>${safeName}</strong>.</p>
        </div>
      </body>
    </html>
  `.trim();

  const text = [
    "Masani contact form",
    "",
    `Subject: ${input.subject}`,
    `From:    ${input.name} <${input.email}>`,
    "",
    "Message:",
    input.message,
    "",
    `(Reply to this email to respond directly to ${input.name}.)`,
  ].join("\n");

  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
