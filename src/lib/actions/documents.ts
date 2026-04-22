"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StudentDocumentKind } from "@/types/domain";

export type UploadResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const allowedKinds: StudentDocumentKind[] = [
  "test_paper",
  "school_report",
  "exam_result",
  "other",
];

function randomId(): string {
  // Small cryptographic-ish id — plenty for storage-path uniqueness.
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Parent uploads a document for their own child. Storage path is
 *   {student_id}/{kind}-{randomId}.{ext}
 * so the RLS policy on the student-documents bucket can match the first
 * path segment against parent_students without having to decode the
 * filename.
 */
export async function uploadStudentDocument(formData: FormData): Promise<UploadResult> {
  const studentId = String(formData.get("student_id") ?? "");
  const kindRaw = String(formData.get("kind") ?? "other");
  const kind = (allowedKinds.includes(kindRaw as StudentDocumentKind)
    ? (kindRaw as StudentDocumentKind)
    : "other") as StudentDocumentKind;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a file first." };
  }
  if (!studentId) {
    return { ok: false, error: "Missing student id" };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, error: "Files larger than 20 MB aren't supported yet." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const storagePath = `${studentId}/${kind}-${randomId()}${ext ? `.${ext}` : ""}`;

  const { error: uploadErr } = await supabase.storage
    .from("student-documents")
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadErr) {
    return { ok: false, error: uploadErr.message };
  }

  const { data: inserted, error: rowErr } = await supabase
    .from("student_documents")
    .insert({
      student_id: studentId,
      uploaded_by: user.id,
      kind,
      original_filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("id")
    .single();

  if (rowErr || !inserted) {
    // Best-effort cleanup so we don't leave an orphan blob.
    await supabase.storage.from("student-documents").remove([storagePath]).catch(() => undefined);
    return { ok: false, error: rowErr?.message ?? "Failed to record document" };
  }

  revalidatePath("/dashboard/documents");
  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/admin/students/${studentId}`);
  return { ok: true, id: inserted.id };
}

export async function deleteStudentDocument(id: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("student_documents")
    .select("student_id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!row) return { ok: false, error: "Document not found" };

  const { error: delRowErr } = await supabase
    .from("student_documents")
    .delete()
    .eq("id", id);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await supabase.storage
    .from("student-documents")
    .remove([row.storage_path])
    .catch(() => undefined);

  revalidatePath("/dashboard/documents");
  revalidatePath(`/teacher/students/${row.student_id}`);
  return { ok: true };
}
