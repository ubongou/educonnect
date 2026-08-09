"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputBase } from "@/components/ui/FormField";
import {
  RenewPlanDialog,
  type RenewInitial,
} from "@/components/admin/RenewPlanDialog";
import type { PlanPayerOption } from "@/components/admin/NewPlanForm";
import type { DraftAdjustment } from "@/components/admin/PlanAdjustmentsEditor";
import {
  attachSessionsToPlan,
  markPlanPaid,
  sendPaymentReminderNow,
  unarchivePaymentPlan,
  voidPaymentPlan,
} from "@/lib/actions/payments";

/**
 * Row actions for one plan on the payments list.
 *
 * "Mark paid" opens a small inline form rather than firing immediately — the
 * transfer reference is what makes a payment reconcilable later, worth one
 * extra click while the admin is looking at the bank app. "Renew" opens a
 * full dialog (everything the New Plan form can edit — sessions, rate,
 * payer, notes, every discount/add-on line) pre-filled from this plan, since
 * terms like a referral discount don't necessarily repeat every renewal.
 *
 * Void and Hide are combined: voiding frees every session the plan funded
 * and takes it off the list in the same action, since a voided plan isn't
 * paying for anything and shouldn't keep cluttering the view either.
 */
export function PaymentPlanActions({
  planId,
  studentId,
  status,
  hasUnfundedSessions,
  sessionsTotal,
  ratePerSession,
  payerId,
  notes,
  adjustments,
  payers,
  archived = false,
}: {
  planId: string;
  studentId: string;
  status: string;
  hasUnfundedSessions: boolean;
  sessionsTotal: number;
  ratePerSession: number;
  payerId: string | null;
  notes: string | null;
  adjustments: DraftAdjustment[];
  payers: PlanPayerOption[];
  archived?: boolean;
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [sendReceipt, setSendReceipt] = useState(true);
  const [renewOpen, setRenewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const renewInitial: RenewInitial = {
    studentId,
    sessionsTotal,
    ratePerSession,
    payerId,
    notes,
    adjustments,
  };

  const confirmPaid = () => {
    setError(null);
    startTransition(async () => {
      const res = await markPlanPaid({
        plan_id: planId,
        payment_reference: reference,
        paid_on: paidOn,
        send_receipt: sendReceipt,
      });
      if (res.ok) {
        setMarking(false);
        setReference("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  if (marking) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            aria-label="Date the transfer landed"
            className={`${inputBase} w-auto py-1`}
          />
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Bank reference"
            aria-label="Bank transfer reference"
            className={`${inputBase} w-[160px] py-1`}
          />
          <button
            type="button"
            onClick={confirmPaid}
            disabled={pending}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline disabled:opacity-50"
          >
            {pending ? "Saving…" : "Confirm paid"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMarking(false);
              setError(null);
            }}
            className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-g600">
          <input
            type="checkbox"
            checked={sendReceipt}
            onChange={(e) => setSendReceipt(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-coral)]"
          />
          Email the receipt to the parent
        </label>
        {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {status === "unpaid" && (
          <button
            type="button"
            onClick={() => setMarking(true)}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            Mark paid
          </button>
        )}

        {hasUnfundedSessions && status === "paid" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                setNotice(null);
                const res = await attachSessionsToPlan(studentId, planId);
                if (res.ok) router.refresh();
                else setError(res.error);
              })
            }
            className="font-heading text-[13px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50"
          >
            Attach sessions
          </button>
        )}

        {status === "paid" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                setNotice(null);
                const res = await sendPaymentReminderNow(planId);
                if (res.ok) {
                  setNotice(`Reminder sent to ${res.recipients.join(", ")}.`);
                } else {
                  setError(res.error);
                }
              })
            }
            className="font-heading text-[13px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50"
          >
            Send reminder
          </button>
        )}

        {status === "paid" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
              setRenewOpen(true);
            }}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            Renew
          </button>
        )}

        {status !== "void" && (
          <ConfirmDialog
            title="Void this plan"
            tone="danger"
            confirmLabel="Void plan"
            description="The plan stops counting as paid runway and comes off the payments list. Every session it funded goes back to unfunded, free to attach to a replacement plan. Reversible from the hidden view — the sessions won't relink automatically."
            onConfirm={() => voidPaymentPlan(planId)}
            onSuccess={() => router.refresh()}
            trigger={
              <button
                type="button"
                className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:underline"
              >
                Void
              </button>
            }
          />
        )}

        {archived && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                setNotice(null);
                const res = await unarchivePaymentPlan(planId);
                if (res.ok) router.refresh();
                else setError(res.error);
              })
            }
            className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Unhide
          </button>
        )}
      </div>
      {notice && <span className="text-[12px] font-semibold text-blue">{notice}</span>}
      {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}

      {renewOpen && (
        <RenewPlanDialog
          onClose={() => setRenewOpen(false)}
          onRenewed={(referenceCode, attached) =>
            setNotice(
              `Renewed as ${referenceCode}${
                attached > 0 ? ` · ${attached} session${attached === 1 ? "" : "s"} attached` : ""
              }.`,
            )
          }
          initial={renewInitial}
          payers={payers}
        />
      )}
    </div>
  );
}
