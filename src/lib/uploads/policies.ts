/**
 * Per-pipeline upload validation. Each policy gates server-side validation
 * (authoritative) and informs the matching client-side `accept` attribute
 * (informational — the browser hint).
 */

export type UploadPolicy = {
  /** Set of allowed MIME types — exact match. */
  allowedMime: ReadonlySet<string>;
  /** Maximum bytes for a single uploaded file. */
  maxBytes: number;
  /** Top-level R2 key prefix for this pipeline (no trailing slash). */
  prefix: string;
};

export const intakeUploadPolicy: UploadPolicy = {
  allowedMime: new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp",
  ]),
  maxBytes: 20 * 1024 * 1024,
  prefix: "intake-files",
};

export const studentDocumentPolicy: UploadPolicy = {
  allowedMime: new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
  ]),
  maxBytes: 200 * 1024 * 1024,
  prefix: "student-documents",
};

export const teacherMaterialPolicy: UploadPolicy = {
  allowedMime: new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
  ]),
  maxBytes: 200 * 1024 * 1024,
  prefix: "teacher-materials",
};

export type ValidateUploadInput = {
  mimeType: string;
  sizeBytes: number;
};

export type ValidateUploadResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateUpload(
  policy: UploadPolicy,
  input: ValidateUploadInput,
): ValidateUploadResult {
  if (input.sizeBytes <= 0) {
    return { ok: false, error: "File is empty." };
  }
  if (input.sizeBytes > policy.maxBytes) {
    const mb = Math.round(policy.maxBytes / (1024 * 1024));
    return {
      ok: false,
      error: `File exceeds the ${mb} MB limit for this upload type.`,
    };
  }
  if (!policy.allowedMime.has(input.mimeType)) {
    return {
      ok: false,
      error: `File type "${input.mimeType || "unknown"}" is not allowed for this upload type.`,
    };
  }
  return { ok: true };
}
