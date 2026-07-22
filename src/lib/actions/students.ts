"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { adminStudentCreateSchema, childInfoSchema } from "@/lib/validation";

export type StudentMutationResult =
  | { ok: true; studentId: string }
  | { ok: false; error: string };

export type SimpleStudentResult = { ok: true } | { ok: false; error: string };

/**
 * Admin-only: create a student directly via the admin_create_student RPC
 * (generates the registration number, optionally links an existing parent).
 * Intake starts empty — the questionnaire is filled by the parent or edited
 * later.
 */
export async function createStudentAsAdmin(
  input: unknown,
): Promise<StudentMutationResult> {
  await requireAdmin();

  const parsed = adminStudentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_create_student", {
    p_full_name: v.full_name,
    p_preferred_name: v.preferred_name ?? "",
    p_age: v.age,
    p_gender: v.gender,
    p_current_school: v.current_school ?? "",
    p_curriculum: v.curriculum,
    p_curriculum_other: v.curriculum_other ?? "",
    p_parent_id: v.parent_id ?? null,
  });

  if (error) return { ok: false, error: error.message };
  const student = Array.isArray(data) ? data[0] : data;
  if (!student?.id) return { ok: false, error: "Student not created" };

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  if (v.parent_id) revalidatePath(`/admin/parents/${v.parent_id}`);
  return { ok: true, studentId: student.id };
}

/**
 * Admin-only: edit a student's core profile fields (the child-info block —
 * name, age, school, curriculum). The intake questionnaire JSON is not touched
 * here. Writes go through the students_admin_write RLS policy.
 */
export async function updateStudent(
  studentId: string,
  input: unknown,
): Promise<SimpleStudentResult> {
  await requireAdmin();

  const parsed = childInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      full_name: v.full_name,
      preferred_name: v.preferred_name ?? null,
      age: v.age,
      gender: v.gender,
      current_school: v.current_school ?? null,
      curriculum: v.curriculum,
      curriculum_other: v.curriculum_other ?? null,
    })
    .eq("id", studentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  return { ok: true };
}

/**
 * Admin-only: archive or restore a student. Archiving is the soft-delete path —
 * the student drops out of parent dashboards and the active admin list but
 * keeps every enrollment, session, report, and document.
 */
export async function setStudentArchived(
  studentId: string,
  archived: boolean,
): Promise<SimpleStudentResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", studentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  return { ok: true };
}

/**
 * Admin-only: mark a student as a test account (or unmark it). Test students
 * stay fully usable — they just drop out of the "active real students" count on
 * the admin overview, so a QA/demo account doesn't inflate the real numbers.
 */
export async function setStudentTest(
  studentId: string,
  isTest: boolean,
): Promise<SimpleStudentResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ is_test: isTest })
    .eq("id", studentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Admin-only: link an existing parent account to an existing student. Students
 * are only linked to a parent at creation time (create_student_with_intake for
 * the parent self-serve path, admin_create_student's p_parent_id for the admin
 * one), so this is the after-the-fact repair path — and the only way to give a
 * student a second parent.
 *
 * Writes straight to parent_students through the parent_students_admin_write
 * policy; no RPC needed. Re-linking an already-linked parent is a no-op rather
 * than a primary-key error.
 */
export async function linkParentToStudent(
  studentId: string,
  parentId: string,
): Promise<SimpleStudentResult> {
  await requireAdmin();

  const supabase = await createClient();

  // The picker only lists parents, but the id arrives from the client — guard
  // against linking a teacher or admin profile, which every downstream RLS
  // policy would then treat as this student's parent.
  const { data: parent } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parentId)
    .eq("role", "parent")
    .maybeSingle();

  if (!parent) return { ok: false, error: "No parent account with that id" };

  const { error } = await supabase
    .from("parent_students")
    .upsert(
      { parent_id: parentId, student_id: studentId },
      { onConflict: "parent_id,student_id", ignoreDuplicates: true },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/parents/${parentId}`);
  return { ok: true };
}

/**
 * Admin-only: remove a parent's link to a student. This revokes the parent's
 * access to the child's reports, sessions, and documents — every parent-facing
 * RLS policy keys off parent_students — but destroys no records itself.
 */
export async function unlinkParentFromStudent(
  studentId: string,
  parentId: string,
): Promise<SimpleStudentResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("parent_students")
    .delete()
    .eq("student_id", studentId)
    .eq("parent_id", parentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/parents/${parentId}`);
  return { ok: true };
}

/**
 * Admin-only: permanently delete a student and everything that hangs off them.
 * The students FKs are ON DELETE CASCADE, so this also removes parent links,
 * intake files, enrollments, sessions, lesson reports (+ skill ratings), and
 * uploaded documents. Irreversible — the UI gates this behind type-to-confirm.
 * Storage objects in R2 are not swept here (orphaned keys are harmless).
 */
export async function deleteStudent(
  studentId: string,
): Promise<SimpleStudentResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { ok: true };
}
