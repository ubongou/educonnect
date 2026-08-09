"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputBase } from "@/components/ui/FormField";
import {
  archivePaymentPlan,
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
 * "Mark paid" opens a small form rather than firing immediately — the transfer
 * reference is the thing that makes a payment reconcilable later, so it's worth
 * one extra click to capture it while the admin is looking at the bank app.
 */
export function PaymentPlanActions({
  planId,
  studentId,
  status,
  hasUnfundedSessions,
  archived = false,
}: {
  planId: string;
  studentId: string;
  status: string;
  hasUnfundedSessions: boolean;
  archived?: boolean;
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [sendReceipt, setSendReceipt] = useState(true);
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
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                setNotice(null);
                const res = await renewPaymentPlan(planId);
                if (res.ok) {
                  setNotice(
                    `Renewed as ${res.referenceCode}${
                      res.attached > 0 ? ` · ${res.attached} session${res.attached === 1 ? "" : "s"} attached` : ""
                    }.`,
                  );
                  router.refresh();
                } else {
                  setError(res.error);
                }
              })
            }
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
            description="The plan stops counting as paid runway. It stays on the record with its reference code, and any sessions already attached keep their link."
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

        {archived ? (
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
        ) : (
          <ConfirmDialog
            title="Hide this plan"
            tone="default"
            confirmLabel="Hide plan"
            description="Entered by mistake? Hiding takes it off the payments list without changing its status — sessions already attached keep their link, and it stays reversible from the hidden view."
            onConfirm={() => archivePaymentPlan(planId)}
            onSuccess={() => router.refresh()}
            trigger={
              <button
                type="button"
                className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:underline"
              >
                Hide
              </button>
            }
          />
        )}
      </div>
      {notice && <span className="text-[12px] font-semibold text-blue">{notice}</span>}
      {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
    </div>
  );
}
