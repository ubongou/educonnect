"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputBase } from "@/components/ui/FormField";
import { createPaymentPlan } from "@/lib/actions/payments";
import {
  ADJUSTMENT_OPTIONS,
  adjustmentOption,
  resolveAdjustmentAmount,
  type AdjustmentMode,
} from "@/lib/payments/adjustments";
import { formatNaira } from "@/lib/payments/plans";

export type PlanStudentOption = { id: string; label: string };
export type PlanPayerOption = { id: string; label: string };

/**
 * The published tiers, as defaults. Every field stays editable — discounted
 * rates are the norm, not the exception, so the preset is a starting point
 * rather than a constraint.
 */
const PRESETS = [
  { sessions: 8, rate: 20000, label: "8 sessions · ₦20,000/session" },
  { sessions: 24, rate: 18333, label: "24 sessions · ₦18,333/session" },
  { sessions: 48, rate: 17500, label: "48 sessions · ₦17,500/session" },
] as const;

type DraftAdjustment = {
  key: string;
  optionId: string;
  mode: AdjustmentMode;
  value: string;
};

/**
 * Issues a plan for one student. The same form serves brand-new parents and
 * legacy students being brought onto plans for the first time — the "attach
 * existing sessions" box is what covers the second case.
 *
 * Plans are created unpaid; marking them paid is a separate, deliberate step
 * once the transfer has actually landed.
 */
export function NewPlanForm({
  students,
  payers,
}: {
  students: PlanStudentOption[];
  payers: PlanPayerOption[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [payerId, setPayerId] = useState("");
  const [sessions, setSessions] = useState("8");
  const [rate, setRate] = useState("20000");
  const [notes, setNotes] = useState("");
  const [attachExisting, setAttachExisting] = useState(true);
  const [adjustments, setAdjustments] = useState<DraftAdjustment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sessionsNum = Number(sessions) || 0;
  const rateNum = Number(rate) || 0;
  const subtotal = sessionsNum * rateNum;

  // Live receipt preview, using the same resolver the server will use on save,
  // so what the admin sees here is what lands on the receipt.
  const resolved = useMemo(
    () =>
      adjustments.flatMap((a) => {
        const option = adjustmentOption(a.optionId);
        if (!option) return [];
        return [
          {
            key: a.key,
            label: option.label,
            amount: resolveAdjustmentAmount({
              kind: option.kind,
              mode: a.mode,
              value: Number(a.value) || 0,
              subtotalNgn: subtotal,
            }),
          },
        ];
      }),
    [adjustments, subtotal],
  );

  const total = resolved.reduce((sum, r) => sum + r.amount, subtotal);

  const addAdjustment = () => {
    setAdjustments((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        optionId: ADJUSTMENT_OPTIONS[0].id,
        mode: "naira",
        value: "",
      },
    ]);
  };

  const patchAdjustment = (key: string, patch: Partial<DraftAdjustment>) => {
    setAdjustments((prev) =>
      prev.map((a) => (a.key === key ? { ...a, ...patch } : a)),
    );
  };

  const submit = () => {
    setError(null);
    setSuccess(null);
    if (!studentId) {
      setError("Pick a child first.");
      return;
    }

    startTransition(async () => {
      const res = await createPaymentPlan({
        student_id: studentId,
        payer_id: payerId || null,
        sessions_total: sessionsNum,
        rate_per_session: rateNum,
        notes,
        attach_existing: attachExisting,
        adjustments: adjustments
          .filter((a) => Number(a.value) > 0)
          .map((a) => ({
            option_id: a.optionId,
            mode: a.mode,
            value: Number(a.value),
          })),
      });

      if (res.ok) {
        const attached =
          res.attached > 0
            ? ` ${res.attached} existing session${res.attached === 1 ? "" : "s"} attached.`
            : "";
        setSuccess(`Plan ${res.referenceCode} created (unpaid).${attached}`);
        setAdjustments([]);
        setNotes("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[13px] font-medium text-navy">Child</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={inputBase}
          >
            <option value="">Select a child…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[13px] font-medium text-navy">
            Paying parent <span className="text-g400">(optional)</span>
          </span>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className={inputBase}
          >
            <option value="">Not recorded</option>
            {payers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-[6px]">
        <span className="font-heading text-[13px] font-medium text-navy">Preset</span>
        <select
          onChange={(e) => {
            const preset = PRESETS[Number(e.target.value)];
            if (!preset) return;
            setSessions(String(preset.sessions));
            setRate(String(preset.rate));
          }}
          defaultValue=""
          className={inputBase}
        >
          <option value="">Custom — set sessions and rate below</option>
          {PRESETS.map((p, i) => (
            <option key={p.sessions} value={i}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[13px] font-medium text-navy">
            Number of sessions
          </span>
          <input
            type="number"
            min={1}
            max={200}
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            className={inputBase}
          />
        </label>
        <label className="flex flex-col gap-[6px]">
          <span className="font-heading text-[13px] font-medium text-navy">
            Rate per session (₦)
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={inputBase}
          />
        </label>
      </div>

      {/* Discounts and add-ons — each becomes a line on the receipt. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-[13px] font-medium text-navy">
            Discounts &amp; add-ons
          </span>
          <button
            type="button"
            onClick={addAdjustment}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            + Add a line
          </button>
        </div>

        {adjustments.map((a) => (
          <div key={a.key} className="flex flex-wrap items-center gap-2">
            <select
              value={a.optionId}
              onChange={(e) => patchAdjustment(a.key, { optionId: e.target.value })}
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
              onChange={(e) =>
                patchAdjustment(a.key, { mode: e.target.value as AdjustmentMode })
              }
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
              onChange={(e) => patchAdjustment(a.key, { value: e.target.value })}
              placeholder={a.mode === "percent" ? "10" : "40000"}
              aria-label="Amount"
              className={`${inputBase} w-[120px] py-2`}
            />

            <span className="min-w-[110px] text-right font-heading text-[13px] font-semibold tabular-nums text-navy">
              {formatNaira(resolved.find((r) => r.key === a.key)?.amount ?? 0)}
            </span>

            <button
              type="button"
              onClick={() =>
                setAdjustments((prev) => prev.filter((x) => x.key !== a.key))
              }
              className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Receipt preview — exactly what the parent will see. */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <dl className="flex flex-col gap-2 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-g600">
              {sessionsNum} session{sessionsNum === 1 ? "" : "s"} ×{" "}
              {formatNaira(rateNum)}
            </dt>
            <dd className="font-heading font-semibold tabular-nums text-navy">
              {formatNaira(subtotal)}
            </dd>
          </div>
          {resolved.map((r) => (
            <div key={r.key} className="flex justify-between">
              <dt className="text-g600">{r.label}</dt>
              <dd
                className={`font-heading font-semibold tabular-nums ${
                  r.amount < 0 ? "text-coral" : "text-navy"
                }`}
              >
                {r.amount > 0 ? "+" : ""}
                {formatNaira(r.amount)}
              </dd>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-line pt-2">
            <dt className="font-heading font-bold text-navy">Total</dt>
            <dd className="font-heading text-[16px] font-bold tabular-nums text-navy">
              {formatNaira(total)}
            </dd>
          </div>
        </dl>
      </div>

      <label className="flex flex-col gap-[6px]">
        <span className="font-heading text-[13px] font-medium text-navy">
          Notes <span className="text-g400">(internal, optional)</span>
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputBase}
        />
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={attachExisting}
          onChange={(e) => setAttachExisting(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--color-coral)]"
        />
        <span className="text-[13px] text-g600">
          <span className="font-heading font-semibold text-navy">
            Attach this child&apos;s existing unfunded sessions
          </span>{" "}
          — links already-scheduled sessions that aren&apos;t on any plan, oldest
          first, up to this plan&apos;s size. Leave ticked when bringing an
          existing student onto plans for the first time.
        </span>
      </label>

      {error && (
        <p className="text-[13px] font-semibold text-coral">{error}</p>
      )}
      {success && (
        <p className="text-[13px] font-semibold text-blue">{success}</p>
      )}

      <div>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-5 py-[10px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create plan"}
        </button>
      </div>
    </div>
  );
}
