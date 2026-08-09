"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelSession,
  deleteSession,
  updateSession,
  type SessionPatch,
} from "@/lib/actions/sessions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputBase } from "@/components/ui/FormField";
import { isDeletableSession } from "@/lib/sessions/filters";

export type SessionTeacherOption = { id: string; name: string };
export type SessionPlanOption = { id: string; label: string };

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

const UNFUNDED_VALUE = "";

/**
 * Per-row management for a session on the admin sessions list. Edit opens an
 * inline form to change the date, duration, teacher, status, and which plan
 * it's charged to, in one save (via updateSession); Cancel is a quick
 * soft-cancel that keeps the row for history; Delete removes it outright.
 *
 * The plan picker exists because a session only ever gets attached to a plan
 * once — at creation, or via "Attach sessions" while it's still unfunded. A
 * session already charged to an old, exhausted plan has no other way to move
 * onto a freshly paid one, so this is that lever.
 *
 * Delete only appears for rows that can actually be deleted — no lesson report
 * and never marked completed. The server re-checks the same rule, so hiding the
 * button is a courtesy rather than the guard.
 */
export function SessionRowActions({
  sessionId,
  sessionDate,
  durationMinutes,
  teacherId,
  status,
  lessonReportId = null,
  teachers,
  planId = null,
  planOptions = [],
}: {
  sessionId: string;
  sessionDate: string;
  durationMinutes: number;
  teacherId: string | null;
  status: string;
  lessonReportId?: string | null;
  teachers: SessionTeacherOption[];
  planId?: string | null;
  planOptions?: SessionPlanOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(sessionDate);
  const [duration, setDuration] = useState(String(durationMinutes));
  const [teacher, setTeacher] = useState(teacherId ?? "");
  const [statusValue, setStatusValue] = useState(status);
  const [planValue, setPlanValue] = useState(planId ?? UNFUNDED_VALUE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancelled = status === "cancelled";
  const canDelete = isDeletableSession({ status, lesson_report_id: lessonReportId });

  const reset = () => {
    setDate(sessionDate);
    setDuration(String(durationMinutes));
    setTeacher(teacherId ?? "");
    setStatusValue(status);
    setPlanValue(planId ?? UNFUNDED_VALUE);
    setError(null);
  };

  const save = () => {
    setError(null);
    const patch: SessionPatch = {};
    if (date !== sessionDate) patch.session_date = date;
    if (Number(duration) !== durationMinutes) patch.duration_minutes = Number(duration);
    if (teacher && teacher !== teacherId) patch.teacher_id = teacher;
    if (statusValue !== status) patch.status = statusValue;
    if (planValue !== (planId ?? UNFUNDED_VALUE)) {
      patch.payment_plan_id = planValue || null;
    }

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
          <select
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
            aria-label="Charged to plan"
            className={`${inputBase} w-auto py-1`}
          >
            <option value={UNFUNDED_VALUE}>Unfunded</option>
            {planId && !planOptions.some((p) => p.id === planId) && (
              <option value={planId}>Current plan</option>
            )}
            {planOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
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
        {canDelete && (
          <ConfirmDialog
            title="Delete session"
            tone="danger"
            description="This permanently removes the session. Cancel instead if you want it to stay on the record as a cancelled lesson."
            confirmLabel="Delete session"
            onConfirm={() => deleteSession(sessionId)}
            onSuccess={() => router.refresh()}
            trigger={
              <button
                type="button"
                disabled={pending}
                className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            }
          />
        )}
      </div>
      {error && <span className="text-[12px] font-semibold text-coral">{error}</span>}
    </div>
  );
}
