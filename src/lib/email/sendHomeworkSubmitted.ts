import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAppUrl, getFromAddress, getResend } from "./client";

export type SendHomeworkSubmittedResult =
  | { ok: true; recipient: string | null; skipped: boolean; reason?: string }
  | { ok: false; error: string };

const BRAND_NAVY = "#04131C";
const BRAND_BLUE = "#3EBEFF";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notifies the assigned teacher that a parent has submitted completed homework
 * against a lesson report. Loads via service-role and emails the enrollment's
 * teacher. Best-effort: missing teacher email / Resend key are skips, not
 * errors.
 */
export async function sendHomeworkSubmittedEmail(
  documentId: string,
): Promise<SendHomeworkSubmittedResult> {
  const supabase = createServiceRoleClient();

  const { data: doc, error } = await supabase
    .from("student_documents")
    .select(
      `
      id, original_filename, submission_text, student_id, lesson_report_id,
      students ( full_name, preferred_name ),
      enrollments ( teacher:profiles!enrollments_teacher_id_fkey ( full_name, email ) )
      `,
    )
    .eq("id", documentId)
    .maybeSingle();

  if (error || !doc) {
    return { ok: false, error: error?.message ?? "Submission not found" };
  }

  const teacher = (
    doc.enrollments as { teacher: { full_name: string | null; email: string | null } | null } | null
  )?.teacher;
  if (!teacher?.email) {
    return { ok: true, recipient: null, skipped: true, reason: "No teacher email" };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: true,
      recipient: teacher.email,
      skipped: true,
      reason: "RESEND_API_KEY not set",
    };
  }

  const studentRow = doc.students as
    | { full_name: string; preferred_name: string | null }
    | null;
  const studentName =
    studentRow?.preferred_name?.trim() || studentRow?.full_name || "a student";

  const appUrl = getAppUrl().replace(/\/$/, "");
  const link = doc.lesson_report_id
    ? `${appUrl}/teacher/reports/${doc.lesson_report_id}`
    : `${appUrl}/teacher/students/${doc.student_id}`;

  // A submission is either an uploaded file or a typed answer. Describe whichever
  // it is (trimming a long written answer to a preview).
  const descriptor = doc.submission_text
    ? `a written answer — "${doc.submission_text.slice(0, 140)}${
        doc.submission_text.length > 140 ? "…" : ""
      }"`
    : (doc.original_filename ?? "completed homework");

  const greeting = teacher.full_name
    ? `Hi ${escapeHtml(teacher.full_name.split(/\s+/)[0])},`
    : "Hi,";
  const subject = `${studentName} submitted homework`;
  const html = `<!doctype html><html><body style="margin:0;background:#F6F7F9;font-family:Arial,sans-serif;color:${BRAND_NAVY};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px;"><tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;">
        <tr><td style="background:${BRAND_NAVY};height:6px;line-height:0;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 28px;">
          <p style="margin:0 0 12px;font:400 15px Arial,sans-serif;">${greeting}</p>
          <p style="margin:0 0 16px;font:400 15px Arial,sans-serif;line-height:1.6;color:#3A4750;">
            ${escapeHtml(studentName)}'s parent just submitted completed homework:
            <strong>${escapeHtml(descriptor)}</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
            <a href="${link}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:800 13px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:99px;border:2px solid ${BRAND_NAVY};">Review it</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  const text = [
    greeting,
    "",
    `${studentName}'s parent just submitted completed homework: ${descriptor}.`,
    "",
    `Review it: ${link}`,
    "",
    "— Masani",
  ].join("\n");

  const { error: sendErr } = await resend.emails.send({
    from: getFromAddress(),
    to: teacher.email,
    subject,
    html,
    text,
  });
  if (sendErr) {
    return { ok: false, error: sendErr.message ?? "Resend send failed" };
  }
  return { ok: true, recipient: teacher.email, skipped: false };
}
