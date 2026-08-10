import type { PixelUserData } from "@/lib/analytics";

// Hands a captured lead's info from the booking modal to
// /strategy-session/booked, which fires the Meta Lead event on a real page
// load instead of from the form's submit handler — this avoids whatever
// button-click-triggered heuristic was generating a stray "Lead" event on
// invalid submissions.
const LEAD_HANDOFF_KEY = "ss_lead";

export type LeadHandoff = PixelUserData & { source: string };

export function stashLead(data: LeadHandoff): void {
  try {
    sessionStorage.setItem(LEAD_HANDOFF_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — the booked page
    // just won't have anything to fire. Never block navigation over this.
  }
}

/** Reads and clears the stashed lead so a page refresh can't re-fire it. */
export function takeLead(): LeadHandoff | null {
  try {
    const raw = sessionStorage.getItem(LEAD_HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LEAD_HANDOFF_KEY);
    return JSON.parse(raw) as LeadHandoff;
  } catch {
    return null;
  }
}
