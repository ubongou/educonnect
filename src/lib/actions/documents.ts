"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  deleteR2Object,
  presignPut,
} from "@/lib/r2/objects";
import {
  studentDocumentPolicy,
  validateUpload,
} from "@/lib/uploads/policies";
import type { StudentDocumentKind } from "@/types/domain";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type RequestUploadResult =
  | { ok: true; documentId: string; presignedPutUrl: string; storageKey: string }
  | { ok: false; error: string };

export type ConfirmResult = { ok: true } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

const allowedKinds = [
  "test_paper",
  "school_report",
  "exam_result",
  "other",
] as const satisfies readonly StudentDocumentKind[];

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
  if (mime === "application/pdf") return "pdf";
  if (mime === "video/mp4") return "mp4";
  return "bin";
}

function randomSuffix(): string {
  // Enough entropy for storage-key uniqueness — same shape as the prior
  // randomId() helper.
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function safeKindSlug(kind: string): string {
  return kind.replace(/[^a-z0-9_-]+/gi, "").slice(0, 32) || "doc";
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

/**
 * Step 1 of 3 in the parent upload flow: insert a `pending` metadata row
 * and return a presigned PUT URL the browser will upload bytes to.
 *
 * RLS on `student_documents` requires the inserter to be a parent of the
 * student (or admin). Validation happens twice — Zod (shape) and the
 * `studentDocumentPolicy` (business rules: MIME allowlist, size cap).
 */
export async function requestStudentDocumentUpload(
  raw: unknown,
): Promise<RequestUploadResult> {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const policyCheck = validateUpload(studentDocumentPolicy, {
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!policyCheck.ok) return policyCheck;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  // TEMP DEBUG: probe whether RLS sees the same user as supabase.auth.
  // If parent_students returns rows, auth.uid() is propagating; if not,
  // the JWT isn't reaching the DB session.
  const { data: psRows, error: psErr } = await supabase
    .from("parent_students")
    .select("parent_id, student_id");
  console.log("[upload-debug]", {
    userId: user.id,
    expectedParentId: "d4e2ed91-4e4a-4226-bf17-d1d271a40838",
    parentStudentsVisible: psRows,
    psErr: psErr?.message,
  });

  const ext = pickExtension(parsed.data.originalFilename, parsed.data.mimeType);
  const kindSlug = safeKindSlug(parsed.data.kind);
  const storageKey = `${studentDocumentPolicy.prefix}/${parsed.data.studentId}/${kindSlug}-${randomSuffix()}.${ext}`;

  const { data: inserted, error: insertErr } = await supabase
    .from("student_documents")
    .insert({
      student_id: parsed.data.studentId,
      uploaded_by: user.id,
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
      error: insertErr?.message ?? "Failed to record document",
    };
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
    // Presigning failed — roll back the metadata row so we don't leak a
    // permanently-pending entry.
    await supabase.from("student_documents").delete().eq("id", inserted.id);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to presign upload URL",
    };
  }

  return {
    ok: true,
    documentId: inserted.id,
    presignedPutUrl,
    storageKey,
  };
}

/**
 * Step 3 of 3: flip the row from `pending` to `ready` so it shows up in
 * read queries. Caller must own the row (RLS enforces this on update).
 */
export async function confirmStudentDocumentUpload(
  documentId: string,
): Promise<ConfirmResult> {
  if (!documentId) return { ok: false, error: "Missing document id" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_documents")
    .update({ status: "ready" })
    .eq("id", documentId)
    .eq("status", "pending")
    .select("student_id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Document not found or already confirmed",
    };
  }

  revalidatePath("/dashboard/documents");
  revalidatePath(`/teacher/students/${data.student_id}`);
  revalidatePath(`/admin/students/${data.student_id}`);
  return { ok: true };
}

/**
 * Best-effort cleanup when the browser-side PUT fails. Deletes the
 * pending row + the (likely-orphaned) R2 object. RLS still gates the
 * delete to the parent who owns the row.
 */
export async function cancelStudentDocumentUpload(
  documentId: string,
): Promise<DeleteResult> {
  if (!documentId) return { ok: false, error: "Missing document id" };
  const supabase = await createClient();

  // Read-then-delete so we still know the storage_key after the row is
  // gone (admins should be able to GC orphan objects via this path too).
  const { data: row } = await supabase
    .from("student_documents")
    .select("storage_key, status")
    .eq("id", documentId)
    .maybeSingle();

  if (!row) return { ok: true }; // nothing to clean — treat as success
  if (row.status !== "pending") {
    // Refuse to nuke a confirmed row through the cancel path — caller
    // should use deleteStudentDocument for that.
    return { ok: false, error: "Document is already confirmed" };
  }

  const { error: delRowErr } = await supabase
    .from("student_documents")
    .delete()
    .eq("id", documentId);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await deleteR2Object(row.storage_key); // best-effort
  return { ok: true };
}

/**
 * Hard delete of a confirmed document — row first, then R2 object.
 * Matches the prior `deleteStudentDocument` contract.
 */
export async function deleteStudentDocument(
  id: string,
): Promise<DeleteResult> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("student_documents")
    .select("student_id, storage_key")
    .eq("id", id)
    .maybeSingle();

  if (!row) return { ok: false, error: "Document not found" };

  const { error: delRowErr } = await supabase
    .from("student_documents")
    .delete()
    .eq("id", id);
  if (delRowErr) return { ok: false, error: delRowErr.message };

  await deleteR2Object(row.storage_key); // best-effort

  revalidatePath("/dashboard/documents");
  revalidatePath(`/teacher/students/${row.student_id}`);
  return { ok: true };
}
