/**
 * Mapping utilities for the 1–10 understanding / confidence scale used on
 * lesson reports. The six named levels and the 1→2→4→6→8→9→10 bucket split
 * mirror the inspiration dashboard so teacher input and parent / admin read
 * views stay in lockstep.
 *
 * The behaviours sliders (participation / focus / homework) and the per-skill
 * tracker use a simpler 0..10 numeric scale without named levels — they are
 * rendered via `BatteryBars` and need no mapping here.
 */

export const understandingLabels = [
  "Struggling",
  "Emerging",
  "Developing",
  "Secure",
  "Proficient",
  "Mastery",
] as const;

export const confidenceLabels = [
  "Withdrawn",
  "Hesitant",
  "Developing",
  "Assured",
  "Confident",
  "Exceptional",
] as const;

export type UnderstandingLabel = (typeof understandingLabels)[number];
export type ConfidenceLabel = (typeof confidenceLabels)[number];

/** Tone used by `<StatusBadge>` for each bucket. */
export type BucketTone = "gray" | "amber" | "green";

/**
 * Collapse a 1–10 rating into one of six buckets, preserving the
 * inspiration's curve (the top end splits so 9 and 10 become distinct
 * levels, which is what gives parents the "mastery vs proficient" read).
 *
 * Ranges: 1–2 → 0, 3–4 → 1, 5–6 → 2, 7–8 → 3, 9 → 4, 10 → 5.
 *
 * Values outside 1..10 clamp to the nearest end. Non-finite input returns 0.
 */
export function bucket6(v: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (!Number.isFinite(v)) return 0;
  const n = Math.round(v);
  if (n <= 2) return 0;
  if (n <= 4) return 1;
  if (n <= 6) return 2;
  if (n <= 8) return 3;
  if (n === 9) return 4;
  return 5;
}

export function understandingLabel(v: number): UnderstandingLabel {
  return understandingLabels[bucket6(v)];
}

export function confidenceLabel(v: number): ConfidenceLabel {
  return confidenceLabels[bucket6(v)];
}

/**
 * Maps a bucket index to the subdued / mid / strong tone used in the
 * inspiration's badge palette:
 *   0..1 → gray   (early)
 *   2..3 → amber  (developing)
 *   4..5 → green  (competent / exceptional)
 */
export function bucketTone(i: 0 | 1 | 2 | 3 | 4 | 5): BucketTone {
  if (i <= 1) return "gray";
  if (i <= 3) return "amber";
  return "green";
}

/**
 * Convenience: one call returns everything a <StatusBadge> needs for a
 * given 1–10 rating on the understanding axis.
 */
export function understandingBadge(v: number): {
  label: UnderstandingLabel;
  tone: BucketTone;
  bucket: 0 | 1 | 2 | 3 | 4 | 5;
} {
  const b = bucket6(v);
  return { label: understandingLabels[b], tone: bucketTone(b), bucket: b };
}

/** Same as `understandingBadge` but on the confidence axis. */
export function confidenceBadge(v: number): {
  label: ConfidenceLabel;
  tone: BucketTone;
  bucket: 0 | 1 | 2 | 3 | 4 | 5;
} {
  const b = bucket6(v);
  return { label: confidenceLabels[b], tone: bucketTone(b), bucket: b };
}
