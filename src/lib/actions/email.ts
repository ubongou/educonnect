"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendLessonReportEmail } from "@/lib/email/sendLessonReport";

export type ResendLessonReportResult =
  | { ok: true; recipients: string[]; skipped: boolean; reason?: string }
  | { ok: false; error: string };

/**
 * Admin-only "Resend email" trigger from /admin/reports. Re-sends the
 * lesson-report email to every parent on file and refreshes emailed_at.
 */
export async function resendLessonReportEmail(
  reportId: string,
): Promise<ResendLessonReportResult> {
  await requireAdmin();

  const result = await sendLessonReportEmail(reportId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/reports");

  if (result.skipped) {
    return {
      ok: true,
      recipients: result.recipients,
      skipped: true,
      reason: result.reason,
    };
  }
  return { ok: true, recipients: result.recipients, skipped: false };
}
