/**
 * Whether a given MIME type renders inline in a typical browser. Drives the
 * "View" vs "Download" affordance on file lists — non-viewable MIMEs (Office
 * docs, archives, etc.) should be downloaded directly.
 */
export function isViewableMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return (
    mime === "application/pdf" ||
    mime === "video/mp4" ||
    mime.startsWith("image/")
  );
}
