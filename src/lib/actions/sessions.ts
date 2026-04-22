"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sessionCreateSchema } from "@/lib/validation";

export type SessionMutationResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export type SimpleMutationResult =
  | { ok: true }
  | { ok: false; error: string };

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
