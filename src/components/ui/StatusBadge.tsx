import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone = "gray" | "amber" | "green" | "blue" | "coral";

const toneClasses: Record<BadgeTone, string> = {
  gray: "border-g400/40 bg-g100 text-g600",
  amber: "border-yellow/60 bg-yellow/20 text-navy",
  green: "border-blue/40 bg-blue/10 text-blue",
  blue: "border-blue/40 bg-blue/10 text-blue",
  coral: "border-coral/40 bg-coral/10 text-coral",
};

/**
 * Small, reusable labelled badge. Tones match the inspiration's bg-green /
 * bg-amber / bg-gray / bg-blue palette but rethemed onto EduConnect tokens:
 *
 *   gray   — subdued / early stages (Struggling, Hesitant)
 *   amber  — developing (Developing, Secure)
 *   green  — competent / exceptional (Proficient, Confident, Mastery)
 *            reusing blue so the brand palette stays consistent (we don't
 *            have a brand green token)
 *   blue   — informational (Upcoming, Scheduled, status-like labels)
 *   coral  — negative / attention (Rejected, Cancelled, errors)
 *
 * Drop into any row: `<StatusBadge tone="amber">Developing</StatusBadge>`.
 */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill border-[1.5px] px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
