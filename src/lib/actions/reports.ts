"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendLessonReportEmail } from "@/lib/email/sendLessonReport";
import { sendExtraHomeworkEmail } from "@/lib/email/sendExtraHomework";
import { promoteStagedAttachments } from "@/lib/uploads/promote";
import { lessonReportSchema, lessonReportEditSchema } from "@/lib/validation";

/** Pulls a string[] of staged attachment ids out of a raw action payload. */
function readMaterialIds(input: unknown): string[] {
  const raw = (input as { material_ids?: unknown }).material_ids;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export type SubmitReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

export type UpdateReportResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Called from the teacher composer. Delegates to the create_lesson_report
 * RPC (SECURITY DEFINER) which:
 *   • verifies the caller is admin OR the session's assigned teacher
 *   • inserts the lesson_reports row + any lesson_report_skill_ratings
 *   • marks the linked session 'completed' and back-links lesson_report_id
 *
 * Input is validated client-side and here, but the DB CHECK constraints
 * (1..10 for understanding/confidence, 0..10 for behaviours + skills) are
 * the authoritative ceiling.
 */
export async function submitLessonReport(input: unknown): Promise<SubmitReportResult> {
  const parsed = lessonReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid report payload",
    };
  }

  // session_id is passed through to the RPC; schema doesn't require it so
  // pull it from the raw input if present. Omit the key entirely when
  // absent so the RPC's default (null) applies — the generated type typed
  // p_session_id as `string | undefined` and won't accept `null`.
  const raw = input as { session_id?: string };
  const sessionId = typeof raw.session_id === "string" ? raw.session_id : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_lesson_report", {
    p_student_id: parsed.data.student_id,
    p_subject_id: parsed.data.subject_id,
    p_lesson_date: parsed.data.lesson_date,
    p_duration_minutes: parsed.data.duration_minutes,
    p_lesson_focus: parsed.data.lesson_focus,
    p_understanding_check: parsed.data.understanding_check,
    p_confidence_level: parsed.data.confidence_level,
    p_lesson_highlights: parsed.data.lesson_highlights ?? "",
    p_participation: parsed.data.participation,
    p_focus_rating: parsed.data.focus_rating,
    p_homework: parsed.data.homework,
    p_next_focus: parsed.data.next_focus ?? "",
    p_how_to_help_at_home: parsed.data.how_to_help_at_home ?? "",
    p_skill_ratings: parsed.data.skill_ratings,
    p_session_id: sessionId,
    p_recording_url: parsed.data.recording_url || "",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const reportId = row?.id;
  if (!reportId) {
    return { ok: false, error: "Report created but no id returned" };
  }

  // Promote any staged composer attachments onto the new report BEFORE the
  // email fires, so they ride the report's single send.
  const materialIds = readMaterialIds(input);
  if (materialIds.length > 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await promoteStagedAttachments(supabase, {
        reportId,
        studentId: parsed.data.student_id,
        uploaderId: user.id,
        materialIds,
      });
    }
  }

  // Fire-and-log: a Resend hiccup must not roll back a saved report.
  // The /admin/reports page surfaces emailed_at status so a failed send
  // can be retried from the admin side.
  try {
    const sendResult = await sendLessonReportEmail(reportId);
    if (!sendResult.ok) {
      console.error("[lesson-report email] send failed:", sendResult.error);
    } else if (sendResult.skipped) {
      console.warn(
        `[lesson-report email] skipped for ${reportId}: ${sendResult.reason}`,
      );
    }
  } catch (err) {
    console.error("[lesson-report email] unexpected error:", err);
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/sessions");
  revalidatePath("/teacher/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/students/${parsed.data.student_id}`);

  return { ok: true, reportId };
}

/**
 * Admin-only edit of an existing report. Calls update_lesson_report
 * (SECURITY DEFINER) which verifies admin, swaps the row in place, and
 * replaces the skill ratings transactionally. Silent edit — no email
 * re-send.
 */
export async function updateLessonReport(
  reportId: string,
  input: unknown,
): Promise<UpdateReportResult> {
  const parsed = lessonReportEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid report payload",
    };
  }

  const supabase = await createClient();
  // RPC isn't in the generated db.ts yet (run `supabase gen types` post-
  // migration to regenerate). Until then call it via an untyped client.
  const { error } = await (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc("update_lesson_report", {
    p_report_id: reportId,
    p_lesson_date: parsed.data.lesson_date,
    p_duration_minutes: parsed.data.duration_minutes,
    p_lesson_focus: parsed.data.lesson_focus,
    p_understanding_check: parsed.data.understanding_check,
    p_confidence_level: parsed.data.confidence_level,
    p_lesson_highlights: parsed.data.lesson_highlights ?? "",
    p_participation: parsed.data.participation,
    p_focus_rating: parsed.data.focus_rating,
    p_homework: parsed.data.homework,
    p_next_focus: parsed.data.next_focus ?? "",
    p_how_to_help_at_home: parsed.data.how_to_help_at_home ?? "",
    p_skill_ratings: parsed.data.skill_ratings,
    p_recording_url: parsed.data.recording_url || "",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/reports/${reportId}`);
  revalidatePath("/teacher");
  revalidatePath(`/teacher/reports/${reportId}`);

  return { ok: true };
}

/**
 * Admin-only: soft-delete or restore a lesson report. A soft-deleted report
 * disappears from every parent/teacher/admin read surface and the charts, but
 * the row (and the session that links to it) stays put, so restore brings it
 * back exactly as it was. Writes go through lesson_reports_admin_write.
 */
export async function setReportDeleted(
  reportId: string,
  deleted: boolean,
): Promise<UpdateReportResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_reports")
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/teacher");
  return { ok: true };
}

/**
 * Attaches already-uploaded (staged) files to a report that has *already been
 * sent* — the "I forgot the homework" case. Promotes the staged rows onto the
 * report, and when `notify` is set, sends a short "extra homework added"
 * email (not a full report re-send). Used from the teacher report view.
 */
export async function addMaterialsToReport(
  reportId: string,
  materialIds: string[],
  notify: boolean,
): Promise<UpdateReportResult> {
  if (!reportId) return { ok: false, error: "Missing report id" };
  const ids = materialIds.filter(Boolean);
  if (ids.length === 0) return { ok: false, error: "No files to attach" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  // RLS lets the assigned teacher / admin read the report.
  const { data: report } = await supabase
    .from("lesson_reports")
    .select("id, student_id")
    .eq("id", reportId)
    .maybeSingle();
  if (!report) return { ok: false, error: "Report not found" };

  const promoted = await promoteStagedAttachments(supabase, {
    reportId,
    studentId: report.student_id,
    uploaderId: user.id,
    materialIds: ids,
  });
  if (promoted.length === 0) {
    return { ok: false, error: "No matching files to attach" };
  }

  if (notify) {
    try {
      await sendExtraHomeworkEmail(reportId, promoted);
    } catch (err) {
      console.error("[extra-homework email] unexpected error:", err);
    }
  }

  revalidatePath(`/teacher/reports/${reportId}`);
  revalidatePath(`/dashboard/reports/${reportId}`);
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/sessions");
  return { ok: true };
}
