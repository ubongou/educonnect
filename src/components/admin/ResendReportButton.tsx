"use client";

import { useState, useTransition } from "react";
import { resendLessonReportEmail } from "@/lib/actions/email";

export function ResendReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "warn" | "error";
    msg: string;
  } | null>(null);

  const onClick = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await resendLessonReportEmail(reportId);
      if (!res.ok) {
        setFeedback({ tone: "error", msg: res.error });
        return;
      }
      if (res.skipped) {
        setFeedback({
          tone: "warn",
          msg: res.reason ?? "Skipped (no recipients or email disabled)",
        });
        return;
      }
      setFeedback({
        tone: "ok",
        msg: `Sent to ${res.recipients.length} parent${res.recipients.length === 1 ? "" : "s"}`,
      });
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center rounded-pill border-[1.5px] border-navy/30 bg-white px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-navy transition-colors hover:bg-g50 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Resend"}
      </button>
      {feedback && (
        <p
          className={
            feedback.tone === "error"
              ? "text-[11px] font-semibold text-coral"
              : feedback.tone === "warn"
                ? "text-[11px] font-semibold text-g600"
                : "text-[11px] font-semibold text-blue"
          }
        >
          {feedback.msg}
        </p>
      )}
    </div>
  );
}
