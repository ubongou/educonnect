/**
 * Storage-key construction shared by every upload pipeline. Previously each
 * pipeline (intake / student documents / teacher materials) carried its own
 * copy of these helpers, which is how the policies were able to drift apart.
 */

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
};

/** Best-effort file extension: prefer the original name, fall back to MIME. */
export function pickExtension(filename: string, mime: string): string {
  const fromName = filename.includes(".") ? filename.split(".").pop()! : "";
  if (fromName) return fromName.toLowerCase().slice(0, 8);
  return EXT_BY_MIME[mime] ?? "bin";
}

/** Enough entropy for storage-key uniqueness. */
export function randomSuffix(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Sanitises a free-form "kind" into a key-safe slug. */
export function safeKindSlug(kind: string, fallback = "file"): string {
  return kind.replace(/[^a-z0-9_-]+/gi, "").slice(0, 32) || fallback;
}

/**
 * Builds a deterministic-shape storage key:
 *   `<prefix>/<studentId>/<kindSlug>-<random>.<ext>`
 */
export function buildStorageKey(input: {
  prefix: string;
  studentId: string;
  kind: string;
  filename: string;
  mime: string;
}): string {
  const ext = pickExtension(input.filename, input.mime);
  const kindSlug = safeKindSlug(input.kind);
  return `${input.prefix}/${input.studentId}/${kindSlug}-${randomSuffix()}.${ext}`;
}
