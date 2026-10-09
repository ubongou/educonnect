"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  bookingRequestSchema,
  describeSubjects,
  normalizeSource,
  primarySubject,
  subjectValues,
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
  // Returned only in "inline" mode (/book), where the form reveals the
  // calendar on-page instead of navigating to /book/thanks.
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

  // 2. Zod parse. Subjects are checkboxes (several values under one name);
  // `raw` keeps them comma-joined so the form can re-tick them on error.
  const subjects = formData.getAll("subjects").map(String);
  const raw = {
    child_name: String(formData.get("child_name") ?? ""),
    child_age: String(formData.get("child_age") ?? ""),
    child_grade: String(formData.get("child_grade") ?? ""),
    curriculum: String(formData.get("curriculum") ?? ""),
    curriculum_other: String(formData.get("curriculum_other") ?? ""),
    subjects: subjects.join(","),
    subject_other: String(formData.get("subject_other") ?? ""),
    learning_needs: String(formData.get("learning_needs") ?? ""),
    current_performance: String(formData.get("current_performance") ?? ""),
    concerns: String(formData.get("concerns") ?? ""),
    parent_name: String(formData.get("parent_name") ?? ""),
    parent_phone: String(formData.get("parent_phone") ?? ""),
    parent_email: String(formData.get("parent_email") ?? ""),
    source: normalizeSource(formData.get("source")),
  };

  // current_performance is no longer on the /book form; let the schema
  // default it rather than failing the enum on an empty string.
  const parsed = bookingRequestSchema.safeParse({
    ...raw,
    subjects,
    current_performance: raw.current_performance || undefined,
  });
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
  const hasOther = parsed.data.subjects.includes("other");
  const row = {
    child_name: parsed.data.child_name,
    child_age: parsed.data.child_age,
    child_grade: parsed.data.child_grade,
    curriculum: parsed.data.curriculum,
    curriculum_other:
      parsed.data.curriculum === "other" ? parsed.data.curriculum_other : null,
    subject: primarySubject(parsed.data.subjects),
    subjects: parsed.data.subjects,
    subject_other: hasOther ? parsed.data.subject_other : null,
    learning_needs: parsed.data.learning_needs,
    current_performance: parsed.data.current_performance,
    concerns: parsed.data.concerns || null,
    parent_name: parsed.data.parent_name,
    parent_phone: parsed.data.parent_phone,
    parent_email: parsed.data.parent_email,
    source: parsed.data.source,
  };
  let { error: dbError } = await supabase.from("booking_requests").insert(row);

  // Deployed ahead of migration 0040 (no subjects/subject_other columns yet,
  // and `subject` can't be 'other'): save the old shape instead, with every
  // ticked subject written into `concerns` so nothing the parent chose is
  // lost. Only possible when at least one standard subject was ticked.
  if (
    dbError &&
    (dbError.code === "PGRST204" || dbError.code === "23514") &&
    parsed.data.subjects.some((s) => (subjectValues as readonly string[]).includes(s))
  ) {
    console.warn("[booking] retrying insert without 0040 columns:", dbError.message);
    const { subjects: _s, subject_other: _o, ...legacy } = row;
    void _s;
    void _o;
    ({ error: dbError } = await supabase.from("booking_requests").insert({
      ...legacy,
      concerns: `Subjects: ${describeSubjects(parsed.data.subjects, parsed.data.subject_other)}`,
    }));
  }

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

  // 4. Best-effort email. `channel` is which /book button was pressed; it
  // only changes the email (so the team knows to reply on WhatsApp), not
  // the stored row.
  const channel =
    String(formData.get("channel") ?? "") === "whatsapp" ? "whatsapp" : "calendar";
  try {
    const result = await sendBookingRequestEmail(parsed.data, channel);
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
