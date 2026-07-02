"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { trackEvent, trackPixel } from "@/lib/analytics";
import { recordStrategyLead } from "./leadCapture";

// The one canonical booking destination for this landing page.
const BOOKING_URL = "https://calendar.app.google/uPs5DX9NQVngs4qx5";

// The single, canonical CTA label. Do not vary this anywhere on the page.
export const CTA_LABEL = "Book My Free Strategy Session";

// Meta standard event fired on click. "Schedule" best matches a booking intent;
// switch to "Lead" here if the ad set is optimised for the Lead event instead.
const PIXEL_EVENT = "Schedule";

// UTM keys forwarded to the booking link (best effort) for attribution.
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function buildBookingUrl(): string {
  if (typeof window === "undefined") return BOOKING_URL;
  const incoming = new URLSearchParams(window.location.search);
  const forwarded = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = incoming.get(key);
    if (value) forwarded.set(key, value);
  }
  const qs = forwarded.toString();
  return qs ? `${BOOKING_URL}?${qs}` : BOOKING_URL;
}

export function StrategyCTA({
  source,
  className,
  block = false,
}: {
  /** Where on the page this CTA sits, for analytics (e.g. "hero", "final"). */
  source: string;
  className?: string;
  /** Full-width button. */
  block?: boolean;
}) {
  // SSR / no-JS renders the bare booking URL; once mounted we upgrade the
  // anchor's href in place with any incoming UTM params (a direct DOM update,
  // so there is no hydration mismatch and no cascading re-render).
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.href = buildBookingUrl();
  }, []);

  const handleClick = () => {
    // 1. Meta Pixel: real booking intent for ad optimisation.
    trackPixel(PIXEL_EVENT, { content_name: "strategy_session", source });
    // 2. Google Analytics (no-op if GA is not configured).
    trackEvent("book_strategy_session", { source });
    // 3. Optional attribution capture (best-effort, non-blocking).
    recordStrategyLead(source);
  };

  return (
    <a
      ref={ref}
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      data-cta="strategy-session"
      className={clsx("btn btn-coral ss-cta", block && "ss-cta-block", className)}
    >
      {CTA_LABEL}
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
