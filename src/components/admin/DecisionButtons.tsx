"use client";

import { useState, useTransition } from "react";
import { decideEnrollment, type EnrollmentDecision } from "@/lib/actions/enrollments";
import { inputBase } from "@/components/ui/FormField";

export type PendingEnrollmentRow = {
  id: string;
  status: string;
  created_at: string;
  students: {
    id: string;
    full_name: string;
    preferred_name: string | null;
    registration_number: string;
  } | null;
  subjects: { id: string; name: string; slug: string } | null;
  requester: { id: string; full_name: string | null; email: string | null } | null;
};

export type TeacherOption = {
  id: string;
  full_name: string | null;
};

export function DecisionButtons({
  id,
  teachers,
}: {
  id: string;
  teachers: TeacherOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string>("");

  const decide = (decision: EnrollmentDecision) => {
    setError(null);
    startTransition(async () => {
      const res = await decideEnrollment(
        id,
        decision,
        decision === "approved" ? teacherId || null : null,
      );
      if (!res.ok) setError(res.error);
    });
  };

  const btnBase =
    "inline-flex items-center rounded-pill border-[1.5px] px-4 py-[6px] font-heading text-[12px] font-bold uppercase tracking-[0.08em] transition-colors disabled:opacity-50 disabled:pointer-events-none";

  return (
    <div className="flex flex-col items-end gap-2">
      {teachers.length > 0 && (
        <label className="flex items-center gap-2">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
            Teacher
          </span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={pending}
            className={`${inputBase} py-1 text-[13px]`}
          >
            <option value="">— unassigned —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name ?? "Unnamed"}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("rejected")}
          className={`${btnBase} border-navy/30 bg-white text-navy hover:bg-g50`}
        >
          Reject
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("approved")}
          className={`${btnBase} border-navy bg-coral text-white hover:bg-coral/90`}
        >
          Approve
        </button>
      </div>
      {error && <p className="text-[12px] font-semibold text-coral">{error}</p>}
    </div>
  );
}
