import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Promotes a teacher's `staged` attachment rows to `ready` and links them to a
 * lesson report. Scoped to the calling teacher's own rows (RLS already gates
 * the update to `uploaded_by = auth.uid()`), and to the report's student, so a
 * teacher can't attach someone else's staged files. Returns the ids actually
 * promoted (the caller uses these to decide whether to notify).
 */
export async function promoteStagedAttachments(
  supabase: Client,
  params: {
    reportId: string;
    studentId: string;
    uploaderId: string;
    materialIds: string[];
  },
): Promise<string[]> {
  const ids = params.materialIds.filter(Boolean);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("teacher_materials")
    .update({ status: "ready", lesson_report_id: params.reportId })
    .in("id", ids)
    .eq("uploaded_by", params.uploaderId)
    .eq("student_id", params.studentId)
    .eq("status", "staged")
    .select("id");

  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}
