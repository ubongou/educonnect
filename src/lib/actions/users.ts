"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { adminProfileUpdateSchema } from "@/lib/validation";

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

/**
 * Admin-only: edit a parent's or teacher's name, phone, and email.
 *
 * Name and phone are plain `profiles` updates (RLS restricts writes to admins).
 * Email is special: it lives on `auth.users` (used for login) as well as
 * `profiles.email`. When it changes we go through the service-role admin API to
 * update the auth identity (email_confirm: true, so no re-verification email is
 * forced on an admin-managed account), then mirror it onto the profile row.
 */
export async function updateProfileAsAdmin(
  profileId: string,
  input: unknown,
): Promise<UserMutationResult> {
  await requireAdmin();

  const parsed = adminProfileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { full_name, phone, email } = parsed.data;

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();

  // Update the auth email only when it actually changed, via service role.
  if (current && (current.email ?? "") !== email) {
    const admin = createServiceRoleClient();
    const { error: authErr } = await admin.auth.admin.updateUserById(profileId, {
      email,
      email_confirm: true,
    });
    if (authErr) {
      return { ok: false, error: `Couldn't update email: ${authErr.message}` };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone: phone ?? null, email })
    .eq("id", profileId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/teachers/${profileId}`);
  revalidatePath(`/admin/parents/${profileId}`);
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/parents");
  return { ok: true };
}

/**
 * Admin-only: move a teacher's live workload onto another teacher. Reassigns
 * every approved enrollment and every still-scheduled session from one teacher
 * to another — used before deactivating a teacher mid-enrolment so their
 * students aren't orphaned. Completed/cancelled sessions keep their original
 * teacher so history stays truthful.
 */
export async function reassignTeacher(
  fromTeacherId: string,
  toTeacherId: string,
): Promise<UserMutationResult> {
  await requireAdmin();
  if (fromTeacherId === toTeacherId) {
    return { ok: false, error: "Pick a different teacher to reassign to." };
  }

  const supabase = await createClient();

  const { error: enrErr } = await supabase
    .from("enrollments")
    .update({ teacher_id: toTeacherId })
    .eq("teacher_id", fromTeacherId)
    .eq("status", "approved");
  if (enrErr) return { ok: false, error: enrErr.message };

  const { error: sessErr } = await supabase
    .from("sessions")
    .update({ teacher_id: toTeacherId })
    .eq("teacher_id", fromTeacherId)
    .eq("status", "scheduled");
  if (sessErr) return { ok: false, error: sessErr.message };

  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${fromTeacherId}`);
  revalidatePath(`/admin/teachers/${toTeacherId}`);
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin/schedule");
  return { ok: true };
}
