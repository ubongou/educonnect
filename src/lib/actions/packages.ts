"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireTeacher } from "@/lib/auth";
import { sendPackageCompleteEmail } from "@/lib/email/sendPackageComplete";

/**
 * Teacher packages. Every rule (ownership, one package per lesson, size
 * limits, early-confirm notes) is enforced by the database functions in
 * 0038_teacher_packages.sql; these actions validate shape, call them, and
 * refresh the pages that show packages.
 */

export type PackageResult = { ok: true } | { ok: false; error: string };
export type PackageCreateResult = { ok: true; packageId: string } | { ok: false; error: string };

const uuid = z.string().uuid();
const note = z.string().max(2000).optional().nullable();
const size = z.coerce.number().int().min(1, "At least 1 lesson.").max(200, "At most 200 lessons.");

function revalidatePackages(packageId?: string) {
  revalidatePath("/teacher/packages");
  if (packageId) revalidatePath(`/teacher/packages/${packageId}`);
  revalidatePath("/teacher/students", "layout");
  revalidatePath("/admin/packages");
  revalidatePath("/admin/payments");
}

function fail(error: { message: string } | null | undefined, fallback: string) {
  return { ok: false as const, error: error?.message ?? fallback };
}

const createSchema = z.object({
  enrollment_id: uuid,
  size,
  note,
  session_ids: z.array(uuid).max(200),
});

export async function createPackage(input: unknown): Promise<PackageCreateResult> {
  await requireTeacher();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0], "Invalid input.");
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("teacher_package_create", {
    p_enrollment_id: d.enrollment_id,
    p_size: d.size,
    p_note: d.note ?? null,
    p_session_ids: d.session_ids,
  });
  if (error || !data) return fail(error, "Couldn't start the package.");

  revalidatePackages(data);
  return { ok: true, packageId: data };
}

export async function addPackageSessions(
  packageId: string,
  sessionIds: string[],
): Promise<PackageResult> {
  await requireTeacher();
  const parsed = z.object({ id: uuid, ids: z.array(uuid).min(1).max(200) }).safeParse({
    id: packageId,
    ids: sessionIds,
  });
  if (!parsed.success) return fail(parsed.error.issues[0], "Pick at least one lesson.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_package_add_sessions", {
    p_package_id: packageId,
    p_session_ids: sessionIds,
  });
  if (error) return fail(error, "Couldn't add those lessons.");

  revalidatePackages(packageId);
  return { ok: true };
}

export async function removePackageSession(
  packageId: string,
  sessionId: string,
): Promise<PackageResult> {
  await requireTeacher();
  if (!uuid.safeParse(packageId).success || !uuid.safeParse(sessionId).success) {
    return { ok: false, error: "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_package_remove_session", {
    p_package_id: packageId,
    p_session_id: sessionId,
  });
  if (error) return fail(error, "Couldn't remove that lesson.");

  revalidatePackages(packageId);
  return { ok: true };
}

export async function updatePackage(input: unknown): Promise<PackageResult> {
  await requireTeacher();
  const parsed = z.object({ package_id: uuid, size, note }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0], "Invalid input.");
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_package_update", {
    p_package_id: d.package_id,
    p_size: d.size,
    p_note: d.note ?? null,
  });
  if (error) return fail(error, "Couldn't save the package.");

  revalidatePackages(d.package_id);
  return { ok: true };
}

export async function confirmPackage(input: unknown): Promise<PackageResult> {
  await requireTeacher();
  const parsed = z.object({ package_id: uuid, note }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0], "Invalid input.");
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_package_confirm", {
    p_package_id: d.package_id,
    p_note: d.note ?? null,
  });
  if (error) return fail(error, "Couldn't confirm the package.");

  // After the write, and best-effort: a mail outage mustn't undo the confirm.
  try {
    await sendPackageCompleteEmail(d.package_id);
  } catch {
    // The package is on the admin page regardless.
  }

  revalidatePackages(d.package_id);
  return { ok: true };
}

export async function cancelPackage(packageId: string): Promise<PackageResult> {
  await requireTeacher();
  if (!uuid.safeParse(packageId).success) return { ok: false, error: "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_package_cancel", { p_package_id: packageId });
  if (error) return fail(error, "Couldn't cancel the package.");

  revalidatePackages();
  return { ok: true };
}

const reviewSchema = z.object({
  package_id: uuid,
  action: z.enum(["accept", "return"]),
  note,
});

export async function reviewPackage(input: unknown): Promise<PackageResult> {
  await requireAdmin();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0], "Invalid input.");
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_package_review", {
    p_package_id: d.package_id,
    p_action: d.action,
    p_note: d.note ?? null,
  });
  if (error) return fail(error, "Couldn't save the review.");

  revalidatePackages(d.package_id);
  return { ok: true };
}
