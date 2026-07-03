// -----------------------------------------------------------------------------
// Optional lead-capture module for /strategy-session
// STUBBED BY DEFAULT — safe to ship, and easy to remove.
// -----------------------------------------------------------------------------
// On each CTA click this records a lightweight attribution record:
//   { timestamp, utm_source, utm_campaign, utm_content, referrer, source }
//
// It is a no-op by default so the landing page can launch with zero backend
// dependency and zero shipping risk. Activate it with ONE of the options below.
//
//   (A) Supabase: create the `strategy_leads` table (SQL at the bottom of this
//       file), then uncomment the Supabase block in recordStrategyLead().
//   (B) Google Sheet / webhook: set NEXT_PUBLIC_LEAD_CAPTURE_URL to an endpoint
//       (e.g. an Apps Script web app URL). The beacon block will POST to it.
//
// To remove entirely: delete this file and the `recordStrategyLead(...)` call
// inside StrategyBooking.tsx (openForm).
// -----------------------------------------------------------------------------

type LeadPayload = {
  timestamp: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer: string;
  source: string;
};

function collect(source: string): LeadPayload {
  const params = new URLSearchParams(window.location.search);
  return {
    timestamp: new Date().toISOString(),
    utm_source: params.get("utm_source"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    referrer: document.referrer || "",
    source,
  };
}

/**
 * Best-effort, fire-and-forget. Wrapped in try/catch so attribution logging can
 * never interrupt the booking click.
 */
export function recordStrategyLead(source: string): void {
  if (typeof window === "undefined") return;
  try {
    const payload = collect(source);

    // --- Default: no-op stub (dev-only console trace). ---
    if (process.env.NODE_ENV !== "production") {
      console.debug("[strategy-lead] (stub) would record:", payload);
    }

    // --- Option (B): fire-and-forget beacon to a webhook / Sheet endpoint. ---
    const endpoint = process.env.NEXT_PUBLIC_LEAD_CAPTURE_URL;
    if (endpoint && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    }

    // --- Option (A): Supabase insert. Uncomment after creating the table. ---
    // TODO: enable once `strategy_leads` exists (see SQL below).
    // import { createClient } from "@/lib/supabase/browser"; // move to top of file
    // void createClient().from("strategy_leads").insert(payload);
  } catch {
    // Swallow: logging must never break the booking flow.
  }
}

// -----------------------------------------------------------------------------
// SQL for option (A) — run in the Supabase SQL editor:
//
//   create table strategy_leads (
//     id          uuid primary key default gen_random_uuid(),
//     created_at  timestamptz not null default now(),
//     utm_source  text,
//     utm_campaign text,
//     utm_content text,
//     referrer    text,
//     source      text
//   );
//   alter table strategy_leads enable row level security;
//   create policy "anon can insert leads"
//     on strategy_leads for insert to anon with check (true);
// -----------------------------------------------------------------------------
