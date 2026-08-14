import type { PixelUserData } from "@/lib/analytics";

// Hands a captured lead's info from the booking modal to
// /strategy-session/booked, which fires the Meta Lead event on a real page
// load instead of from the form's submit handler — this avoids whatever
// button-click-triggered heuristic was generating a stray "Lead" event on
// invalid submissions.
//
// Two keys, deliberately:
//   ss_lead         the details themselves. They must SURVIVE a page reload,
//                   because /booked keeps using them long after load — to
//                   prefill the Cal.com booking form and to attach Advanced
//                   Matching to the `Schedule` event when a slot is picked.
//   ss_lead_pending a one-shot flag saying "the Lead event has not fired yet".
//                   Cleared the first time it is read, so a refresh cannot
//                   double-count the conversion.
const LEAD_KEY = "ss_lead";
const LEAD_PENDING_KEY = "ss_lead_pending";

export type LeadHandoff = PixelUserData & { source: string };

export function stashLead(data: LeadHandoff): void {
  try {
    sessionStorage.setItem(LEAD_KEY, JSON.stringify(data));
    sessionStorage.setItem(LEAD_PENDING_KEY, "1");
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — the booked page
    // just won't have anything to fire. Never block navigation over this.
  }
}

/** Reads the lead without consuming it. Safe to call on every render/reload. */
export function readLead(): LeadHandoff | null {
  try {
    const raw = sessionStorage.getItem(LEAD_KEY);
    return raw ? (JSON.parse(raw) as LeadHandoff) : null;
  } catch {
    return null;
  }
}

/**
 * Returns the lead only on the FIRST call after a submission, then never
 * again — so the Meta `Lead` conversion fires exactly once no matter how many
 * times the visitor reloads /booked.
 */
export function takeLeadForConversion(): LeadHandoff | null {
  try {
    if (sessionStorage.getItem(LEAD_PENDING_KEY) !== "1") return null;
    sessionStorage.removeItem(LEAD_PENDING_KEY);
    return readLead();
  } catch {
    return null;
  }
}
