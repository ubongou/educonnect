"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lessonReportSchema } from "@/lib/validation";

export type SubmitReportResult =
  | { ok: true; reportId: string }
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
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const reportId = row?.id;
  if (!reportId) {
    return { ok: false, error: "Report created but no id returned" };
  }

  revalidatePath("/teacher");
  revalidatePath("/teacher/sessions");
  revalidatePath("/teacher/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath(`/admin/students/${parsed.data.student_id}`);

  return { ok: true, reportId };
}
