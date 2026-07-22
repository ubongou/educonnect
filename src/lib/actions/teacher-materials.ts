"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendTeacherMaterialEmail } from "@/lib/email/sendTeacherMaterial";
import { teacherMaterialPolicy } from "@/lib/uploads/policies";
import { parseReportAttachmentLink } from "@/lib/uploads/links";
import { createClient } from "@/lib/supabase/server";
import {
  cancelUpload,
  confirmUpload,
  deleteUpload,
  getCurrentUserRole,
  requestUpload,
  type RequestUploadResult,
  type SimpleResult,
  type UploadActionConfig,
} from "@/lib/uploads/core";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type TeacherMaterialKind =
  | "lesson_material"
  | "homework"
  | "demo_video"
  | "photo"
  | "other";

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
  note: z.string().trim().max(1000).optional(),
});
type RequestInput = z.infer<typeof requestSchema>;

// -----------------------------------------------------------------------------
// Pipeline config — teacher materials are shared by a teacher (or admin) with
// the parents of a student they have an approved enrollment for.
// -----------------------------------------------------------------------------

const config: UploadActionConfig<RequestInput> = {
  table: "teacher_materials",
  policy: teacherMaterialPolicy,
  parse: (raw) => {
    const parsed = requestSchema.safeParse(raw);
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  },
  authorize: async ({ supabase, userId, role, parsed }) => {
    if (role === "admin") return { ok: true };
    if (role !== "teacher") return { ok: false, error: "Not authorised" };

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", parsed.studentId)
      .eq("teacher_id", userId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    return enrollment
      ? { ok: true }
      : { ok: false, error: "No approved enrollment with this student." };
  },
  extraInsert: (parsed) => (parsed.note ? { note: parsed.note } : {}),
  revalidate: (studentId) => {
    revalidatePath(`/teacher/students/${studentId}`);
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/dashboard/documents");
  },
  // Notify the parent(s) once the file is confirmed. Non-fatal — a failed
  // send never blocks the upload (handled inside confirmUpload).
  onConfirmed: async (id) => {
    await sendTeacherMaterialEmail(id);
  },
};

// Report-attachment variant: same auth + table, but confirms to `staged`
// (hidden from the parent) and never emails on its own. Files uploaded through
// this path are promoted to `ready` + linked to a report when the report is
// sent (composer) or explicitly attached (already-sent report view).
const stagedConfig: UploadActionConfig<RequestInput> = {
  ...config,
  confirmStatus: "staged",
  onConfirmed: undefined,
};

// -----------------------------------------------------------------------------
// Server actions (thin wrappers binding the config)
// -----------------------------------------------------------------------------

export async function requestTeacherMaterialUpload(
  raw: unknown,
): Promise<RequestUploadResult> {
  return requestUpload(config, raw);
}

export async function requestReportAttachmentUpload(
  raw: unknown,
): Promise<RequestUploadResult> {
  return requestUpload(stagedConfig, raw);
}

export async function confirmReportAttachmentUpload(
  materialId: string,
): Promise<SimpleResult> {
  return confirmUpload(stagedConfig, materialId);
}

// Link-attachment variant of the staged report attachment: homework can be a
// pasted URL (an online quiz) instead of a file, so there's no R2 upload — we
// insert a `staged` link row directly, and the same promote-on-send machinery
// links it to the report. Shares the file path's auth check.
export type AddReportAttachmentLinkResult =
  | { ok: true; id: string; label: string }
  | { ok: false; error: string };

export async function addReportAttachmentLink(
  raw: unknown,
): Promise<AddReportAttachmentLinkResult> {
  const parsed = parseReportAttachmentLink(raw);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const ctx = await getCurrentUserRole(supabase);
  if (!ctx) return { ok: false, error: "Auth required" };

  const auth = await stagedConfig.authorize({
    supabase,
    userId: ctx.userId,
    role: ctx.role,
    parsed: { studentId: parsed.data.studentId } as never,
  });
  if (!auth.ok) return auth;

  const { data: inserted, error } = await supabase
    .from("teacher_materials")
    .insert({
      student_id: parsed.data.studentId,
      uploaded_by: ctx.userId,
      kind: parsed.data.kind,
      original_filename: parsed.data.label,
      link_url: parsed.data.url,
      status: "staged",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Failed to save link" };
  }

  return { ok: true, id: inserted.id, label: parsed.data.label };
}

// Removes a still-staged report attachment (link or file) that was added in the
// composer but taken off before send. RLS scopes the delete to the uploader's
// own rows; the `staged` guard means a promoted (sent) attachment can't be
// dropped through this path. Best-effort — link rows have no R2 object.
export async function deleteStagedReportAttachment(
  materialId: string,
): Promise<SimpleResult> {
  if (!materialId) return { ok: false, error: "Missing id" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("teacher_materials")
    .delete()
    .eq("id", materialId)
    .eq("status", "staged");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cancelReportAttachmentUpload(
  materialId: string,
): Promise<SimpleResult> {
  return cancelUpload(stagedConfig, materialId);
}

export async function confirmTeacherMaterialUpload(
  materialId: string,
): Promise<SimpleResult> {
  return confirmUpload(config, materialId);
}

export async function cancelTeacherMaterialUpload(
  materialId: string,
): Promise<SimpleResult> {
  return cancelUpload(config, materialId);
}

export async function deleteTeacherMaterial(
  materialId: string,
): Promise<SimpleResult> {
  return deleteUpload(config, materialId);
}
