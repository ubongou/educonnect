"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteR2Object, presignPut } from "@/lib/r2/objects";
import {
  teacherMaterialPolicy,
  validateUpload,
} from "@/lib/uploads/policies";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type TeacherMaterialKind =
  | "lesson_material"
  | "homework"
  | "demo_video"
  | "photo"
  | "other";

export type RequestUploadResult =
  | { ok: true; materialId: string; presignedPutUrl: string; storageKey: string }
  | { ok: false; error: string };

export type ConfirmResult = { ok: true } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

const allowedKinds = [
  "lesson_material",
  "homework",
  "demo_video",
  "photo",
  "other",
] as const satisfies readonly TeacherMaterialKind[];

const requestSchema = z.object({
  studentId: z.string().uuid("Invalid student id"),
  kind: z.enum(allowedKinds, { message: "Pick a valid kind" }),
  mimeType: z.string().min(1, "Missing MIME type"),
  sizeBytes: z.number().int().positive(),
  originalFilename: z.string().min(1).max(255),
});
export type RequestUploadInput = z.infer<typeof requestSchema>;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function pickExtension(filename: string, mime: string): string {
  const fromName = filename.includes(".") ? filename.split(".").pop()! : "";
  if (fromName) return fromName.toLowerCase().slice(0, 8);
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "video/mp4") return "mp4";
  return "bin";
}

function randomSuffix(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function safeKindSlug(kind: string): string {
  return kind.replace(/[^a-z0-9_-]+/gi, "").slice(0, 32) || "material";
}

/**
 * Fetches the caller's profile + role. Returns null when signed out.
 * Used by every action below to drive auth + scope checks.
 */
async function getCurrentRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return { supabase, userId: user.id, role: profile.role as string };
}

/**
 * Confirms the caller has an approved enrollment with the given student.
 * Admins always pass. Non-admin/non-teacher roles always fail.
 */
async function assertCanUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string,
  studentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (role === "admin") return { ok: true };
  if (role !== "teacher") return { ok: false, error: "Not authorised" };

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("teacher_id", userId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    return {
      ok: false,
      error: "No approved enrollment with this student.",
    };
  }
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

/**
 * Step 1 of 3 in the teacher upload flow: insert a `pending` metadata row
 * and return a presigned PUT URL the browser will upload bytes to.
 */
export async function requestTeacherMaterialUpload(
  raw: unknown,
): Promise<RequestUploadResult> {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const policyCheck = validateUpload(teacherMaterialPolicy, {
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!policyCheck.ok) return policyCheck;

  const ctx = await getCurrentRole();
  if (!ctx) return { ok: false, error: "Auth required" };

  const auth = await assertCanUpload(
    ctx.supabase,
    ctx.userId,
    ctx.role,
    parsed.data.studentId,
  );
  if (!auth.ok) return auth;

  const ext = pickExtension(parsed.data.originalFilename, parsed.data.mimeType);
  const kindSlug = safeKindSlug(parsed.data.kind);
  const storageKey = `${teacherMaterialPolicy.prefix}/${parsed.data.studentId}/${kindSlug}-${randomSuffix()}.${ext}`;

  const { data: inserted, error: insertErr } = await ctx.supabase
    .from("teacher_materials")
    .insert({
      student_id: parsed.data.studentId,
      uploaded_by: ctx.userId,
      kind: parsed.data.kind,
      original_filename: parsed.data.originalFilename.slice(0, 255),
      storage_key: storageKey,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return {
      ok: false,
      error: insertErr?.message ?? "Failed to record material",
    };
  }

  let presignedPutUrl: string;
  try {
    presignedPutUrl = await presignPut({
      key: storageKey,
      contentType: parsed.data.mimeType,
      contentLength: parsed.data.sizeBytes,
      ttlSeconds: 600,
    });
  } catch (err) {
    // Roll back the metadata row so we don't leak a permanently-pending entry.
    await ctx.supabase.from("teacher_materials").delete().eq("id", inserted.id);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to presign upload URL",
    };
  }

  return {
    ok: true,
    materialId: inserted.id,
    presignedPutUrl,
    storageKey,
  };
}

/**
 * Step 3 of 3: flip the row from `pending` to `ready` so it shows up in
 * read queries. Caller must own the row (RLS enforces this on update).
 */
export async function confirmTeacherMaterialUpload(
  materialId: string,
): Promise<ConfirmResult> {
  if (!materialId) return { ok: false, error: "Missing material id" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teacher_materials")
    .update({ status: "ready" })
    .eq("id", materialId)
    .eq("status", "pending")
    .select("student_id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Material not found or already confirmed",
    };
  }

  revalidatePath(`/teacher/students/${data.student_id}`);
  revalidatePath("/dashboard/documents");
  return { ok: true };
}

/**
 * Best-effort cleanup when the browser-side PUT fails. Deletes the
 * pending row + the (likely-orphaned) R2 object. RLS still gates the
 * delete to the uploader (or admin).
 */
export async function cancelTeacherMaterialUpload(
  materialId: string,
): Promise<DeleteResult> {
  if (!materialId) return { ok: false, error: "Missing material id" };
  const supabase = await createClient();

  // Read-then-delete so we still know the storage_key after the row is gone.
  const { data: row } = await supabase
    .from("teacher_materials")
    .select("storage_key, status")
    .eq("id", materialId)
    .maybeSingle();

  if (!row) return { ok: true }; // nothing to clean — treat as success
  if (row.status !== "pending") {
    return { ok: false, error: "Material is already confirmed" };
  }

  const { error: delRowErr } = await supabase
    .from("teacher_materials")
    .delete()
    .eq("id", materialId);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await deleteR2Object(row.storage_key); // best-effort
  return { ok: true };
}

/**
 * Hard delete of a confirmed material — row first, then R2 object. Same
 * shape as deleteStudentDocument.
 */
export async function deleteTeacherMaterial(
  materialId: string,
): Promise<DeleteResult> {
  if (!materialId) return { ok: false, error: "Missing material id" };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("teacher_materials")
    .select("student_id, storage_key")
    .eq("id", materialId)
    .maybeSingle();

  if (!row) return { ok: false, error: "Material not found" };

  const { error: delRowErr } = await supabase
    .from("teacher_materials")
    .delete()
    .eq("id", materialId);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await deleteR2Object(row.storage_key); // best-effort

  revalidatePath(`/teacher/students/${row.student_id}`);
  revalidatePath("/dashboard/documents");
  return { ok: true };
}
