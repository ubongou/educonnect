import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Promotes a teacher's `staged` attachment rows to `ready` and links them to a
 * lesson report. Scoped to the calling teacher's own rows (RLS already gates
 * the update to `uploaded_by = auth.uid()`), and to the report's student, so a
 * teacher can't attach someone else's staged files. Returns the ids actually
 * promoted (the caller uses these to decide whether to notify).
 *
 * `anyUploader` drops the ownership filter — admins fixing up a teacher's
 * report need to be able to promote whatever was staged against the student,
 * not only files they staged themselves. RLS still gates the update (admins
 * pass the `is_admin` branch of teacher_materials_update), and the student +
 * `staged` filters below still hold, so the widening is limited to "who
 * uploaded it".
 */
export async function promoteStagedAttachments(
  supabase: Client,
  params: {
    reportId: string;
    studentId: string;
    uploaderId: string;
    materialIds: string[];
    anyUploader?: boolean;
  },
): Promise<string[]> {
  const ids = params.materialIds.filter(Boolean);
  if (ids.length === 0) return [];

  let query = supabase
    .from("teacher_materials")
    .update({ status: "ready", lesson_report_id: params.reportId })
    .in("id", ids)
    .eq("student_id", params.studentId)
    .eq("status", "staged");

  if (!params.anyUploader) {
    query = query.eq("uploaded_by", params.uploaderId);
  }

  const { data } = await query.select("id");

  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}
