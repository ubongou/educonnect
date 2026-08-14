declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

// Single source of truth for the Meta Pixel ID. The base pixel is initialised
// in app/layout.tsx; setPixelUserData() re-inits with the same ID to attach
// Advanced Matching (see below).
export const META_PIXEL_ID = "2654550048294305";

// Microsoft Clarity project ID. Session recordings and heatmaps, loaded
// site-wide from app/layout.tsx. Clarity must be initialised exactly once per
// page: a second copy on any route causes conflicting recordings.
export const CLARITY_PROJECT_ID = "xx6pbi4wnv";

type TrackEventMap = {
  click_book_session: { source: "nav" | "hero" | "pricing"; tier?: string };
  booking_form_submit: { source: string };
  booking_complete: Record<string, never>;
  // Strategy-session landing page (/strategy-session)
  book_strategy_session: { source: string };
  /** The visitor picked a slot on /booked — the real business conversion. */
  strategy_session_booked: { source: string };
  scroll_depth: { percent: 25 | 50 | 75 | 100 };
};

export function trackEvent<K extends keyof TrackEventMap>(
  name: K,
  params?: TrackEventMap[K],
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

/**
 * Fire a Meta Pixel standard event (e.g. "Schedule", "Lead"). The base pixel is
 * loaded globally in app/layout.tsx, so this only needs to `track`. No-op when
 * the pixel has not loaded (ad blockers, no-JS) so it never breaks a flow.
 */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>,
  /** `{ eventID }` — lets a matching Conversions API event deduplicate. */
  options?: { eventID: string },
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (options) window.fbq("track", event, params ?? {}, options);
  else window.fbq("track", event, params ?? {});
}

/**
 * Fire a NON-standard pixel event. Use this for anything Meta doesn't already
 * have a defined meaning for — reusing a standard event name for a different
 * action corrupts what ad delivery learns from it.
 */
export function trackCustomPixel(
  event: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", event, params ?? {});
}

/** Customer info captured from a form, used for Meta Advanced Matching. */
export type PixelUserData = {
  email?: string;
  phone?: string;
  /** Full name; split into first/last for the pixel. */
  name?: string;
};

/**
 * Attach Advanced Matching data to the pixel so Meta can match conversions to
 * the person who clicked the ad (raises "event match quality"). Re-calling
 * `fbq('init', id, userData)` updates the user data for all subsequent events;
 * it does NOT re-fire PageView. fbevents.js normalises and SHA-256-hashes every
 * field in the browser before it is sent, so no plaintext PII leaves the page.
 * No-op when the pixel has not loaded or there is nothing to send.
 */
export function setPixelUserData({ email, phone, name }: PixelUserData): void {
  if (typeof window === "undefined" || !window.fbq) return;
  const data: Record<string, string> = {};
  if (email) data.em = email.trim().toLowerCase();
  if (phone) data.ph = phone;
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts[0]) data.fn = parts[0];
    if (parts.length > 1) data.ln = parts[parts.length - 1];
  }
  if (Object.keys(data).length === 0) return;
  window.fbq("init", META_PIXEL_ID, data);
}

// -----------------------------------------------------------------------------
// Strategy-session composed events. Each business event (booking modal opened,
// lead captured) bundles GA + Pixel + Advanced Matching in one call, so a call
// site never has to remember to pair them up itself.
// -----------------------------------------------------------------------------

/**
 * Fires when the strategy-session booking modal opens (a CTA click).
 *
 * Deliberately a CUSTOM pixel event, not the standard `Schedule`. Meta reads
 * `Schedule` as "an appointment was booked", and this is only "a form was
 * opened" — sending it here would train ad delivery on modal-openers. The real
 * `Schedule` is fired by trackBookingCompleted() below.
 */
export function trackScheduleOpened(source: string): void {
  trackCustomPixel("StrategyFormOpened", {
    content_name: "strategy_session",
    source,
  });
  trackEvent("book_strategy_session", { source });
}

/**
 * Fires when the visitor actually picks a slot on /booked — i.e. a consultation
 * exists in the calendar. THIS is the event Meta campaigns should optimise for;
 * `Lead` (form submitted) is a diagnostic only.
 *
 * Cal.com's embed reports this to the parent page via its `bookingSuccessful`
 * callback, so it fires client-side. A Cal webhook -> Conversions API relay
 * should send the same event server-side for the ~20% of browsers that block
 * the pixel; both carry the same event_id so Meta deduplicates them.
 */
export function trackBookingCompleted(
  source: string,
  userData: PixelUserData,
  eventId?: string,
): void {
  setPixelUserData(userData);
  trackPixel(
    "Schedule",
    { content_name: "strategy_session", source },
    eventId ? { eventID: eventId } : undefined,
  );
  trackEvent("strategy_session_booked", { source });
}

/**
 * Fires once a strategy-session lead is genuinely captured — i.e. the server
 * validated the submission and it wasn't a honeypot catch. Attaches Advanced
 * Matching before the Lead event so it carries it.
 */
export function trackLeadSubmitted(source: string, userData: PixelUserData): void {
  setPixelUserData(userData);
  trackPixel("Lead", { content_name: "strategy_session", source });
  trackEvent("booking_complete", {});
}
