"use server";

import { after } from "next/server";
import {
  strategyLeadSchema,
  normalizeSource,
  strategySubjectValues,
  type StrategyLeadInput,
  type StrategySubject,
} from "@/lib/strategy/schema";
import { appendToGoogleSheet } from "@/lib/integrations/googleSheets";
import { addToZohoCampaigns } from "@/lib/integrations/zohoCampaigns";
import { sendStrategyLeadFailureEmail } from "@/lib/email/sendStrategyLeadFailure";

export type SubmitStrategyLeadResult =
  | { status: "error"; fieldErrors: Record<string, string>; formError?: string }
  // Genuine, validated submission — exported (best-effort) and tracked.
  | { status: "success" }
  // Honeypot catch: the caller should still reveal the calendar (so a scraper
  // never learns the trap exists) but must skip export and tracking entirely.
  | { status: "ignored" };

const isSubject = (v: string): v is StrategySubject =>
  (strategySubjectValues as readonly string[]).includes(v);

/**
 * Pushes a validated lead to Google Sheets and Zoho Campaigns, and emails the
 * admin if either misses. Runs inside `after()`, so it must never throw: an
 * unhandled rejection here would be invisible to the visitor but could fail the
 * serverless invocation. Every branch is caught and logged.
 */
async function exportLead(lead: StrategyLeadInput): Promise<void> {
  try {
    const [sheet, zoho] = await Promise.allSettled([
      appendToGoogleSheet(lead),
      addToZohoCampaigns(lead),
    ]);

    const errors: string[] = [];
    const failed = (
      r: PromiseSettledResult<{ ok: boolean; error?: string }>,
    ) => {
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

    // Escalate on ANY export failure (skips don't count as failures) — a lead
    // that silently misses just one sink is still a lost lead if nobody notices.
    if (!sheetFailed && !zohoFailed) return;

    const failedSinks = [
      sheetFailed && "Google Sheets",
      zohoFailed && "Zoho Campaigns",
    ].filter((v): v is string => Boolean(v));
    const result = await sendStrategyLeadFailureEmail(lead, errors, failedSinks);
    if (!result.ok) {
      console.error("[strategy-lead] failure email failed:", result.error);
    }
  } catch (err) {
    console.error("[strategy-lead] export threw:", err);
  }
}

/**
 * Strategy-session landing-page submission. SEPARATE from submitBookingRequest
 * (which serves /book). Order:
 *   1. Honeypot — "ignored", no export, no analytics.
 *   2. Zod parse. Failure => field errors.
 *   3. Return "success" immediately; the caller navigates and fires analytics.
 *   4. AFTER the response is sent, fan out to Google Sheets + Zoho Campaigns,
 *      and email the admin if either misses (see exportLead above).
 *
 * There is deliberately no Supabase insert and no routine admin email here —
 * the Sheet + Zoho are the record of truth (see plan).
 */
export async function submitStrategyLead(
  formData: FormData,
): Promise<SubmitStrategyLeadResult> {
  // 1. Honeypot.
  if (String(formData.get("_hp") ?? "").length > 0) {
    return { status: "ignored" };
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
    country_other: String(formData.get("country_other") ?? ""),
    parent_phone: String(formData.get("parent_phone") ?? ""),
    subjects,
    subject_other: String(formData.get("subject_other") ?? ""),
    parent_email: String(formData.get("parent_email") ?? ""),
    contact_method: String(formData.get("contact_method") ?? ""),
    source: normalizeSource(formData.get("source")),
  };

  const parsed = strategyLeadSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", fieldErrors };
  }

  // 3. Fan out AFTER the response is sent.
  //
  // This used to be awaited inline, which meant the parent sat on a spinner
  // while a Google Apps Script cold start and a Zoho token refresh plus contact
  // create completed, and then a failure email on top of that if either missed.
  // Measured against production, the action itself costs ~195ms; everything
  // beyond that was these calls. Nothing the visitor does next depends on them
  // (the action returns "success" regardless), so they belong off the critical
  // path. The admin still gets the failure email either way.
  after(() => exportLead(parsed.data));

  // 5. Always succeed for the visitor.
  return { status: "success" };
}
