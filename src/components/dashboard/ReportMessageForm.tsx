"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { postReportMessage } from "@/lib/actions/reportEngagement";

/**
 * Composer for a report thread. Posts via the server action, then refreshes
 * so the new message (server-rendered) appears. Shared by all three portals —
 * the action + RLS decide who the recipient of the notification is.
 */
export function ReportMessageForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const busy = status.kind === "sending";
  const canSend = body.trim().length > 0 && !busy;

  const send = async () => {
    if (!canSend) return;
    setStatus({ kind: "sending" });
    const res = await postReportMessage(reportId, body);
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    setBody("");
    setStatus({ kind: "idle" });
    textRef.current?.focus();
    router.refresh();
  };

  return (
    <div className="mt-4">
      <textarea
        ref={textRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void send();
          }
        }}
        rows={3}
        maxLength={4000}
        disabled={busy}
        placeholder="Write a message…"
        className="w-full resize-y rounded-lg border border-line bg-white px-4 py-3 text-[14px] text-navy outline-none placeholder:text-g400 focus:border-blue disabled:opacity-60"
      />
      {status.kind === "error" && (
        <p role="alert" className="mt-2 text-[13px] font-semibold text-coral">
          {status.message}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[12px] text-g400">⌘/Ctrl + Enter to send</span>
        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          className="inline-flex items-center rounded-pill border-2 border-navy bg-blue px-5 py-[9px] font-heading text-[13px] font-bold text-navy transition-colors hover:bg-yellow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
    </div>
  );
}
