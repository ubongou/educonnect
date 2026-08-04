"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { putWithProgress } from "@/components/uploads/putWithProgress";
import {
  confirmPaymentProofUpload,
  requestPaymentProofUpload,
} from "@/lib/actions/paymentProof";
import { BANK_DETAILS } from "@/lib/payments/bankDetails";
import { formatNaira } from "@/lib/payments/plans";
import { acceptAttr, paymentProofPolicy } from "@/lib/uploads/policies";

export type ParentPlanView = {
  id: string;
  referenceCode: string;
  status: "unpaid" | "paid" | "void";
  sessionsTotal: number;
  sessionsDelivered: number;
  ratePerSession: number;
  total: number;
  lines: Array<{ label: string; amount: number }>;
  hasProof: boolean;
};

/**
 * What a parent sees about their money: how many sessions are left, what's
 * owed, where to send it, and the reference to quote.
 *
 * The reference code is the point of the whole card — a transfer that carries
 * it is reconciled in seconds instead of by name-matching against a bank
 * statement.
 */
export function PaymentCard({
  plan,
  childName,
}: {
  plan: ParentPlanView | null;
  childName: string;
}) {
  if (!plan) {
    return (
      <section className="rounded-[28px] border border-dashed border-line bg-white p-6">
        <h3 className="font-heading text-[15px] font-semibold text-navy">
          Sessions &amp; payment
        </h3>
        <p className="mt-2 text-[13px] leading-[1.55] text-g600">
          There&apos;s no active session block for {childName} at the moment. Get
          in touch and we&apos;ll set one up.
        </p>
        <BankBlock reference={null} />
      </section>
    );
  }

  const remaining = Math.max(0, plan.sessionsTotal - plan.sessionsDelivered);
  const pct =
    plan.sessionsTotal === 0
      ? 0
      : Math.min(100, Math.round((plan.sessionsDelivered / plan.sessionsTotal) * 100));
  const awaitingPayment = plan.status === "unpaid";

  return (
    <section className="rounded-[28px] border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-[15px] font-semibold text-navy">
            Sessions &amp; payment
          </h3>
          <p className="mt-1 text-[13px] text-g600">
            {plan.sessionsTotal}-session block for {childName}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-pill border px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${
            awaitingPayment
              ? "border-coral/40 bg-coral/10 text-coral"
              : remaining <= 1
                ? "border-coral/40 bg-coral/10 text-coral"
                : "border-blue/40 bg-blue/10 text-blue"
          }`}
        >
          {awaitingPayment ? "Awaiting payment" : remaining <= 1 ? "Renewal due" : "Active"}
        </span>
      </div>

      {!awaitingPayment && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-[13px] font-semibold text-navy">
              {plan.sessionsDelivered} of {plan.sessionsTotal} sessions used
            </p>
            <p className="font-heading text-[13px] font-bold tabular-nums text-navy">
              {remaining} left
            </p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-pill bg-g100"
            role="progressbar"
            aria-valuenow={plan.sessionsDelivered}
            aria-valuemin={0}
            aria-valuemax={plan.sessionsTotal}
            aria-label="Sessions used"
          >
            <div
              className={`h-full rounded-pill ${remaining <= 1 ? "bg-coral" : "bg-blue"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {remaining <= 1 && (
            <p className="mt-3 text-[13px] leading-[1.55] text-g600">
              {remaining === 0
                ? "This block is finished — renew whenever you're ready and we'll get the next sessions on the calendar."
                : "One session left. Renew before it runs out to keep the schedule going without a gap."}
            </p>
          )}
        </div>
      )}

      <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-g600">
            {plan.sessionsTotal} × {formatNaira(plan.ratePerSession)}
          </dt>
          <dd className="font-heading font-semibold tabular-nums text-navy">
            {formatNaira(plan.sessionsTotal * plan.ratePerSession)}
          </dd>
        </div>
        {plan.lines.map((l, i) => (
          <div key={i} className="flex justify-between">
            <dt className="text-g600">{l.label}</dt>
            <dd
              className={`font-heading font-semibold tabular-nums ${
                l.amount < 0 ? "text-coral" : "text-navy"
              }`}
            >
              {l.amount > 0 ? "+" : ""}
              {formatNaira(l.amount)}
            </dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2">
          <dt className="font-heading font-bold text-navy">
            {awaitingPayment ? "Amount due" : "Total paid"}
          </dt>
          <dd className="font-heading text-[16px] font-bold tabular-nums text-navy">
            {formatNaira(plan.total)}
          </dd>
        </div>
      </dl>

      {(awaitingPayment || remaining <= 1) && (
        <>
          <BankBlock reference={plan.referenceCode} />
          {awaitingPayment && <ProofUpload plan={plan} />}
        </>
      )}
    </section>
  );
}

function BankBlock({ reference }: { reference: string | null }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, what: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked (insecure context, or permission denied) — the value
      // is on screen and selectable either way.
    }
  };

  return (
    <div className="mt-5 rounded-2xl bg-paper p-5">
      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
        Transfer to
      </p>
      <p className="mt-2 font-heading text-[14px] font-semibold text-navy">
        {BANK_DETAILS.accountName}
      </p>
      <p className="mt-1 text-[13px] text-g600">{BANK_DETAILS.bankName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="font-heading text-[18px] font-bold tracking-[0.02em] tabular-nums text-navy">
          {BANK_DETAILS.accountNumber}
        </span>
        <button
          type="button"
          onClick={() => copy(BANK_DETAILS.accountNumber, "account")}
          className="font-heading text-[12px] font-semibold text-blue underline-offset-4 hover:underline"
        >
          {copied === "account" ? "Copied" : "Copy"}
        </button>
      </div>

      {reference && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Payment reference
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="font-heading text-[15px] font-bold tabular-nums text-navy">
              {reference}
            </span>
            <button
              type="button"
              onClick={() => copy(reference, "reference")}
              className="font-heading text-[12px] font-semibold text-blue underline-offset-4 hover:underline"
            >
              {copied === "reference" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-[1.5] text-g600">
            Please add this as the transfer reference — it&apos;s how we match your
            payment to {""}
            your child&apos;s account straight away.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Optional proof-of-payment upload. Doesn't mark anything paid — it just lets
 * the parent show us the transfer went out, so the admin can confirm without a
 * back-and-forth over WhatsApp.
 */
function ProofUpload({ plan }: { plan: ParentPlanView }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(plan.hasProof);
  const [, startTransition] = useTransition();

  const onPick = async (file: File) => {
    setError(null);
    setProgress(0);

    const requested = await requestPaymentProofUpload({
      planId: plan.id,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!requested.ok) {
      setError(requested.error);
      setProgress(null);
      return;
    }

    const put = await putWithProgress(requested.uploadUrl, file, setProgress);
    if (!put.ok) {
      setError(put.error);
      setProgress(null);
      return;
    }

    const confirmed = await confirmPaymentProofUpload(plan.id, requested.key);
    setProgress(null);
    if (!confirmed.ok) {
      setError(confirmed.error);
      return;
    }
    setDone(true);
    startTransition(() => router.refresh());
  };

  return (
    <div className="mt-4">
      {done ? (
        <p className="text-[13px] font-semibold text-blue">
          Proof of payment received — we&apos;ll confirm as soon as the transfer
          lands.
        </p>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr(paymentProofPolicy)}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onPick(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-white px-4 py-2 font-heading text-[13px] font-bold text-navy transition-colors hover:bg-paper disabled:opacity-50"
          >
            {progress !== null ? `Uploading… ${progress}%` : "Upload proof of payment"}
          </button>
          <p className="mt-2 text-[12px] text-g400">
            Optional — a screenshot or PDF of the transfer. Speeds up confirmation.
          </p>
        </>
      )}
      {error && (
        <p className="mt-2 text-[13px] font-semibold text-coral">{error}</p>
      )}
    </div>
  );
}
