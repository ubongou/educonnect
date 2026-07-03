"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  bookingRequestSchema,
  normalizeSource,
} from "@/lib/booking/schema";
import { sendBookingRequestEmail } from "@/lib/email/sendBookingRequest";

export type SubmitBookingRequestState =
  | null
  | {
      status: "error";
      fieldErrors: Record<string, string>;
      formError?: string;
      values: Record<string, string>;
    }
  // Returned only in "inline" mode (e.g. /strategy-session), where the caller
  // reveals the calendar on-page instead of navigating to /book/thanks.
  | { status: "success" };

/**
 * Public-facing booking submission. Order:
 *   1. Honeypot — non-empty `_hp` returns "ok" silently (bots get the
 *      thank-you page, no DB row, no email).
 *   2. Zod parse. Failure => return field errors + previously typed
 *      values so the form re-renders without losing input.
 *   3. Insert into booking_requests via the anon client (RLS policy
 *      "public can submit booking requests" permits this).
 *   4. Best-effort email. A failure here is logged but doesn't block
 *      the redirect — the row is already safely persisted.
 *   5. Finish: redirect to /book/thanks, or (inline mode) return a
 *      success state so the caller can reveal the calendar on-page.
 *
 * The email/DB pipeline is identical in both modes; only the final step
 * differs. Inline mode is opted into with a hidden `after_submit=inline`
 * field so the default (/book) behaviour is untouched.
 */
export async function submitBookingRequest(
  _prev: SubmitBookingRequestState,
  formData: FormData,
): Promise<SubmitBookingRequestState> {
  const inline = String(formData.get("after_submit") ?? "") === "inline";

  // 1. Honeypot
  const honey = String(formData.get("_hp") ?? "");
  if (honey.length > 0) {
    if (inline) return { status: "success" };
    redirect("/book/thanks");
  }

  // 2. Zod parse
  const raw = {
    child_name: String(formData.get("child_name") ?? ""),
    child_age: String(formData.get("child_age") ?? ""),
    child_grade: String(formData.get("child_grade") ?? ""),
    curriculum: String(formData.get("curriculum") ?? ""),
    curriculum_other: String(formData.get("curriculum_other") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    learning_needs: String(formData.get("learning_needs") ?? ""),
    current_performance: String(formData.get("current_performance") ?? ""),
    concerns: String(formData.get("concerns") ?? ""),
    parent_name: String(formData.get("parent_name") ?? ""),
    parent_phone: String(formData.get("parent_phone") ?? ""),
    parent_email: String(formData.get("parent_email") ?? ""),
    source: normalizeSource(formData.get("source")),
  };

  const parsed = bookingRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", fieldErrors, values: raw };
  }

  // 3. Insert
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("booking_requests").insert({
    child_name: parsed.data.child_name,
    child_age: parsed.data.child_age,
    child_grade: parsed.data.child_grade,
    curriculum: parsed.data.curriculum,
    curriculum_other:
      parsed.data.curriculum === "other" ? parsed.data.curriculum_other : null,
    subject: parsed.data.subject,
    learning_needs: parsed.data.learning_needs,
    current_performance: parsed.data.current_performance,
    concerns: parsed.data.concerns || null,
    parent_name: parsed.data.parent_name,
    parent_phone: parsed.data.parent_phone,
    parent_email: parsed.data.parent_email,
    source: parsed.data.source,
  });

  if (dbError) {
    console.error("[booking] insert failed:", dbError);
    return {
      status: "error",
      fieldErrors: {},
      formError:
        "Sorry — we couldn't save your request. Please try again in a moment.",
      values: raw,
    };
  }

  // 4. Best-effort email
  try {
    const result = await sendBookingRequestEmail(parsed.data);
    if (!result.ok) {
      console.error("[booking] email send failed:", result.error);
    }
  } catch (err) {
    console.error("[booking] email send threw:", err);
  }

  // 5. Finish
  if (inline) return { status: "success" };
  redirect("/book/thanks");
}
