"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelSession,
  updateSession,
  type SessionPatch,
} from "@/lib/actions/sessions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputBase } from "@/components/ui/FormField";

export type SessionTeacherOption = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * Per-row management for a session on the admin schedule. Edit opens an inline
 * form to change the date, duration, teacher, and status in one save (via
 * updateSession); Cancel is a quick soft-cancel. The row stays visible for
 * history in every case.
 */
export function SessionRowActions({
  sessionId,
  sessionDate,
  durationMinutes,
  teacherId,
  status,
  teachers,
}: {
  sessionId: string;
  sessionDate: string;
  durationMinutes: number;
  teacherId: string | null;
  status: string;
  teachers: SessionTeacherOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(sessionDate);
  const [duration, setDuration] = useState(String(durationMinutes));
  const [teacher, setTeacher] = useState(teacherId ?? "");
  const [statusValue, setStatusValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancelled = status === "cancelled";

  const reset = () => {
    setDate(sessionDate);
    setDuration(String(durationMinutes));
    setTeacher(teacherId ?? "");
    setStatusValue(status);
    setError(null);
  };

  const save = () => {
    setError(null);
    const patch: SessionPatch = {};
    if (date !== sessionDate) patch.session_date = date;
    if (Number(duration) !== durationMinutes) patch.duration_minutes = Number(duration);
    if (teacher && teacher !== teacherId) patch.teacher_id = teacher;
    if (statusValue !== status) patch.status = statusValue;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const res = await updateSession(sessionId, patch);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className={`${inputBase} w-auto py-1`}
          />
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            aria-label="Duration"
            className={`${inputBase} w-auto py-1`}
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
          <select
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            aria-label="Teacher"
            className={`${inputBase} w-auto py-1`}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            aria-label="Status"
            className={`${inputBase} w-auto py-1`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              reset();
            }}
            className="font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </div>
        {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={pending}
          className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline disabled:opacity-50"
        >
          Edit
        </button>
        {!cancelled && (
          <ConfirmDialog
            title="Cancel session"
            description="The session stays visible for history but is marked cancelled. The teacher and parent will see it as cancelled."
            confirmLabel="Cancel session"
            onConfirm={() => cancelSession(sessionId)}
            onSuccess={() => router.refresh()}
            trigger={
              <button
                type="button"
                disabled={pending}
                className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:underline disabled:opacity-50"
              >
                Cancel
              </button>
            }
          />
        )}
      </div>
      {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
    </div>
  );
}
