"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputBase } from "@/components/ui/FormField";
import { createPaymentPlan } from "@/lib/actions/payments";
import {
  PlanAdjustmentsEditor,
  type DraftAdjustment,
} from "@/components/admin/PlanAdjustmentsEditor";
import type { PlanPayerOption } from "@/components/admin/NewPlanForm";
import { adjustmentOption, resolveAdjustmentAmount } from "@/lib/payments/adjustments";
import { formatNaira } from "@/lib/payments/plans";

export type RenewInitial = {
  studentId: string;
  sessionsTotal: number;
  ratePerSession: number;
  payerId: string | null;
  notes: string | null;
  adjustments: DraftAdjustment[];
};

/**
 * Renewing is really "create a new plan, pre-filled from the old one" — so
 * this reuses `createPaymentPlan` directly rather than a bespoke duplicate
 * action, which means everything the New Plan form can edit (sessions, rate,
 * payer, notes, every discount/add-on line) is editable here too. Terms
 * don't repeat automatically just because a family always got a referral
 * discount once.
 *
 * The caller mounts this only while the dialog should be open (`{renewOpen &&
 * <RenewPlanDialog .../>}`) rather than toggling a controlled `open` prop —
 * that way every open is a fresh mount, so state naturally re-seeds from
 * `initial` instead of carrying over an edit from a dialog closed without
 * saving.
 */
export function RenewPlanDialog({
  onClose,
  onRenewed,
  initial,
  payers,
}: {
  onClose: () => void;
  /** Fired right before close, with the new plan's reference and attach count. */
  onRenewed?: (referenceCode: string, attached: number) => void;
  initial: RenewInitial;
  payers: PlanPayerOption[];
}) {
  const router = useRouter();
  const titleId = useId();
  const [payerId, setPayerId] = useState(initial.payerId ?? "");
  const [sessions, setSessions] = useState(String(initial.sessionsTotal));
  const [rate, setRate] = useState(String(initial.ratePerSession));
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [attachExisting, setAttachExisting] = useState(true);
  const [adjustments, setAdjustments] = useState<DraftAdjustment[]>(initial.adjustments);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sessionsNum = Number(sessions) || 0;
  const rateNum = Number(rate) || 0;
  const subtotal = sessionsNum * rateNum;

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
  const resolvedByKey = useMemo(
    () => new Map(resolved.map((r) => [r.key, r.amount])),
    [resolved],
  );

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createPaymentPlan({
        student_id: initial.studentId,
        payer_id: payerId || null,
        sessions_total: sessionsNum,
        rate_per_session: rateNum,
        notes,
        attach_existing: attachExisting,
        adjustments: adjustments
          .filter((a) => Number(a.value) > 0)
          .map((a) => ({ option_id: a.optionId, mode: a.mode, value: Number(a.value) })),
      });

      if (res.ok) {
        onRenewed?.(res.referenceCode, res.attached);
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-navy/40"
      />
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-line bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <h2 id={titleId} className="font-heading text-[20px] font-semibold tracking-[-0.01em] text-navy">
          Renew plan
        </h2>
        <p className="mt-1 text-[13px] text-g600">
          Creates a fresh, unpaid plan for the same child. Everything below starts
          from the plan being renewed — edit whatever&apos;s different this time.
        </p>

        <div className="mt-5 flex flex-col gap-5">
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

          <PlanAdjustmentsEditor
            adjustments={adjustments}
            onChange={setAdjustments}
            resolvedByKey={resolvedByKey}
          />

          <div className="rounded-2xl border border-line bg-paper p-5">
            <dl className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-g600">
                  {sessionsNum} session{sessionsNum === 1 ? "" : "s"} × {formatNaira(rateNum)}
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
              — links already-scheduled sessions that aren&apos;t on any plan, nearest
              to today first, up to this plan&apos;s size. Leave ticked to pick up
              where the old block left off.
            </span>
          </label>

          {error && <p className="text-[13px] font-semibold text-coral">{error}</p>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-navy px-5 py-[9px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 enabled:hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create renewed plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
