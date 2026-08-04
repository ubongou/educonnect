/**
 * The fixed vocabulary of receipt line items that can sit on top of a plan's
 * `sessions × rate` subtotal.
 *
 * Labels come from this list rather than free text so the same discount always
 * reads the same way on every receipt, and so discounts can be totalled across
 * plans later without string-matching. Adding one is a deploy, not a migration
 * — the column is plain text.
 */

export type AdjustmentKind = "discount" | "addon";

export type AdjustmentOption = {
  id: string;
  label: string;
  kind: AdjustmentKind;
};

export const ADJUSTMENT_OPTIONS: readonly AdjustmentOption[] = [
  { id: "sibling", label: "Sibling discount", kind: "discount" },
  { id: "referral", label: "Referral discount", kind: "discount" },
  { id: "loyalty", label: "Loyalty discount", kind: "discount" },
  { id: "early_bird", label: "Early-bird discount", kind: "discount" },
  { id: "promotional", label: "Promotional discount", kind: "discount" },
  { id: "goodwill", label: "Goodwill adjustment", kind: "discount" },
  { id: "scholarship", label: "Scholarship", kind: "discount" },
  { id: "materials", label: "Materials fee", kind: "addon" },
  { id: "exam_prep", label: "Exam prep add-on", kind: "addon" },
  { id: "extra_session", label: "Extra session", kind: "addon" },
  { id: "transfer_fee", label: "Transfer fee", kind: "addon" },
] as const;

export function adjustmentOption(id: string): AdjustmentOption | undefined {
  return ADJUSTMENT_OPTIONS.find((o) => o.id === id);
}

export function isAdjustmentId(id: string | undefined): boolean {
  return ADJUSTMENT_OPTIONS.some((o) => o.id === id);
}

/** How the admin typed the value in. Both resolve to a naira amount on save. */
export type AdjustmentMode = "naira" | "percent";

/**
 * Resolves a typed-in adjustment to the signed naira amount stored on the row.
 *
 * Percentages are taken against the subtotal (sessions × rate), never against a
 * running total — so two 10% discounts are 20% off the list price, not 19%,
 * which is what anyone reading the receipt will expect.
 *
 * The sign is owned by the option's `kind`, not by the typed value: an admin
 * entering "10" against "Sibling discount" means ten percent *off*. A stray
 * minus sign in the input is ignored rather than flipping a discount into a
 * surcharge.
 */
export function resolveAdjustmentAmount(input: {
  kind: AdjustmentKind;
  mode: AdjustmentMode;
  value: number;
  subtotalNgn: number;
}): number {
  const magnitude =
    input.mode === "percent"
      ? (Math.abs(input.value) / 100) * input.subtotalNgn
      : Math.abs(input.value);
  // Naira, to the kobo — matches numeric(12,2) in the database.
  const rounded = Math.round(magnitude * 100) / 100;
  return input.kind === "discount" ? -rounded : rounded;
}
