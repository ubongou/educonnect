"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

/**
 * Deletes a parent-uploaded document. RLS already scopes this to the uploading
 * parent (or an admin). One extra business rule on top: once a teacher has
 * reviewed a homework submission, the parent can't pull it out from under them
 * — they have to ask for it to be un-reviewed first.
 */
export async function deleteStudentDocument(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("student_documents")
    .select("reviewed_at")
    .eq("id", id)
    .maybeSingle<{ reviewed_at: string | null }>();

  if (row?.reviewed_at) {
    return {
      ok: false,
      error:
        "Your teacher has already reviewed this. Ask them to un-review it before removing.",
    };
  }

  return deleteUpload(config, id);
}
