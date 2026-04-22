"use client";

import { useId } from "react";
import clsx from "clsx";
import {
  bucket6,
  bucketTone,
  confidenceLabels,
  understandingLabels,
  type BucketTone,
} from "@/lib/scales";
import { StatusBadge } from "./StatusBadge";

type Axis = "understanding" | "confidence";

const labelsByAxis: Record<Axis, readonly string[]> = {
  understanding: understandingLabels,
  confidence: confidenceLabels,
};

const toneBadge: Record<BucketTone, "gray" | "amber" | "green"> = {
  gray: "gray",
  amber: "amber",
  green: "green",
};

/**
 * 1–10 range slider with a numeric readout and a live bucket label next to
 * it — e.g. 8 → "Secure" (amber) on the understanding axis, 9 → "Confident"
 * (green) on the confidence axis. Renders the six level names below the
 * track as a legend so the scale is self-explanatory.
 *
 * Used by the teacher lesson-report composer; read-only mode is used by
 * the parent report viewer so both sides read the same words.
 */
export function RatingScaleSlider({
  axis,
  value,
  onChange,
  label,
  readOnly = false,
  className,
}: {
  axis: Axis;
  value: number;
  onChange?: (next: number) => void;
  label: string;
  readOnly?: boolean;
  className?: string;
}) {
  const id = useId();
  const bucket = bucket6(value);
  const tone = bucketTone(bucket);
  const levels = labelsByAxis[axis];
  const levelText = levels[bucket];

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="font-heading text-[13px] font-semibold text-navy"
        >
          {label}
          <span className="ml-2 font-sans text-[11px] font-normal text-g400">
            1–10 · six levels
          </span>
        </label>
        <div className="flex items-center gap-2">
          <span className="font-heading text-[13px] font-bold text-navy tabular-nums">
            {value}
          </span>
          <StatusBadge tone={toneBadge[tone]}>{levelText}</StatusBadge>
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={1}
        max={10}
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange?.(Number(e.target.value))}
        aria-label={`${label}: ${value} out of 10 (${levelText})`}
        className="w-full accent-coral disabled:opacity-60"
      />

      <div className="flex justify-between text-[10px] text-g400">
        {levels.map((l) => (
          <span key={l} className="w-[16.6%] text-center">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
