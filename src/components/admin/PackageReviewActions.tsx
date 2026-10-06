"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewPackage } from "@/lib/actions/packages";

/**
 * Accept a confirmed package, or send it back to the teacher with a reason.
 * Accepting is blocked server-side when a lesson on it is no longer marked as
 * happened, so `canAccept` only saves a pointless round trip.
 */
export function PackageReviewActions({
  packageId,
  canAccept,
}: {
  packageId: string;
  canAccept: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");

  const submit = (action: "accept" | "return") => {
    setError(null);
    startTransition(async () => {
      const res = await reviewPackage({ package_id: packageId, action, note });
      if (res.ok) {
        setReturning(false);
        setNote("");
        router.refresh();
      } else setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {returning ? (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="What needs fixing? The teacher sees this."
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] text-navy focus:border-blue focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || note.trim() === ""}
              onClick={() => submit("return")}
              className="inline-flex items-center rounded-pill bg-coral px-4 py-2 font-heading text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Return to teacher
            </button>
            <button
              type="button"
              onClick={() => setReturning(false)}
              className="inline-flex items-center rounded-pill border border-navy/20 bg-white px-4 py-2 font-heading text-[13px] font-semibold text-navy"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !canAccept}
            onClick={() => submit("accept")}
            className="inline-flex items-center rounded-pill bg-navy px-4 py-2 font-heading text-[13px] font-semibold text-yellow disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setReturning(true)}
            className="inline-flex items-center rounded-pill border border-navy/20 bg-white px-4 py-2 font-heading text-[13px] font-semibold text-navy hover:bg-paper"
          >
            Return…
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
