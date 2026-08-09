"use client";

import { inputBase } from "@/components/ui/FormField";
import { ADJUSTMENT_OPTIONS, type AdjustmentMode } from "@/lib/payments/adjustments";
import { formatNaira } from "@/lib/payments/plans";

export type DraftAdjustment = {
  key: string;
  optionId: string;
  mode: AdjustmentMode;
  value: string;
};

export function newDraftAdjustment(): DraftAdjustment {
  return {
    key: crypto.randomUUID(),
    optionId: ADJUSTMENT_OPTIONS[0].id,
    mode: "naira",
    value: "",
  };
}

/**
 * Editable list of a plan's discount/add-on lines, shared by the New Plan
 * form and the Renew dialog so the two never drift apart. `resolvedByKey`
 * carries each line's live naira amount — the caller owns resolving it
 * (against whatever subtotal is currently in play) so this stays a dumb list
 * editor.
 */
export function PlanAdjustmentsEditor({
  adjustments,
  onChange,
  resolvedByKey,
}: {
  adjustments: DraftAdjustment[];
  onChange: (next: DraftAdjustment[]) => void;
  resolvedByKey: Map<string, number>;
}) {
  const patch = (key: string, p: Partial<DraftAdjustment>) =>
    onChange(adjustments.map((a) => (a.key === key ? { ...a, ...p } : a)));
  const remove = (key: string) => onChange(adjustments.filter((a) => a.key !== key));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[13px] font-medium text-navy">
          Discounts &amp; add-ons
        </span>
        <button
          type="button"
          onClick={() => onChange([...adjustments, newDraftAdjustment()])}
          className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
        >
          + Add a line
        </button>
      </div>

      {adjustments.map((a) => (
        <div key={a.key} className="flex flex-wrap items-center gap-2">
          <select
            value={a.optionId}
            onChange={(e) => patch(a.key, { optionId: e.target.value })}
            aria-label="Adjustment type"
            className={`${inputBase} w-auto min-w-[190px] py-2`}
          >
            <optgroup label="Discounts">
              {ADJUSTMENT_OPTIONS.filter((o) => o.kind === "discount").map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Add-ons">
              {ADJUSTMENT_OPTIONS.filter((o) => o.kind === "addon").map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          </select>

          <select
            value={a.mode}
            onChange={(e) => patch(a.key, { mode: e.target.value as AdjustmentMode })}
            aria-label="Amount type"
            className={`${inputBase} w-auto py-2`}
          >
            <option value="naira">₦ amount</option>
            <option value="percent">% of subtotal</option>
          </select>

          <input
            type="number"
            min={0}
            step="any"
            value={a.value}
            onChange={(e) => patch(a.key, { value: e.target.value })}
            placeholder={a.mode === "percent" ? "10" : "40000"}
            aria-label="Amount"
            className={`${inputBase} w-[120px] py-2`}
          />

          <span className="min-w-[110px] text-right font-heading text-[13px] font-semibold tabular-nums text-navy">
            {formatNaira(resolvedByKey.get(a.key) ?? 0)}
          </span>

          <button
            type="button"
            onClick={() => remove(a.key)}
            className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
