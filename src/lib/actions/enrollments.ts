"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EnrollmentRequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function requestEnrollments(
  studentId: string,
  subjectIds: string[],
): Promise<EnrollmentRequestResult> {
  if (subjectIds.length === 0) {
    return { ok: false, error: "Pick at least one subject to request." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const rows = subjectIds.map((subject_id) => ({
    student_id: studentId,
    subject_id,
    requested_by: user.id,
  }));

  // The (student_id, subject_id) unique index dedupes; ignoreDuplicates keeps
  // the existing row's status rather than silently re-opening a closed one.
  const { error } = await supabase
    .from("enrollments")
    .upsert(rows, { onConflict: "student_id,subject_id", ignoreDuplicates: true });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/children/${studentId}`);
  return { ok: true };
}

export type EnrollmentDecision = "approved" | "rejected";

/**
 * Admin-only: approve or reject a pending enrollment. RLS restricts writes on
 * the `enrollments` table to admin profiles, so a non-admin caller gets a
 * benign "not found" error from PostgREST rather than a security bypass.
 *
 * Approval may include a teacher assignment in the same click so parents
 * stop seeing "pending" the moment the admin has picked someone. Rejection
 * clears teacher_id if one was previously assigned.
 */
export async function decideEnrollment(
  id: string,
  decision: EnrollmentDecision,
  teacherId?: string | null,
): Promise<EnrollmentRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const patch: {
    status: EnrollmentDecision;
    decided_by: string;
    decided_at: string;
    teacher_id?: string | null;
  } = {
    status: decision,
    decided_by: user.id,
    decided_at: new Date().toISOString(),
  };

  if (decision === "approved") {
    patch.teacher_id = teacherId ?? null;
  } else {
    patch.teacher_id = null;
  }

  const { error } = await supabase.from("enrollments").update(patch).eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  if (teacherId) revalidatePath(`/admin/teachers/${teacherId}`);
  return { ok: true };
}

/**
 * Admin-only: (re)assign the teacher on an already-decided enrollment.
 * Set `teacherId` to null to unassign. RLS restricts writes on
 * `enrollments` to admins, so non-admin callers get a benign error.
 */
export async function assignEnrollmentTeacher(
  enrollmentId: string,
  teacherId: string | null,
): Promise<EnrollmentRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const { data: previous } = await supabase
    .from("enrollments")
    .select("teacher_id, student_id")
    .eq("id", enrollmentId)
    .single();

  const { error } = await supabase
    .from("enrollments")
    .update({ teacher_id: teacherId })
    .eq("id", enrollmentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  if (previous?.student_id) {
    revalidatePath(`/admin/students/${previous.student_id}`);
  }
  if (previous?.teacher_id) revalidatePath(`/admin/teachers/${previous.teacher_id}`);
  if (teacherId) revalidatePath(`/admin/teachers/${teacherId}`);
  return { ok: true };
}
