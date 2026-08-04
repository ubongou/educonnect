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
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {});
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
