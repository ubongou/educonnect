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
