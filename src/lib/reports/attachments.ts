import type { createClient } from "@/lib/supabase/server";
import type {
  HomeworkSubmissionItem,
  ReportAttachmentItem,
} from "@/components/dashboard/LessonReportView";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads a report's teacher attachments (homework/resources) and the parent's
 * completed-homework submissions. Uses the caller's RLS-scoped client, so each
 * viewer (parent / teacher / admin) only sees what they're entitled to.
 */
export async function loadReportFiles(
  supabase: Client,
  reportId: string,
): Promise<{
  attachments: ReportAttachmentItem[];
  submissions: HomeworkSubmissionItem[];
}> {
  const [{ data: att }, { data: subs }] = await Promise.all([
    supabase
      .from("teacher_materials")
      .select("id, kind, original_filename, mime_type")
      .eq("lesson_report_id", reportId)
      .eq("status", "ready")
      .order("uploaded_at", { ascending: true }),
    supabase
      .from("student_documents")
      .select("id, original_filename, mime_type, reviewed_at")
      .eq("lesson_report_id", reportId)
      .eq("status", "ready")
      .order("uploaded_at", { ascending: true }),
  ]);

  return {
    attachments: (att ?? []) as ReportAttachmentItem[],
    submissions: (subs ?? []) as HomeworkSubmissionItem[],
  };
}
