"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSessionAttendance } from "@/lib/actions/sessions";

/**
 * Lets a teacher record attendance on one of their sessions: mark a no-show
 * when a student didn't attend, or undo it back to scheduled. "Completed" isn't
 * offered here — that happens when the teacher files the lesson report.
 */
export function SessionAttendanceControl({
  sessionId,
  status,
}: {
  sessionId: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (next: "scheduled" | "no_show") => {
    setError(null);
    startTransition(async () => {
      const res = await setSessionAttendance(sessionId, next);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  if (status === "no_show") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => set("scheduled")}
          disabled={pending}
          className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline disabled:opacity-50"
        >
          Undo no-show
        </button>
        {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => set("no_show")}
        disabled={pending}
        className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-coral hover:underline disabled:opacity-50"
      >
        Mark no-show
      </button>
      {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
    </div>
  );
}
