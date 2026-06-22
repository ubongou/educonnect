"use client";

import { useState, useTransition } from "react";
import { createSession } from "@/lib/actions/sessions";
import { inputBase } from "@/components/ui/FormField";

export type SchedulableEnrollment = {
  id: string;
  student_name: string;
  subject_name: string;
  teacher_name: string;
};

function toDateInput(d: Date): string {
  // Produce a "YYYY-MM-DD" string in the viewer's local time for <input
  // type="date">. Sessions are scheduled by calendar day only — no time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SessionScheduler({
  enrollments,
}: {
  enrollments: SchedulableEnrollment[];
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [when, setWhen] = useState(toDateInput(tomorrow));
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enrollmentId) {
      setError("Pick an enrollment first.");
      return;
    }

    startTransition(async () => {
      const res = await createSession({
        enrollment_id: enrollmentId,
        session_date: when,
        duration_minutes: Number(duration),
      });
      if (res.ok) {
        setSuccess("Session scheduled.");
      } else {
        setError(res.error);
      }
    });
  };

  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-6 text-[14px] text-g600">
        No approved enrollments with a teacher assigned yet. Approve an enrollment and pick a
        teacher on the{" "}
        <a
          href="/admin/enrollments"
          className="font-semibold text-blue underline-offset-4 hover:underline"
        >
          Enrollments
        </a>{" "}
        page first.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-lg border border-line bg-white p-6"
    >
      <label className="flex flex-col gap-[7px]">
        <span className="font-heading text-[13px] font-semibold text-navy">Enrollment</span>
        <select
          value={enrollmentId}
          onChange={(e) => setEnrollmentId(e.target.value)}
          className={inputBase}
        >
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.student_name} · {e.subject_name} · {e.teacher_name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">
            Date
          </span>
          <input
            type="date"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            required
            className={inputBase}
          />
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">Duration</span>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputBase}
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-md border border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
        >
          {success}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-6 py-[11px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Scheduling…" : "Schedule session"}
        </button>
      </div>
    </form>
  );
}
