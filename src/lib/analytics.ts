declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

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
