import { getGlobals } from "@/lib/marketing/content";
import { getFromAddress, getResend } from "./client";
import {
  curriculumLabel,
  formatSource,
  performanceLabel,
  subjectLabel,
  type BookingRequestInput,
} from "@/lib/booking/schema";

export type SendBookingRequestResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Forwards a booking-form submission to the admin email pulled from the
 * `globals` CMS row. The parent's email is set as `reply_to` so admins
 * can respond directly. Mirrors `sendContactMessage` — RESEND_API_KEY
 * absent => skipped (the row is already saved in `booking_requests`,
 * so a missing key just means no email).
 */
export async function sendBookingRequestEmail(
  input: BookingRequestInput,
): Promise<SendBookingRequestResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: true, skipped: true, reason: "RESEND_API_KEY not set" };
  }

  const globals = getGlobals();
  const adminEmail = globals.adminEmail;
  if (!adminEmail) {
    return { ok: false, error: "Admin email not configured" };
  }

  const sourceLabel = formatSource(input.source);
  const { html, text } = render(input, sourceLabel);

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: adminEmail,
    replyTo: input.parent_email,
    subject: `[masani booking] ${input.child_name} — ${subjectLabel[input.subject]} (${sourceLabel})`,
    html,
    text,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Resend send failed" };
  }
  return { ok: true, skipped: false };
}

// -----------------------------------------------------------------------------
// Plain HTML / text rendering — no template engine. All user content escaped.
// -----------------------------------------------------------------------------

function render(
  i: BookingRequestInput,
  sourceLabel: string,
): { html: string; text: string } {
  const curriculum =
    i.curriculum === "other"
      ? `${curriculumLabel.other} — ${i.curriculum_other}`
      : curriculumLabel[i.curriculum];

  const fields: Array<[string, string]> = [
    ["Source", sourceLabel],
    ["Child's name", i.child_name],
    ["Age", String(i.child_age)],
    ["Class / grade", i.child_grade],
    ["Curriculum", curriculum],
    ["Subject", subjectLabel[i.subject]],
    ["Performance", performanceLabel[i.current_performance]],
    ["Learning needs", i.learning_needs],
    ["Concerns", i.concerns || "(none provided)"],
    ["Parent's name", i.parent_name],
    ["Parent's phone (WhatsApp)", i.parent_phone],
    ["Parent's email", i.parent_email],
  ];

  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6b7680;vertical-align:top;width:160px;">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap;">${esc(v).replace(/\n/g, "<br />")}</td></tr>`,
    )
    .join("\n");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#04131C;background:#FBF9F4;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e8e3d6;border-radius:18px;padding:32px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6b7680;">masani booking request</p>
          <h1 style="margin:0 0 20px;font-size:22px;line-height:1.2;color:#04131C;">${esc(i.child_name)} — trial ${esc(subjectLabel[i.subject])}</h1>
          <table style="border-collapse:collapse;font-size:14px;color:#3a4750;">${rows}</table>
          <hr style="border:none;border-top:1px solid #e8e3d6;margin:24px 0 16px;" />
          <p style="margin:0;font-size:12px;color:#6b7680;">Reply directly to this email to respond to <strong>${esc(i.parent_name)}</strong>.</p>
        </div>
      </body>
    </html>
  `.trim();

  const text = [
    "masani booking request",
    "",
    ...fields.map(([k, v]) => `${k}: ${v}`),
    "",
    `(Reply to this email to respond directly to ${i.parent_name}.)`,
  ].join("\n");

  return { html, text };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
