import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAppUrl, getFromAddress, getResend } from "./client";
import {
  renderLessonReportEmail,
  type LessonReportEmailData,
  type ReportAttachment,
} from "./templates/lessonReport";
import { materialKindLabel } from "@/lib/uploads/labels";

export type SendLessonReportResult =
  | { ok: true; recipients: string[]; skipped: false }
  | { ok: true; recipients: string[]; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Loads a lesson report by id (service-role, RLS-bypass) and emails every
 * parent linked to the student. Stamps `lesson_reports.emailed_at` on
 * success. Returns ok:true with `skipped:true` when RESEND_API_KEY isn't
 * configured or the report has no parent recipients — those are not errors,
 * just no-ops the caller can log.
 */
export async function sendLessonReportEmail(
  reportId: string,
): Promise<SendLessonReportResult> {
  const supabase = createServiceRoleClient();

  const { data: report, error: reportErr } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, lesson_date, lesson_focus, lesson_highlights,
      understanding_check, confidence_level,
      participation, focus_rating, homework,
      next_focus, how_to_help_at_home, recording_url,
      student_id,
      students ( full_name, preferred_name ),
      subjects ( name ),
      uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name )
      `,
    )
    .eq("id", reportId)
    .maybeSingle();

  if (reportErr || !report) {
    return { ok: false, error: reportErr?.message ?? "Report not found" };
  }

  const { data: parents, error: parentsErr } = await supabase
    .from("parent_students")
    .select(
      `
      parent:profiles!parent_students_parent_id_fkey ( id, full_name, email )
      `,
    )
    .eq("student_id", report.student_id);

  if (parentsErr) {
    return { ok: false, error: parentsErr.message };
  }

  type ParentRow = {
    parent: { id: string; full_name: string | null; email: string | null } | null;
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
      reason: "No parent emails on file for this student",
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
  const subjectRow = report.subjects as { name: string } | null;
  const teacherRow = report.uploader as { full_name: string | null } | null;

  const studentName =
    studentRow?.preferred_name?.trim() || studentRow?.full_name || "your child";
  const subjectName = subjectRow?.name ?? "Lesson";
  const teacherName = teacherRow?.full_name ?? null;

  const appUrl = getAppUrl().replace(/\/$/, "");
  // Include the child so multi-child parents land on the right tab and the
  // report loads directly (the Sessions page also resolves this defensively).
  const reportUrl = `${appUrl}/dashboard/sessions?child=${report.student_id}&report=${report.id}`;

  // Files attached to this report (homework workbooks, resources). Only
  // promoted (ready) rows are included — staged composer files that were never
  // sent are excluded.
  const { data: attachmentRows } = await supabase
    .from("teacher_materials")
    .select("id, kind, original_filename, link_url")
    .eq("lesson_report_id", report.id)
    .eq("status", "ready")
    .order("uploaded_at", { ascending: true });

  const attachments: ReportAttachment[] = (
    (attachmentRows ?? []) as {
      id: string;
      kind: string;
      original_filename: string;
      link_url: string | null;
    }[]
  ).map((a) => ({
    filename: a.original_filename,
    kindLabel: materialKindLabel(a.kind),
    // Link attachments point straight at the quiz; files go through the
    // authenticated download endpoint.
    url:
      a.link_url ??
      `${appUrl}/api/teacher-materials/${a.id}/download?disposition=attachment`,
    isHomework: a.kind === "homework",
  }));

  let allOk = true;
  let firstError: string | null = null;
  const sentTo: string[] = [];

  for (const r of recipients) {
    const data: LessonReportEmailData = {
      parentFirstName: r.fullName?.split(/\s+/)[0] ?? null,
      studentName,
      subjectName,
      teacherName,
      lessonDate: report.lesson_date,
      lessonFocus: report.lesson_focus,
      lessonHighlights: report.lesson_highlights,
      understanding: report.understanding_check,
      confidence: report.confidence_level,
      participation: report.participation,
      focus: report.focus_rating,
      homework: report.homework,
      nextFocus: report.next_focus,
      howToHelpAtHome: report.how_to_help_at_home,
      recordingUrl: report.recording_url,
      reportUrl,
      attachments,
    };

    const { subject, html, text } = renderLessonReportEmail(data);

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

  if (sentTo.length > 0) {
    await supabase
      .from("lesson_reports")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", reportId);
  }

  if (!allOk && sentTo.length === 0) {
    return { ok: false, error: firstError ?? "All sends failed" };
  }

  return { ok: true, recipients: sentTo, skipped: false };
}
