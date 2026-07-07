import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAppUrl, getFromAddress, getResend } from "./client";

export type SendReportMessageResult =
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

function firstName(name: string | null): string {
  const n = name?.trim().split(/\s+/)[0];
  return n ? escapeHtml(n) : "";
}

type MessageRow = {
  id: string;
  body: string;
  lesson_report_id: string;
  author: { full_name: string | null; role: string } | null;
  report: {
    student_id: string;
    subject_id: string;
    students: { full_name: string; preferred_name: string | null } | null;
  } | null;
};

/**
 * Notifies the *other side* of a report thread when a new message lands:
 * a parent's message emails the assigned teacher; a teacher's message emails
 * the parent. Admin messages notify nobody (by design). Best-effort — a
 * missing recipient email or absent Resend key is a skip, not an error.
 */
export async function sendReportMessageEmail(
  messageId: string,
): Promise<SendReportMessageResult> {
  const supabase = createServiceRoleClient();

  const { data: msg, error } = await supabase
    .from("lesson_report_messages")
    .select(
      `
      id, body, lesson_report_id,
      author:profiles!lesson_report_messages_author_id_fkey ( full_name, role ),
      report:lesson_reports!lesson_report_messages_lesson_report_id_fkey (
        student_id, subject_id,
        students ( full_name, preferred_name )
      )
      `,
    )
    .eq("id", messageId)
    .maybeSingle();

  if (error || !msg) {
    return { ok: false, error: error?.message ?? "Message not found" };
  }

  const message = msg as unknown as MessageRow;
  const authorRole = message.author?.role;
  const report = message.report;
  if (!report) {
    return { ok: true, recipient: null, skipped: true, reason: "Report not found" };
  }

  const studentName =
    report.students?.preferred_name?.trim() ||
    report.students?.full_name ||
    "your student";

  // Resolve the recipient based on who wrote the message.
  type Contact = { full_name: string | null; email: string | null };
  let recipient: Contact | null = null;
  let audience: "teacher" | "parent";
  let portal: "teacher" | "dashboard";

  if (authorRole === "parent") {
    audience = "teacher";
    portal = "teacher";
    const { data: enr } = await supabase
      .from("enrollments")
      .select(
        `teacher:profiles!enrollments_teacher_id_fkey ( full_name, email )`,
      )
      .eq("student_id", report.student_id)
      .eq("subject_id", report.subject_id)
      .eq("status", "approved")
      .maybeSingle();
    recipient = (enr as { teacher: Contact | null } | null)?.teacher ?? null;
  } else if (authorRole === "teacher") {
    audience = "parent";
    portal = "dashboard";
    const { data: ps } = await supabase
      .from("parent_students")
      .select(`parent:profiles!parent_students_parent_id_fkey ( full_name, email )`)
      .eq("student_id", report.student_id)
      .maybeSingle();
    recipient = (ps as { parent: Contact | null } | null)?.parent ?? null;
  } else {
    // Admin (or unknown) messages don't notify anyone.
    return { ok: true, recipient: null, skipped: true, reason: "Author is not parent/teacher" };
  }

  if (!recipient?.email) {
    return {
      ok: true,
      recipient: null,
      skipped: true,
      reason: `No ${audience} email on file`,
    };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: true,
      recipient: recipient.email,
      skipped: true,
      reason: "RESEND_API_KEY not set",
    };
  }

  const authorName = firstName(message.author?.full_name ?? null);
  const senderLabel =
    audience === "teacher"
      ? `${escapeHtml(studentName)}'s parent`
      : authorName
        ? `${authorName} (${escapeHtml(studentName)}'s teacher)`
        : `${escapeHtml(studentName)}'s teacher`;

  const appUrl = getAppUrl().replace(/\/$/, "");
  const link = `${appUrl}/${portal}/reports/${message.lesson_report_id}`;

  const greeting = recipient.full_name
    ? `Hi ${firstName(recipient.full_name)},`
    : "Hi,";
  const subject =
    audience === "teacher"
      ? `New message about ${studentName}`
      : `New message from ${studentName}'s teacher`;

  const preview = escapeHtml(
    message.body.length > 240 ? `${message.body.slice(0, 240)}…` : message.body,
  );

  const html = `<!doctype html><html><body style="margin:0;background:#F6F7F9;font-family:Arial,sans-serif;color:${BRAND_NAVY};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px;"><tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;">
        <tr><td style="background:${BRAND_NAVY};height:6px;line-height:0;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 28px;">
          <p style="margin:0 0 12px;font:400 15px Arial,sans-serif;">${greeting}</p>
          <p style="margin:0 0 16px;font:400 15px Arial,sans-serif;line-height:1.6;color:#3A4750;">
            ${senderLabel} left a message on the lesson report:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
            <tr><td style="border-left:3px solid ${BRAND_BLUE};background:#F6F7F9;border-radius:6px;padding:12px 16px;font:400 14px Arial,sans-serif;line-height:1.6;color:${BRAND_NAVY};white-space:pre-wrap;">${preview}</td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
            <a href="${link}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:800 13px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:99px;border:2px solid ${BRAND_NAVY};">View &amp; reply</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  const text = [
    greeting,
    "",
    `${senderLabel.replace(/&#39;/g, "'")} left a message on the lesson report:`,
    "",
    message.body,
    "",
    `View & reply: ${link}`,
    "",
    "— Masani",
  ].join("\n");

  const { error: sendErr } = await resend.emails.send({
    from: getFromAddress(),
    to: recipient.email,
    subject,
    html,
    text,
  });
  if (sendErr) {
    return { ok: false, error: sendErr.message ?? "Resend send failed" };
  }
  return { ok: true, recipient: recipient.email, skipped: false };
}
