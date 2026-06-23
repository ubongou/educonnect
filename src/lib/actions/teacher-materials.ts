"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendTeacherMaterialEmail } from "@/lib/email/sendTeacherMaterial";
import { teacherMaterialPolicy } from "@/lib/uploads/policies";
import {
  cancelUpload,
  confirmUpload,
  deleteUpload,
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
