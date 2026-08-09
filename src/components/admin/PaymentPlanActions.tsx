"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputBase } from "@/components/ui/FormField";
import {
  attachSessionsToPlan,
  markPlanPaid,
  renewPaymentPlan,
  sendPaymentReminderNow,
  unarchivePaymentPlan,
  voidPaymentPlan,
} from "@/lib/actions/payments";

/**
 * Row actions for one plan on the payments list.
 *
 * "Mark paid" and "Renew" both open a small form rather than firing
 * immediately — the transfer reference is what makes a payment reconcilable
 * later, and a renewal's sessions/rate are worth one glance before they're
 * copied into a new plan, so each is worth one extra click.
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
  archived = false,
}: {
  planId: string;
  studentId: string;
  status: string;
  hasUnfundedSessions: boolean;
  sessionsTotal: number;
  ratePerSession: number;
  archived?: boolean;
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [sendReceipt, setSendReceipt] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [renewSessions, setRenewSessions] = useState(String(sessionsTotal));
  const [renewRate, setRenewRate] = useState(String(ratePerSession));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  const confirmRenew = () => {
    setError(null);
    startTransition(async () => {
      const res = await renewPaymentPlan(planId, {
        sessions_total: Number(renewSessions),
        rate_per_session: Number(renewRate),
      });
      if (res.ok) {
        setRenewing(false);
        setNotice(
          `Renewed as ${res.referenceCode}${
            res.attached > 0
              ? ` · ${res.attached} session${res.attached === 1 ? "" : "s"} attached`
              : ""
          }.`,
        );
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

  if (renewing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="number"
            min={1}
            max={200}
            value={renewSessions}
            onChange={(e) => setRenewSessions(e.target.value)}
            aria-label="Sessions in the new plan"
            className={`${inputBase} w-[80px] py-1`}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={renewRate}
            onChange={(e) => setRenewRate(e.target.value)}
            aria-label="Rate per session, in naira"
            className={`${inputBase} w-[120px] py-1`}
          />
          <button
            type="button"
            onClick={confirmRenew}
            disabled={pending}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline disabled:opacity-50"
          >
            {pending ? "Creating…" : "Confirm renew"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRenewing(false);
              setRenewSessions(String(sessionsTotal));
              setRenewRate(String(ratePerSession));
              setError(null);
            }}
            className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </div>
        <p className="text-[12px] text-g600">
          Sessions and rate to carry into the new plan — edit if they&apos;ve changed.
        </p>
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
              setRenewSessions(String(sessionsTotal));
              setRenewRate(String(ratePerSession));
              setRenewing(true);
            }}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline disabled:opacity-50"
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
    </div>
  );
}
