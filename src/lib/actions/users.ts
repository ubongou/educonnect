"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type UserMutationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Admin-only: deactivate or reactivate a parent or teacher profile.
 *
 * We don't hard-delete because lesson_reports.uploaded_by, sessions.teacher_id,
 * and student_documents.uploaded_by are non-CASCADE FKs to profiles — deletion
 * would either fail or cascade through enrollments and erase history. The
 * login action gates `deactivated_at IS NOT NULL` so a soft-deactivated user
 * can no longer sign in, but their past records keep rendering correctly.
 */
export async function setProfileActive(
  profileId: string,
  active: boolean,
): Promise<UserMutationResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${profileId}`);
  revalidatePath("/admin/parents");
  revalidatePath("/admin/enrollments");
  return { ok: true };
}
