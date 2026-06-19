"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sessionBulkCreateSchema,
  sessionCreateSchema,
  sessionImportSchema,
} from "@/lib/validation";

export type SessionMutationResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export type SimpleMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export type BulkSessionResult =
  | { ok: true; created: number }
  | { ok: false; error: string };

export type ImportSessionsResult =
  | { ok: true; imported: number; failed: Array<{ row: number; error: string }> }
  | { ok: false; error: string };

// teacher_id is typed non-null: loadSchedulableEnrollment only returns ok
// after asserting an approved enrollment with a teacher assigned.
type SchedulableEnrollment = {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  status: string;
};

/**
 * Shared guard for admin scheduling/import: an enrollment must exist, be
 * approved, and have a teacher assigned before any session can hang off it.
 */
async function loadSchedulableEnrollment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  enrollmentId: string,
): Promise<{ ok: true; enrollment: SchedulableEnrollment } | { ok: false; error: string }> {
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("id, student_id, subject_id, teacher_id, status")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (error || !enrollment) {
    return { ok: false, error: error?.message ?? "Enrollment not found" };
  }
  if (enrollment.status !== "approved") {
    return { ok: false, error: "Enrollment must be approved before scheduling." };
  }
  if (!enrollment.teacher_id) {
    return { ok: false, error: "Assign a teacher to the enrollment first." };
  }
  return { ok: true, enrollment: enrollment as SchedulableEnrollment };
}

/**
 * Admin schedules a one-off session against an approved enrollment.
 *
 * Reads the enrollment to derive student_id / subject_id / teacher_id so
 * the caller only has to pick the enrollment + when. Rejects if the
 * enrollment is not approved or has no teacher assigned — scheduling a
 * session for an unapproved or unassigned enrollment would be noise on the
 * parent / teacher views.
 */
export async function createSession(
  input: unknown,
): Promise<SessionMutationResult> {
  const parsed = sessionCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: enrollment, error: enrErr } = await supabase
    .from("enrollments")
    .select("id, student_id, subject_id, teacher_id, status")
    .eq("id", parsed.data.enrollment_id)
    .maybeSingle();
  if (enrErr || !enrollment) {
    return { ok: false, error: enrErr?.message ?? "Enrollment not found" };
  }
  if (enrollment.status !== "approved") {
    return { ok: false, error: "Enrollment must be approved before scheduling." };
  }
  if (!enrollment.teacher_id) {
    return { ok: false, error: "Assign a teacher to the enrollment first." };
  }

  const { data: session, error: sessErr } = await supabase
    .from("sessions")
    .insert({
      enrollment_id: enrollment.id,
      student_id: enrollment.student_id,
      subject_id: enrollment.subject_id,
      teacher_id: enrollment.teacher_id,
      scheduled_at: parsed.data.scheduled_at,
      duration_minutes: parsed.data.duration_minutes,
    })
    .select("id")
    .single();

  if (sessErr || !session) {
    return { ok: false, error: sessErr?.message ?? "Failed to schedule session" };
  }

  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath(`/admin/teachers/${enrollment.teacher_id}`);
  return { ok: true, sessionId: session.id };
}

export async function cancelSession(id: string): Promise<SimpleMutationResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function rescheduleSession(
  id: string,
  scheduledAt: string,
): Promise<SimpleMutationResult> {
  if (Number.isNaN(Date.parse(scheduledAt))) {
    return { ok: false, error: "Invalid timestamp" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ scheduled_at: scheduledAt, status: "scheduled" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  return { ok: true };
}

/**
 * Admin schedules several future sessions for one approved enrollment in a
 * single submit. Same guards as `createSession`, then one bulk insert.
 */
export async function createSessionsBulk(input: unknown): Promise<BulkSessionResult> {
  const parsed = sessionBulkCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const loaded = await loadSchedulableEnrollment(supabase, parsed.data.enrollment_id);
  if (!loaded.ok) return loaded;
  const { enrollment } = loaded;

  const rows = parsed.data.rows.map((r) => ({
    enrollment_id: enrollment.id,
    student_id: enrollment.student_id,
    subject_id: enrollment.subject_id,
    teacher_id: enrollment.teacher_id,
    scheduled_at: r.scheduled_at,
    duration_minutes: r.duration_minutes,
  }));

  const { data: inserted, error } = await supabase
    .from("sessions")
    .insert(rows)
    .select("id");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath(`/admin/teachers/${enrollment.teacher_id}`);
  return { ok: true, created: inserted?.length ?? rows.length };
}

/**
 * Admin bulk-imports past sessions for one approved enrollment, each as a
 * completed session carrying a full lesson report. For every row we:
 *   1. insert a back-dated session row, then
 *   2. call the create_lesson_report RPC with that session id — the RPC marks
 *      the session 'completed' and back-links the report.
 * No parent email is sent (these are historical). Rows are processed
 * independently so a bad row doesn't abort the batch; a failed report deletes
 * its orphan session so no stray 'scheduled' rows remain.
 */
export async function importPastSessions(input: unknown): Promise<ImportSessionsResult> {
  const parsed = sessionImportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const loaded = await loadSchedulableEnrollment(supabase, parsed.data.enrollment_id);
  if (!loaded.ok) return loaded;
  const { enrollment } = loaded;

  const failed: Array<{ row: number; error: string }> = [];
  let imported = 0;

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const r = parsed.data.rows[i];

    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .insert({
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        subject_id: enrollment.subject_id,
        teacher_id: enrollment.teacher_id,
        // Noon UTC keeps the calendar date stable across timezones.
        scheduled_at: `${r.lesson_date}T12:00:00Z`,
        duration_minutes: r.duration_minutes,
      })
      .select("id")
      .single();

    if (sessErr || !session) {
      failed.push({ row: i + 1, error: sessErr?.message ?? "Failed to create session" });
      continue;
    }

    const { error: rpcErr } = await supabase.rpc("create_lesson_report", {
      p_student_id: enrollment.student_id,
      p_subject_id: enrollment.subject_id,
      p_lesson_date: r.lesson_date,
      p_duration_minutes: r.duration_minutes,
      p_lesson_focus: r.lesson_focus,
      p_understanding_check: r.understanding_check,
      p_confidence_level: r.confidence_level,
      p_lesson_highlights: r.lesson_highlights ?? "",
      p_participation: r.participation,
      p_focus_rating: r.focus_rating,
      p_homework: r.homework,
      p_next_focus: r.next_focus ?? "",
      p_how_to_help_at_home: r.how_to_help_at_home ?? "",
      p_skill_ratings: [],
      p_session_id: session.id,
    });

    if (rpcErr) {
      // Don't leave an orphaned 'scheduled' session behind a failed report.
      await supabase.from("sessions").delete().eq("id", session.id);
      failed.push({ row: i + 1, error: rpcErr.message });
      continue;
    }

    imported++;
  }

  revalidatePath("/admin/schedule");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath(`/admin/students/${enrollment.student_id}`);
  return { ok: true, imported, failed };
}
