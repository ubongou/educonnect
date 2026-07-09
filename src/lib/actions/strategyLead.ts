"use server";

import {
  strategyLeadSchema,
  normalizeSource,
  strategySubjectValues,
  type StrategySubject,
} from "@/lib/strategy/schema";
import { appendToGoogleSheet } from "@/lib/integrations/googleSheets";
import { createZohoLead } from "@/lib/integrations/zohoCrm";
import { sendStrategyLeadFailureEmail } from "@/lib/email/sendStrategyLeadFailure";

export type SubmitStrategyLeadState =
  | null
  | {
      status: "error";
      fieldErrors: Record<string, string>;
      formError?: string;
      values: Record<string, string>;
    }
  // Always returned on a valid submission — the modal reveals the calendar.
  | { status: "success" };

const isSubject = (v: string): v is StrategySubject =>
  (strategySubjectValues as readonly string[]).includes(v);

/**
 * Strategy-session landing-page submission. SEPARATE from submitBookingRequest
 * (which serves /book). Order:
 *   1. Honeypot — silent success for bots.
 *   2. Zod parse. Failure => field errors + typed values for re-render.
 *   3. Best-effort fan-out to Google Sheets + Zoho CRM (never blocks the user).
 *   4. If BOTH exports fail, email the admin so the lead isn't lost.
 *   5. Always return success so the caller reveals the inline calendar.
 *
 * There is deliberately no Supabase insert and no routine admin email here —
 * the Sheet + Zoho are the record of truth (see plan).
 */
export async function submitStrategyLead(
  _prev: SubmitStrategyLeadState,
  formData: FormData,
): Promise<SubmitStrategyLeadState> {
  // 1. Honeypot
  if (String(formData.get("_hp") ?? "").length > 0) {
    return { status: "success" };
  }

  // 2. Zod parse. `subjects` arrives as repeated form entries.
  const subjects = formData
    .getAll("subjects")
    .map(String)
    .filter(isSubject);

  const raw = {
    child_age_range: String(formData.get("child_age_range") ?? ""),
    school_level: String(formData.get("school_level") ?? ""),
    parent_name: String(formData.get("parent_name") ?? ""),
    tutored_before: String(formData.get("tutored_before") ?? ""),
    timeline: String(formData.get("timeline") ?? ""),
    country: String(formData.get("country") ?? ""),
    parent_phone: String(formData.get("parent_phone") ?? ""),
    subjects,
    subject_other: String(formData.get("subject_other") ?? ""),
    parent_email: String(formData.get("parent_email") ?? ""),
    source: normalizeSource(formData.get("source")),
  };

  const parsed = strategyLeadSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // Echo scalar values back for re-render (arrays handled client-side).
    const values: Record<string, string> = {
      child_age_range: raw.child_age_range,
      school_level: raw.school_level,
      parent_name: raw.parent_name,
      tutored_before: raw.tutored_before,
      timeline: raw.timeline,
      country: raw.country,
      parent_phone: raw.parent_phone,
      subject_other: raw.subject_other,
      parent_email: raw.parent_email,
    };
    return { status: "error", fieldErrors, values };
  }

  // 3. Best-effort fan-out. Neither export blocks the visitor.
  const [sheet, zoho] = await Promise.allSettled([
    appendToGoogleSheet(parsed.data),
    createZohoLead(parsed.data),
  ]);

  const errors: string[] = [];
  const failed = (r: PromiseSettledResult<{ ok: boolean; error?: string }>) => {
    if (r.status === "rejected") {
      errors.push(String(r.reason));
      return true;
    }
    if (!r.value.ok) {
      errors.push(r.value.error ?? "unknown error");
      return true;
    }
    return false;
  };

  const sheetFailed = failed(sheet);
  const zohoFailed = failed(zoho);
  if (errors.length) console.error("[strategy-lead] export issues:", errors);

  // 4. Only escalate when BOTH exports failed (skips don't count as failures).
  if (sheetFailed && zohoFailed) {
    try {
      const result = await sendStrategyLeadFailureEmail(parsed.data, errors);
      if (!result.ok) {
        console.error("[strategy-lead] failure email failed:", result.error);
      }
    } catch (err) {
      console.error("[strategy-lead] failure email threw:", err);
    }
  }

  // 5. Always succeed for the visitor.
  return { status: "success" };
}
