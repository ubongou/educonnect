"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendReportMessageEmail } from "@/lib/email/sendReportMessage";

export type MarkViewedResult = { ok: true } | { ok: false; error: string };
export type PostMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

const MAX_MESSAGE_LEN = 4000;

/**
 * Stamps first/last viewed on a report. Delegates to the mark_report_viewed
 * RPC (SECURITY DEFINER) which no-ops unless the caller is the linked parent,
 * so this is safe to call on every open. Fired from the parent report page.
 */
export async function markReportViewed(
  reportId: string,
): Promise<MarkViewedResult> {
  if (!reportId) return { ok: false, error: "Missing report id" };

  const supabase = await createClient();
  // RPC isn't in the generated db.ts yet (run `supabase gen types` post-
  // migration to regenerate). Until then call it via an untyped client.
  const { error } = await (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc("mark_report_viewed", { p_report_id: reportId });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Posts a message to a report's two-way thread. The insert is RLS-scoped, so
 * only the linked parent, the assigned teacher, or an admin can post — and
 * only ever as themselves. On success we notify the other side by email
 * (best-effort; a Resend hiccup must not fail the post).
 */
export async function postReportMessage(
  reportId: string,
  rawBody: string,
): Promise<PostMessageResult> {
  if (!reportId) return { ok: false, error: "Missing report id" };

  const body = (rawBody ?? "").trim();
  if (!body) return { ok: false, error: "Message can’t be empty" };
  if (body.length > MAX_MESSAGE_LEN) {
    return { ok: false, error: `Message is too long (max ${MAX_MESSAGE_LEN})` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Auth required" };

  const { data, error } = await supabase
    .from("lesson_report_messages")
    .insert({ lesson_report_id: reportId, author_id: user.id, body })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  const messageId = (data as { id: string } | null)?.id;
  if (!messageId) return { ok: false, error: "Message saved but no id returned" };

  // Fire-and-log: notifying the other side must never fail the post.
  try {
    const sent = await sendReportMessageEmail(messageId);
    if (!sent.ok) {
      console.error("[report-message email] send failed:", sent.error);
    } else if (sent.skipped) {
      console.warn(`[report-message email] skipped for ${messageId}: ${sent.reason}`);
    }
  } catch (err) {
    console.error("[report-message email] unexpected error:", err);
  }

  revalidatePath(`/dashboard/reports/${reportId}`);
  revalidatePath(`/teacher/reports/${reportId}`);
  revalidatePath(`/admin/reports/${reportId}`);

  return { ok: true, messageId };
}
