/**
 * Build a Content-Disposition header value for a presigned R2 download.
 * Always provides both an ASCII `filename=` and an RFC 5987 `filename*=`
 * so non-ASCII characters survive the round-trip.
 */
export function contentDispositionFor(
  type: "inline" | "attachment",
  originalFilename: string,
): string {
  const safeAscii = originalFilename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/"/g, "");
  const encodedUtf8 = encodeURIComponent(originalFilename);
  return `${type}; filename="${safeAscii}"; filename*=UTF-8''${encodedUtf8}`;
}
