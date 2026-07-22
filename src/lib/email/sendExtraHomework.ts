import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAppUrl, getFromAddress, getResend } from "./client";
import { materialKindLabel } from "@/lib/uploads/labels";

export type SendExtraHomeworkResult =
  | { ok: true; recipients: string[]; skipped: false }
  | { ok: true; recipients: string[]; skipped: true; reason: string }
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Sent when a teacher attaches files to an *already-sent* lesson report and
 * opts to notify — a short "extra homework added" note, not a full report
 * re-send. Loads via service-role and emails every parent of the student.
 */
export async function sendExtraHomeworkEmail(
  reportId: string,
  materialIds: string[],
): Promise<SendExtraHomeworkResult> {
  const supabase = createServiceRoleClient();

  const { data: report, error: reportErr } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, lesson_date, student_id,
      students ( full_name, preferred_name ),
      uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name )
      `,
    )
    .eq("id", reportId)
    .maybeSingle();

  if (reportErr || !report) {
    return { ok: false, error: reportErr?.message ?? "Report not found" };
  }

  const { data: mats } = await supabase
    .from("teacher_materials")
    .select("id, kind, original_filename, link_url")
    .in("id", materialIds)
    .eq("lesson_report_id", reportId)
    .eq("status", "ready");

  const files = (mats ?? []) as {
    id: string;
    kind: string;
    original_filename: string;
    link_url: string | null;
  }[];
  if (files.length === 0) {
    return { ok: true, recipients: [], skipped: true, reason: "No files" };
  }

  const { data: parents, error: parentsErr } = await supabase
    .from("parent_students")
    .select(
      `parent:profiles!parent_students_parent_id_fkey ( full_name, email )`,
    )
    .eq("student_id", report.student_id);
  if (parentsErr) return { ok: false, error: parentsErr.message };

  type ParentRow = {
    parent: { full_name: string | null; email: string | null } | null;
  };
  const recipients = ((parents ?? []) as unknown as ParentRow[])
    .map((p) => p.parent)
    .filter((p): p is NonNullable<ParentRow["parent"]> => Boolean(p?.email))
    .map((p) => ({ email: p.email!, fullName: p.full_name }));

  if (recipients.length === 0) {
    return {
      ok: true,
      recipients: [],
      skipped: true,
      reason: "No parent emails on file",
    };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: true,
      recipients: recipients.map((r) => r.email),
      skipped: true,
      reason: "RESEND_API_KEY not set",
    };
  }

  const studentRow = report.students as
    | { full_name: string; preferred_name: string | null }
    | null;
  const teacherRow = report.uploader as { full_name: string | null } | null;
  const studentName =
    studentRow?.preferred_name?.trim() || studentRow?.full_name || "your child";
  const teacher = teacherRow?.full_name ?? "Your child's teacher";

  const appUrl = getAppUrl().replace(/\/$/, "");
  const reportUrl = `${appUrl}/dashboard/sessions?report=${reportId}`;
  // Link attachments point straight at the quiz; files go through the
  // authenticated download endpoint.
  const hrefFor = (f: (typeof files)[number]) =>
    f.link_url ??
    `${appUrl}/api/teacher-materials/${f.id}/download?disposition=attachment`;

  const fileListHtml = files
    .map(
      (f) =>
        `<tr><td style="padding:8px 0;border-top:1px solid #EEF1F4;">
           <span style="display:inline-block;padding:3px 9px;border-radius:99px;background:#FAEEDA;color:#854F0B;font:700 10px Arial,sans-serif;">${escapeHtml(materialKindLabel(f.kind))}</span>
           <a href="${escapeHtml(hrefFor(f))}" style="margin-left:8px;font:700 14px Arial,sans-serif;color:#0C7CC4;text-decoration:underline;">${escapeHtml(f.original_filename)}</a>
         </td></tr>`,
    )
    .join("");

  let allOk = true;
  let firstError: string | null = null;
  const sentTo: string[] = [];

  for (const r of recipients) {
    const greeting = r.fullName
      ? `Hi ${escapeHtml(r.fullName.split(/\s+/)[0])},`
      : "Hi,";
    const subject = `New homework added — ${studentName}`;
    const html = `<!doctype html><html><body style="margin:0;background:#F6F7F9;font-family:Arial,sans-serif;color:${BRAND_NAVY};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px;"><tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;">
          <tr><td style="background:${BRAND_NAVY};height:6px;line-height:0;font-size:0;">&nbsp;</td></tr>
          <tr><td style="padding:26px 28px;">
            <p style="margin:0 0 12px;font:400 15px Arial,sans-serif;">${greeting}</p>
            <p style="margin:0 0 6px;font:400 15px Arial,sans-serif;line-height:1.6;color:#3A4750;">
              ${escapeHtml(teacher)} added more homework to ${escapeHtml(studentName)}'s ${escapeHtml(fmtDate(report.lesson_date))} lesson report:
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fileListHtml}</table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td>
              <a href="${reportUrl}" style="display:inline-block;background:${BRAND_BLUE};color:${BRAND_NAVY};font:800 13px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:99px;border:2px solid ${BRAND_NAVY};">Open the report</a>
            </td></tr></table>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
    const text = [
      greeting,
      "",
      `${teacher} added more homework to ${studentName}'s ${fmtDate(report.lesson_date)} lesson report:`,
      ...files.map(
        (f) => `  • ${f.original_filename} (${materialKindLabel(f.kind)}) — ${hrefFor(f)}`,
      ),
      "",
      `Open the report: ${reportUrl}`,
      "",
      "— Masani",
    ].join("\n");

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: r.email,
      subject,
      html,
      text,
    });
    if (error) {
      allOk = false;
      firstError ??= error.message ?? "Resend send failed";
      continue;
    }
    sentTo.push(r.email);
  }

  if (!allOk && sentTo.length === 0) {
    return { ok: false, error: firstError ?? "All sends failed" };
  }
  return { ok: true, recipients: sentTo, skipped: false };
}
