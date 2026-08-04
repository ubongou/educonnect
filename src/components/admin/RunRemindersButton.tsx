"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runPaymentRemindersNow } from "@/lib/actions/payments";

/**
 * Sweeps every student on demand.
 *
 * Reminders normally fire by themselves the moment a lesson report is filed, so
 * this is the safety net for the paths that don't run through a report — a plan
 * marked paid after its sessions were already taught, say — and the way to check
 * the whole book at once.
 *
 * Same code path and the same idempotency, so pressing it repeatedly is
 * harmless: plans already nudged for a reason are skipped, never re-sent.
 */
export function RunRemindersButton() {
  const router = useRouter();
  const [result, setResult] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            setResult(null);
            setSkipped([]);
            const res = await runPaymentRemindersNow();
            if (res.ok) {
              setResult(
                res.sent === 0
                  ? "No reminders were due."
                  : `${res.sent} reminder${res.sent === 1 ? "" : "s"} sent.`,
              );
              setSkipped(res.skipped);
              router.refresh();
            } else {
              setError(res.error);
            }
          })
        }
        className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-white px-4 py-2 font-heading text-[13px] font-bold text-navy transition-colors hover:bg-paper disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reminders now"}
      </button>

      {result && (
        <p className="text-right text-[13px] font-semibold text-blue">{result}</p>
      )}
      {skipped.length > 0 && (
        <ul className="max-w-[360px] text-right text-[12px] text-g600">
          {skipped.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      {error && (
        <p className="text-right text-[13px] font-semibold text-coral">{error}</p>
      )}
    </div>
  );
}
