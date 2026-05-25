declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type TrackEventMap = {
  click_book_session: { source: "nav" | "hero" | "pricing"; tier?: string };
  booking_form_submit: { source: string };
  booking_complete: Record<string, never>;
};

export function trackEvent<K extends keyof TrackEventMap>(
  name: K,
  params?: TrackEventMap[K],
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}
