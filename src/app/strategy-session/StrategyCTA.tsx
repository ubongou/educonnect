"use client";

import clsx from "clsx";
import { CTA_LABEL, useStrategyBooking } from "./StrategyBooking";

export { CTA_LABEL };

// Every CTA on the page routes into the same on-page flow: it opens the shared
// booking form in a modal, and on submit reveals the Google Calendar scheduler
// inline. No CTA leaves the domain.
export function StrategyCTA({
  source,
  className,
  block = false,
}: {
  /** Where on the page this CTA sits, for attribution (e.g. "ss-hero"). */
  source: string;
  className?: string;
  /** Full-width button. */
  block?: boolean;
}) {
  const { openForm } = useStrategyBooking();

  return (
    <button
      type="button"
      onClick={() => openForm(source)}
      data-cta="strategy-session"
      className={clsx("btn btn-coral ss-cta", block && "ss-cta-block", className)}
    >
      {CTA_LABEL}
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}
