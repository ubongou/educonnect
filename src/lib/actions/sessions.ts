"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sessionBulkCreateSchema,
  sessionCreateSchema,
  sessionImportSchema,
} from "@/lib/validation";

// Sessions are date-only (migrations 0019/0020). Every write sets `session_date`
// (a YYYY-MM-DD calendar day) and leaves the legacy `scheduled_at` timestamp
// null; it is preserved on historical rows only and dropped in a later slice.
const SESSION_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
      session_date: parsed.data.session_date,
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

const SESSION_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;

export type SessionPatch = {
  session_date?: string;
  duration_minutes?: number;
  teacher_id?: string;
  status?: string;
};

/**
 * Admin-only: edit a scheduled session — move its date, change duration,
 * reassign the teacher, or set its status. Only the provided fields are
 * written. Admin writes go through sessions_admin_write (FOR ALL).
 */
export async function updateSession(
  id: string,
  patch: SessionPatch,
): Promise<SimpleMutationResult> {
  const update: {
    session_date?: string;
    duration_minutes?: number;
    teacher_id?: string;
    status?: string;
  } = {};

  if (patch.session_date !== undefined) {
    if (!SESSION_DATE_RE.test(patch.session_date)) {
      return { ok: false, error: "Expected a YYYY-MM-DD date" };
    }
    update.session_date = patch.session_date;
  }
  if (patch.duration_minutes !== undefined) {
    const d = patch.duration_minutes;
    if (!Number.isInteger(d) || d < 15 || d > 240) {
      return { ok: false, error: "Duration must be 15–240 minutes." };
    }
    update.duration_minutes = d;
  }
  if (patch.teacher_id !== undefined) {
    update.teacher_id = patch.teacher_id;
  }
  if (patch.status !== undefined) {
    if (!SESSION_STATUSES.includes(patch.status as (typeof SESSION_STATUSES)[number])) {
      return { ok: false, error: "Invalid session status." };
    }
    update.status = patch.status;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("sessions")
    .select("teacher_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("sessions").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  if (previous?.teacher_id) revalidatePath(`/admin/teachers/${previous.teacher_id}`);
  if (typeof update.teacher_id === "string") {
    revalidatePath(`/admin/teachers/${update.teacher_id}`);
  }
  return { ok: true };
}

/**
 * Teacher (or admin): record attendance on a session — mark a 'no_show' or
 * revert to 'scheduled'. Goes through the set_session_attendance RPC, which
 * checks the caller is the assigned teacher or an admin. 'completed' is not an
 * attendance state here — that's set when the teacher files the lesson report.
 */
export async function setSessionAttendance(
  sessionId: string,
  status: "scheduled" | "no_show",
): Promise<SimpleMutationResult> {
  if (status !== "scheduled" && status !== "no_show") {
    return { ok: false, error: "Invalid attendance status." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_session_attendance", {
    p_session_id: sessionId,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/teacher/sessions");
  revalidatePath("/teacher");
  revalidatePath("/admin/schedule");
  return { ok: true };
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
  sessionDate: string,
): Promise<SimpleMutationResult> {
  if (!SESSION_DATE_RE.test(sessionDate)) {
    return { ok: false, error: "Expected a YYYY-MM-DD date" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ session_date: sessionDate, status: "scheduled" })
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
    session_date: r.session_date,
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
        session_date: r.lesson_date,
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
