import { z } from "zod";

/**
 * Homework/resource attachments can be a pasted link (an online quiz or
 * assessment) instead of an uploaded file. This validates + normalises that
 * link before it's stored as a `teacher_materials` row with `link_url` set and
 * no `storage_key`. Kept file-free and side-effect-free so it can be unit
 * tested in isolation from the DB action.
 */

const linkKinds = ["homework", "lesson_material"] as const;
export type LinkKind = (typeof linkKinds)[number];

const rawSchema = z.object({
  studentId: z.string().uuid("Invalid student id"),
  kind: z.enum(linkKinds, { message: "Pick a valid kind" }),
  url: z.string().trim().min(1, "Add a link").max(2048, "Link is too long"),
  title: z.string().trim().max(255).optional(),
});

export type ParsedAttachmentLink = {
  studentId: string;
  kind: LinkKind;
  url: string;
  /** Display label — the teacher's title, else the tidied URL. */
  label: string;
};

/**
 * Accepts a bare or full URL, forces an http(s) scheme, and derives a display
 * label. Rejects anything that isn't a valid web link (so we never store, or
 * hand a parent, a `javascript:`/`mailto:`/malformed URL).
 */
export function parseReportAttachmentLink(
  raw: unknown,
): { ok: true; data: ParsedAttachmentLink } | { ok: false; error: string } {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid link" };
  }

  const { studentId, kind, title } = parsed.data;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(parsed.data.url)
    ? parsed.data.url
    : `https://${parsed.data.url}`;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidate);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link" };
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { ok: false, error: "Links must start with http:// or https://" };
  }

  const url = parsedUrl.toString();
  const label = (title && title.length > 0 ? title : prettyLabel(parsedUrl)).slice(
    0,
    255,
  );

  return { ok: true, data: { studentId, kind, url, label } };
}

/** A compact human label for a URL: host + path, no scheme, no trailing slash. */
function prettyLabel(u: URL): string {
  const host = u.host.replace(/^www\./, "");
  const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
  return `${host}${path}${u.search}`;
}
