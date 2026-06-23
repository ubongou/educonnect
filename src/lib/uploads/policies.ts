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
    "application/pdf",
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

/**
 * The `accept` attribute for a file `<input>`, derived from the policy's
 * MIME allowlist. Deriving this (rather than hardcoding it per component)
 * keeps the browser hint in lockstep with the authoritative server-side
 * allowlist — they cannot drift apart.
 */
export function acceptAttr(policy: UploadPolicy): string {
  return Array.from(policy.allowedMime).join(",");
}

/** Short human label for a MIME type, used to build the upload hint. */
const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
  "video/mp4": "MP4",
};

/**
 * Human-readable hint line for the dropzone, e.g.
 * "Up to 200 MB · PDF, JPG, PNG, WEBP, MP4". Also derived from the policy
 * so the copy can never disagree with what's actually accepted.
 */
export function describePolicy(policy: UploadPolicy): string {
  const mb = Math.round(policy.maxBytes / (1024 * 1024));
  const labels = Array.from(policy.allowedMime).map(
    (m) => MIME_LABELS[m] ?? m,
  );
  // De-dupe while preserving order (JPG/JPEG could collapse in future).
  const seen = new Set<string>();
  const unique = labels.filter((l) => (seen.has(l) ? false : seen.add(l)));
  return `Up to ${mb} MB · ${unique.join(", ")}`;
}

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
