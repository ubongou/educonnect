"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSessionsBulk } from "@/lib/actions/sessions";
import { inputBase } from "@/components/ui/FormField";
import type { SchedulableEnrollment } from "@/components/admin/SessionScheduler";

const CADENCES: { value: string; label: string; days: number }[] = [
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "biweekly", label: "Every 2 weeks", days: 14 },
  { value: "daily", label: "Daily", days: 1 },
];

function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

function prettyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Generates a run of sessions on a recurring cadence (weekly / fortnightly /
 * daily) for one approved enrollment, from a start date for N occurrences. The
 * generated dates preview live and are submitted through createSessionsBulk.
 */
export function RecurringSessionForm({
  enrollments,
}: {
  enrollments: SchedulableEnrollment[];
}) {
  const router = useRouter();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [startDate, setStartDate] = useState(toDateInput(tomorrow));
  const [cadence, setCadence] = useState("weekly");
  const [count, setCount] = useState("8");
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dates = useMemo(() => {
    const n = Math.max(0, Math.min(52, Number(count) || 0));
    const step = CADENCES.find((c) => c.value === cadence)?.days ?? 7;
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(addDays(startDate, step * i));
    return out;
  }, [startDate, cadence, count]);

  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-6 text-[14px] text-g600">
        No approved enrollments with a teacher assigned yet.
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enrollmentId) {
      setError("Pick an enrollment first.");
      return;
    }
    if (dates.length === 0) {
      setError("Set how many sessions to generate.");
      return;
    }

    startTransition(async () => {
      const res = await createSessionsBulk({
        enrollment_id: enrollmentId,
        rows: dates.map((session_date) => ({
          session_date,
          duration_minutes: Number(duration),
        })),
      });
      if (res.ok) {
        setSuccess(`${res.created} session${res.created === 1 ? "" : "s"} scheduled.`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">Starts</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputBase}
          />
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">Repeats</span>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            className={inputBase}
          >
            {CADENCES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="font-heading text-[13px] font-semibold text-navy">
            How many
          </span>
          <input
            type="number"
            min={1}
            max={52}
            value={count}
            onChange={(e) => setCount(e.target.value)}
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

      {dates.length > 0 && (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            {dates.length} session{dates.length === 1 ? "" : "s"} · {dates[0] && prettyDate(dates[0])}
            {dates.length > 1 && ` → ${prettyDate(dates[dates.length - 1])}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {dates.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-pill border border-line bg-white px-3 py-1 text-[12px] tabular-nums text-navy"
              >
                {prettyDate(d)}
              </span>
            ))}
          </div>
        </div>
      )}

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
          {pending ? "Scheduling…" : `Schedule ${dates.length} session${dates.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </form>
  );
}
