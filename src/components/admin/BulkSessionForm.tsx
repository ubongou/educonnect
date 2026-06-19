"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSessionsBulk } from "@/lib/actions/sessions";
import { inputBase } from "@/components/ui/FormField";
import type { SchedulableEnrollment } from "@/components/admin/SessionScheduler";

type Row = { id: number; when: string; duration: string };

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultRow(id: number, daysAhead: number): Row {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(16, 0, 0, 0);
  return { id, when: toLocalInput(d), duration: "60" };
}

export function BulkSessionForm({
  enrollments,
}: {
  enrollments: SchedulableEnrollment[];
}) {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([defaultRow(1, 1), defaultRow(2, 8)]);
  const [nextId, setNextId] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-6 text-[14px] text-g600">
        No approved enrollments with a teacher assigned yet.
      </div>
    );
  }

  const updateRow = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => {
    setRows((rs) => [...rs, defaultRow(nextId, (rs.length + 1) * 7)]);
    setNextId((n) => n + 1);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!enrollmentId) {
      setError("Pick an enrollment first.");
      return;
    }
    if (rows.length === 0) {
      setError("Add at least one session row.");
      return;
    }

    const payloadRows = rows.map((r) => ({
      scheduled_at: new Date(r.when).toISOString(),
      duration_minutes: Number(r.duration),
    }));

    startTransition(async () => {
      const res = await createSessionsBulk({
        enrollment_id: enrollmentId,
        rows: payloadRows,
      });
      if (res.ok) {
        setSuccess(`${res.created} session${res.created === 1 ? "" : "s"} scheduled.`);
        setRows([defaultRow(nextId, 1)]);
        setNextId((n) => n + 1);
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

      <div className="flex flex-col gap-3">
        {rows.map((r, idx) => (
          <div key={r.id} className="grid items-end gap-3 md:grid-cols-[1fr_160px_auto]">
            <label className="flex flex-col gap-[7px]">
              {idx === 0 && (
                <span className="font-heading text-[13px] font-semibold text-navy">
                  Date &amp; time
                </span>
              )}
              <input
                type="datetime-local"
                value={r.when}
                onChange={(e) => updateRow(r.id, { when: e.target.value })}
                required
                className={inputBase}
              />
            </label>
            <label className="flex flex-col gap-[7px]">
              {idx === 0 && (
                <span className="font-heading text-[13px] font-semibold text-navy">
                  Duration
                </span>
              )}
              <select
                value={r.duration}
                onChange={(e) => updateRow(r.id, { duration: e.target.value })}
                className={inputBase}
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => removeRow(r.id)}
              disabled={rows.length === 1}
              className="mb-1 inline-flex h-[42px] items-center rounded-pill border border-navy/30 bg-white px-4 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-navy transition-colors hover:bg-paper disabled:pointer-events-none disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-pill border border-navy/30 bg-white px-4 py-[6px] font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-navy transition-colors hover:bg-paper"
        >
          + Add row
        </button>
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
          {pending ? "Scheduling…" : `Schedule ${rows.length} session${rows.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </form>
  );
}
