"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteR2Object, presignPut } from "@/lib/r2/objects";
import { buildStorageKey } from "@/lib/uploads/keys";
import { studentDocumentPolicy, validateUpload } from "@/lib/uploads/policies";
import { sendHomeworkSubmittedEmail } from "@/lib/email/sendHomeworkSubmitted";
import type { RequestUploadResult, SimpleResult } from "@/lib/uploads/core";

const requestSchema = z.object({
  reportId: z.string().uuid("Invalid report id"),
  studentId: z.string().uuid("Invalid student id"),
  mimeType: z.string().min(1, "Missing MIME type"),
  sizeBytes: z.number().int().positive(),
  originalFilename: z.string().min(1).max(255),
});

/**
 * Shared gate for a parent submitting completed homework (file or text) against
 * a report: the caller must be a parent of the student, the report must belong
 * to that student, and there must be an approved enrolment for the report's
 * subject (so the submission routes to the right teacher). Returns the caller's
 * id + the matched enrollment id.
 */
async function authorizeHomeworkSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  studentId: string,
): Promise<
  { ok: true; userId: string; enrollmentId: string } | { ok: false; error: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const { data: link } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("parent_id", user.id)
    .maybeSingle();
  if (!link) return { ok: false, error: "Not authorised for this student" };

  const { data: report } = await supabase
    .from("lesson_reports")
    .select("id, student_id, subject_id")
    .eq("id", reportId)
    .maybeSingle();
  if (!report || report.student_id !== studentId) {
    return { ok: false, error: "Report not found for this child" };
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("subject_id", report.subject_id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (!enrollment) {
    return { ok: false, error: "No approved enrolment for this subject" };
  }

  return { ok: true, userId: user.id, enrollmentId: enrollment.id };
}

/**
 * Parent uploads their child's *completed* homework back against a lesson
 * report. Stored as a `student_documents` row (kind `homework_submission`)
 * linked to the report, scoped to the report's subject enrollment so the right
 * teacher sees it. Same three-step presigned flow as other uploads.
 */
export async function requestHomeworkSubmission(
  raw: unknown,
): Promise<RequestUploadResult> {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const policyCheck = validateUpload(studentDocumentPolicy, {
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!policyCheck.ok) return policyCheck;

  const supabase = await createClient();
  const auth = await authorizeHomeworkSubmission(
    supabase,
    parsed.data.reportId,
    parsed.data.studentId,
  );
  if (!auth.ok) return auth;

  const storageKey = buildStorageKey({
    prefix: studentDocumentPolicy.prefix,
    studentId: parsed.data.studentId,
    kind: "homework_submission",
    filename: parsed.data.originalFilename,
    mime: parsed.data.mimeType,
  });

  const { data: inserted, error: insertErr } = await supabase
    .from("student_documents")
    .insert({
      student_id: parsed.data.studentId,
      enrollment_id: auth.enrollmentId,
      lesson_report_id: parsed.data.reportId,
      uploaded_by: auth.userId,
      kind: "homework_submission",
      original_filename: parsed.data.originalFilename.slice(0, 255),
      storage_key: storageKey,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to record upload" };
  }

  let presignedPutUrl: string;
  try {
    presignedPutUrl = await presignPut({
      key: storageKey,
      contentType: parsed.data.mimeType,
      contentLength: parsed.data.sizeBytes,
      ttlSeconds: 3600,
    });
  } catch (err) {
    await supabase.from("student_documents").delete().eq("id", inserted.id);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to presign upload URL",
    };
  }

  return { ok: true, id: inserted.id, presignedPutUrl, storageKey };
}

const textSchema = z.object({
  reportId: z.string().uuid("Invalid report id"),
  studentId: z.string().uuid("Invalid student id"),
  text: z
    .string()
    .trim()
    .min(1, "Write an answer first")
    .max(5000, "That's too long — attach a file instead"),
});

/**
 * Parent submits their child's completed homework as a short written answer
 * (e.g. "1. fish  2. books") instead of a file. Stored as a ready
 * `student_documents` row (kind 'homework_submission') with `submission_text`
 * set and no file — so it shows and reviews exactly like an uploaded one. No
 * presigned-upload dance is needed.
 */
export async function submitHomeworkText(raw: unknown): Promise<SimpleResult> {
  const parsed = textSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const auth = await authorizeHomeworkSubmission(
    supabase,
    parsed.data.reportId,
    parsed.data.studentId,
  );
  if (!auth.ok) return auth;

  const { data: inserted, error: insertErr } = await supabase
    .from("student_documents")
    .insert({
      student_id: parsed.data.studentId,
      enrollment_id: auth.enrollmentId,
      lesson_report_id: parsed.data.reportId,
      uploaded_by: auth.userId,
      kind: "homework_submission",
      submission_text: parsed.data.text,
      status: "ready",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to submit answer" };
  }

  try {
    await sendHomeworkSubmittedEmail(inserted.id);
  } catch (err) {
    console.error("[homework-submitted email] unexpected error:", err);
  }

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/sessions");
  revalidatePath(`/dashboard/reports/${parsed.data.reportId}`);
  revalidatePath(`/teacher/reports/${parsed.data.reportId}`);
  revalidatePath(`/teacher/students/${parsed.data.studentId}`);
  return { ok: true };
}

/** Step 3: flip pending → ready, then notify the teacher (non-fatal). */
export async function confirmHomeworkSubmission(
  documentId: string,
): Promise<SimpleResult> {
  if (!documentId) return { ok: false, error: "Missing document id" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_documents")
    .update({ status: "ready" })
    .eq("id", documentId)
    .eq("status", "pending")
    .select("student_id, lesson_report_id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Upload not found or already confirmed",
    };
  }

  try {
    await sendHomeworkSubmittedEmail(documentId);
  } catch (err) {
    console.error("[homework-submitted email] unexpected error:", err);
  }

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/sessions");
  if (data.lesson_report_id) {
    revalidatePath(`/dashboard/reports/${data.lesson_report_id}`);
    revalidatePath(`/teacher/reports/${data.lesson_report_id}`);
  }
  revalidatePath(`/teacher/students/${data.student_id}`);
  return { ok: true };
}

/** Best-effort cleanup of a failed submission upload. */
export async function cancelHomeworkSubmission(
  documentId: string,
): Promise<SimpleResult> {
  if (!documentId) return { ok: false, error: "Missing document id" };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("student_documents")
    .select("storage_key, status")
    .eq("id", documentId)
    .maybeSingle();

  if (!row) return { ok: true };
  if (row.status !== "pending") {
    return { ok: false, error: "Upload is already confirmed" };
  }

  const { error: delErr } = await supabase
    .from("student_documents")
    .delete()
    .eq("id", documentId);
  if (delErr) return { ok: false, error: delErr.message };

  if (row.storage_key) await deleteR2Object(row.storage_key);
  return { ok: true };
}

/** Teacher/admin marks a parent's submission reviewed (SECURITY DEFINER RPC). */
export async function markHomeworkReviewed(
  documentId: string,
  reviewed: boolean,
): Promise<SimpleResult> {
  if (!documentId) return { ok: false, error: "Missing document id" };
  const supabase = await createClient();

  const { error } = await (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc("mark_homework_reviewed", {
    p_document_id: documentId,
    p_reviewed: reviewed,
  });

  if (error) return { ok: false, error: error.message };

  // Reviewed state shows on the teacher report view + student page.
  const { data: row } = await supabase
    .from("student_documents")
    .select("student_id, lesson_report_id")
    .eq("id", documentId)
    .maybeSingle();
  if (row?.lesson_report_id) {
    revalidatePath(`/teacher/reports/${row.lesson_report_id}`);
  }
  if (row?.student_id) revalidatePath(`/teacher/students/${row.student_id}`);
  return { ok: true };
}
