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
 */
export async function decideEnrollment(
  id: string,
  decision: EnrollmentDecision,
): Promise<EnrollmentRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const { error } = await supabase
    .from("enrollments")
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  return { ok: true };
}
