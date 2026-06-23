"use server";

import { revalidatePath } from "next/cache";
import { studentDocumentPolicy } from "@/lib/uploads/policies";
import {
  studentDocumentUploadSchema,
  type StudentDocumentUploadInput,
} from "@/lib/validation";
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
// Pipeline config — student documents are uploaded by a parent against an
// approved enrollment. RLS additionally requires the inserter to be a parent
// of the student; the enrollment checks below give friendlier errors.
// -----------------------------------------------------------------------------

const config: UploadActionConfig<StudentDocumentUploadInput> = {
  table: "student_documents",
  policy: studentDocumentPolicy,
  parse: (raw) => {
    const parsed = studentDocumentUploadSchema.safeParse(raw);
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  },
  authorize: async ({ supabase, parsed }) => {
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .select("id, student_id, status")
      .eq("id", parsed.enrollmentId)
      .maybeSingle();

    if (error || !enrollment) return { ok: false, error: "Enrollment not found" };
    if (enrollment.student_id !== parsed.studentId) {
      return { ok: false, error: "Enrollment does not match the selected child" };
    }
    if (enrollment.status !== "approved") {
      return { ok: false, error: "Pick an approved enrollment" };
    }
    return { ok: true };
  },
  extraInsert: (parsed) => ({ enrollment_id: parsed.enrollmentId }),
  revalidate: (studentId) => {
    revalidatePath("/dashboard/documents");
    revalidatePath(`/teacher/students/${studentId}`);
    revalidatePath(`/admin/students/${studentId}`);
  },
};

// -----------------------------------------------------------------------------
// Server actions (thin wrappers binding the config)
// -----------------------------------------------------------------------------

export async function requestStudentDocumentUpload(
  raw: unknown,
): Promise<RequestUploadResult> {
  return requestUpload(config, raw);
}

export async function confirmStudentDocumentUpload(
  documentId: string,
): Promise<SimpleResult> {
  return confirmUpload(config, documentId);
}

export async function cancelStudentDocumentUpload(
  documentId: string,
): Promise<SimpleResult> {
  return cancelUpload(config, documentId);
}

export async function deleteStudentDocument(id: string): Promise<SimpleResult> {
  return deleteUpload(config, id);
}
