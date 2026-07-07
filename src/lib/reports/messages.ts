import type { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/domain";

type Client = Awaited<ReturnType<typeof createClient>>;

export type ReportMessageItem = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_role: Role;
};

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: { full_name: string | null; role: string } | null;
};

/**
 * Loads the two-way thread for a report, oldest first. Uses the caller's
 * RLS-scoped client so only the linked parent, the assigned teacher and
 * admins can read it (see 0027_report_views_and_messages.sql).
 */
export async function loadReportThread(
  supabase: Client,
  reportId: string,
): Promise<ReportMessageItem[]> {
  const { data } = await supabase
    .from("lesson_report_messages")
    .select(
      `
      id, body, created_at, author_id,
      author:profiles!lesson_report_messages_author_id_fkey ( full_name, role )
      `,
    )
    .eq("lesson_report_id", reportId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as unknown as MessageRow[]).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    author_id: m.author_id,
    author_name: m.author?.full_name ?? null,
    author_role: (m.author?.role ?? "parent") as Role,
  }));
}
