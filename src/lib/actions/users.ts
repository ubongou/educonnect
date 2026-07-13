"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { adminProfileUpdateSchema } from "@/lib/validation";
import type { ProfileCascade } from "@/lib/admin/profileCascade";

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

// -----------------------------------------------------------------------------
// Permanent deletion (teachers + parents)
// -----------------------------------------------------------------------------

type CountTable =
  | "sessions"
  | "lesson_reports"
  | "teacher_materials"
  | "lesson_report_messages"
  | "enrollments"
  | "student_documents";

async function cascadeForOne(
  admin: ReturnType<typeof createServiceRoleClient>,
  id: string,
): Promise<ProfileCascade> {
  const count = async (table: CountTable, col: string): Promise<number> => {
    const { count } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(col, id);
    return count ?? 0;
  };
  const [
    sessions,
    reports,
    materials,
    messages,
    enrollmentsAssigned,
    enrollmentsRequested,
    documents,
  ] = await Promise.all([
    count("sessions", "teacher_id"),
    count("lesson_reports", "uploaded_by"),
    count("teacher_materials", "uploaded_by"),
    count("lesson_report_messages", "author_id"),
    count("enrollments", "teacher_id"),
    count("enrollments", "requested_by"),
    count("student_documents", "uploaded_by"),
  ]);
  return {
    sessions,
    reports,
    materials,
    messages,
    enrollmentsAssigned,
    enrollmentsRequested,
    documents,
  };
}

/** Admin-only: cascade counts for a set of profiles, keyed by id. Used by the
 *  admin lists / detail pages to label the delete action (safe vs. force). */
export async function getProfileCascade(
  ids: string[],
): Promise<Record<string, ProfileCascade>> {
  await requireAdmin();
  if (ids.length === 0) return {};
  const admin = createServiceRoleClient();
  const entries = await Promise.all(
    ids.map(async (id) => [id, await cascadeForOne(admin, id)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * Admin-only: permanently delete a deactivated teacher or parent, including
 * their auth login. Two modes:
 *  - No history (test accounts): `auth.admin.deleteUser` cascades the profile.
 *  - `force` (has history): tear down the non-CASCADE references first (delete
 *    sessions/reports/materials/messages/documents + a parent's requested
 *    enrollments; null out teacher_id / decided_by / added_by), then delete the
 *    login. Irreversible — the UI gates this behind type-to-confirm on email.
 *
 * Guards: only `role in ('teacher','parent')` and only already-deactivated
 * accounts can be deleted, so an active account can never be removed here.
 */
export async function deleteProfile(
  profileId: string,
  force: boolean,
): Promise<UserMutationResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, deactivated_at")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Account not found." };
  if (profile.role !== "teacher" && profile.role !== "parent") {
    return { ok: false, error: "Only teacher or parent accounts can be deleted." };
  }
  if (profile.deactivated_at == null) {
    return { ok: false, error: "Deactivate the account before deleting it." };
  }

  const admin = createServiceRoleClient();

  if (force) {
    // Leaf-first teardown. Unified across roles — each statement simply affects
    // 0 rows when it doesn't apply, so running them all is safe.
    const steps: {
      label: string;
      run: () => Promise<{ message: string } | null>;
    }[] = [
      {
        label: "report messages",
        run: async () =>
          (await admin
            .from("lesson_report_messages")
            .delete()
            .eq("author_id", profileId)).error,
      },
      {
        label: "lesson reports",
        run: async () =>
          (await admin
            .from("lesson_reports")
            .delete()
            .eq("uploaded_by", profileId)).error,
      },
      {
        label: "sessions",
        run: async () =>
          (await admin.from("sessions").delete().eq("teacher_id", profileId))
            .error,
      },
      {
        label: "teacher materials",
        run: async () =>
          (await admin
            .from("teacher_materials")
            .delete()
            .eq("uploaded_by", profileId)).error,
      },
      {
        label: "uploaded documents",
        run: async () =>
          (await admin
            .from("student_documents")
            .delete()
            .eq("uploaded_by", profileId)).error,
      },
      {
        label: "requested enrollments",
        run: async () =>
          (await admin
            .from("enrollments")
            .delete()
            .eq("requested_by", profileId)).error,
      },
      {
        label: "enrollment assignments",
        run: async () =>
          (await admin
            .from("enrollments")
            .update({ teacher_id: null })
            .eq("teacher_id", profileId)).error,
      },
      {
        label: "enrollment approvals",
        run: async () =>
          (await admin
            .from("enrollments")
            .update({ decided_by: null })
            .eq("decided_by", profileId)).error,
      },
      {
        label: "student ownership",
        run: async () =>
          (await admin
            .from("students")
            .update({ added_by: null })
            .eq("added_by", profileId)).error,
      },
    ];
    for (const step of steps) {
      const err = await step.run();
      if (err) {
        return {
          ok: false,
          error: `Failed while removing ${step.label}: ${err.message}`,
        };
      }
    }
  }

  // Remove the login; the profiles row cascades from the auth.users deletion.
  // On the no-history path this is the whole operation. If unexpected
  // references remain, this errors and nothing has been lost.
  const { error: authErr } = await admin.auth.admin.deleteUser(profileId);
  if (authErr) {
    return {
      ok: false,
      error: force
        ? `Removed linked records but couldn't delete the login: ${authErr.message}`
        : "This account still has linked records — reopen the dialog to permanently remove everything.",
    };
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/parents");
  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  return { ok: true };
}
