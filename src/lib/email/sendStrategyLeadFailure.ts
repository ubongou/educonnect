import { getGlobals } from "@/lib/marketing/content";
import { getFromAddress, getResend } from "./client";
import {
  formatSource,
  formatSubjects,
  ageRangeLabel,
  schoolLevelLabel,
  tutoredBeforeLabel,
  timelineLabel,
  type StrategyLeadInput,
} from "@/lib/strategy/schema";

export type SendStrategyLeadFailureResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Safety net for the strategy-session form: only called when BOTH exports
 * (Google Sheets + Zoho CRM) failed for a submission. Emails the admin the
 * full lead so it isn't lost. RESEND_API_KEY absent => skipped (nothing else
 * we can do — this path only runs when the other sinks already failed).
 */
export async function sendStrategyLeadFailureEmail(
  input: StrategyLeadInput,
  errors: string[],
): Promise<SendStrategyLeadFailureResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: true, skipped: true, reason: "RESEND_API_KEY not set" };
  }

  const adminEmail = getGlobals().adminEmail;
  if (!adminEmail) {
    return { ok: false, error: "Admin email not configured" };
  }

  const fields: Array<[string, string]> = [
    ["Source", formatSource(input.source)],
    ["Full name", input.parent_name],
    ["Email", input.parent_email],
    ["Phone", input.parent_phone],
    ["Country", input.country],
    ["Child's age", ageRangeLabel[input.child_age_range]],
    ["School level", schoolLevelLabel[input.school_level]],
    ["Tutored before", tutoredBeforeLabel[input.tutored_before]],
    ["Timeline", timelineLabel[input.timeline]],
    ["Subjects", formatSubjects(input)],
  ];

  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6b7680;vertical-align:top;width:160px;">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap;">${esc(v)}</td></tr>`,
    )
    .join("\n");

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#04131C;background:#FBF9F4;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #f5b7b1;border-radius:18px;padding:32px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a83a2a;">Strategy session lead — export failed</p>
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.2;color:#04131C;">${esc(input.parent_name)}</h1>
          <p style="margin:0 0 20px;font-size:13px;color:#a83a2a;">Both Google Sheets and Zoho CRM writes failed for this submission — logged here so the lead isn't lost. Please add it manually.</p>
          <table style="border-collapse:collapse;font-size:14px;color:#3a4750;">${rows}</table>
          <hr style="border:none;border-top:1px solid #e8e3d6;margin:24px 0 16px;" />
          <p style="margin:0;font-size:12px;color:#6b7680;">Export errors:<br />${errors.map((e) => esc(e)).join("<br />")}</p>
        </div>
      </body>
    </html>
  `.trim();

  const text = [
    "Strategy session lead — export failed",
    "Both Google Sheets and Zoho CRM writes failed. Add this lead manually.",
    "",
    ...fields.map(([k, v]) => `${k}: ${v}`),
    "",
    "Export errors:",
    ...errors,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: adminEmail,
    replyTo: input.parent_email,
    subject: `[Masani strategy lead — EXPORT FAILED] ${input.parent_name}`,
    html,
    text,
  });

  if (error) {
    return { ok: false, error: error.message ?? "Resend send failed" };
  }
  return { ok: true, skipped: false };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
