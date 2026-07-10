import {
  formatSource,
  formatSubjects,
  ageRangeLabel,
  schoolLevelLabel,
  tutoredBeforeLabel,
  timelineLabel,
  contactMethodLabel,
  type StrategyLeadInput,
} from "@/lib/strategy/schema";

export type SheetExportResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Appends a strategy-session lead as a row in a Google Sheet by POSTing to a
 * Google Apps Script Web App (`doPost`) whose URL lives in
 * STRATEGY_SHEETS_WEBHOOK_URL. This avoids a Google Cloud project / service
 * account entirely — the Apps Script runs as the sheet owner.
 *
 * A shared secret (STRATEGY_SHEETS_WEBHOOK_SECRET) is sent so the script can
 * reject anonymous internet traffic. Missing URL => skipped (so local dev and
 * preview deploys without the secret still run).
 */
export async function appendToGoogleSheet(
  input: StrategyLeadInput,
): Promise<SheetExportResult> {
  const url = process.env.STRATEGY_SHEETS_WEBHOOK_URL;
  if (!url) {
    return { ok: true, skipped: true, reason: "STRATEGY_SHEETS_WEBHOOK_URL not set" };
  }

  const payload = {
    secret: process.env.STRATEGY_SHEETS_WEBHOOK_SECRET ?? "",
    submitted_at: new Date().toISOString(),
    source: formatSource(input.source),
    full_name: input.parent_name,
    email: input.parent_email,
    phone: input.parent_phone,
    country: input.country,
    child_age_range: ageRangeLabel[input.child_age_range],
    school_level: schoolLevelLabel[input.school_level],
    tutored_before: tutoredBeforeLabel[input.tutored_before],
    timeline: timelineLabel[input.timeline],
    subjects: formatSubjects(input),
    contact_method: contactMethodLabel[input.contact_method],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Apps Script only exposes the raw body; the secret is inside it too,
        // but we also send a header for scripts that prefer to read it there.
        "x-webhook-secret": process.env.STRATEGY_SHEETS_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: "follow", // Apps Script /exec 302-redirects to script.googleusercontent.com
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Sheets webhook HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
      };
    }
    // Apps Script always returns HTTP 200, so inspect the JSON body it returns:
    // { ok: false, error } means the script ran but refused the row (e.g. a
    // mismatched secret). Treat that as a real failure so the fallback fires.
    // Non-JSON or { ok: true } is treated as success (backward compatible).
    const text = await res.text().catch(() => "");
    let parsed: { ok?: boolean; error?: string } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (parsed && parsed.ok === false) {
      return {
        ok: false,
        error: `Sheets webhook rejected: ${parsed.error ?? "unknown error"}`,
      };
    }
    return { ok: true, skipped: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sheets webhook request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}
