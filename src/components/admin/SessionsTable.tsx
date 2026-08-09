"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TableScroll } from "@/components/ui/TableScroll";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputBase } from "@/components/ui/FormField";
import {
  SessionRowActions,
  type SessionPlanOption,
  type SessionTeacherOption,
} from "@/components/admin/SessionRowActions";
import { isDeletableSession } from "@/lib/sessions/filters";
import { deleteSessionsBulk, updateSessionsBulk } from "@/lib/actions/sessions";

export type AdminSessionRow = {
  id: string;
  session_date: string;
  duration_minutes: number;
  status: string;
  lesson_report_id: string | null;
  payment_plan_id?: string | null;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
  teacher: { id: string; full_name: string | null } | null;
};

const statusTone: Record<string, string> = {
  scheduled: "border-blue/40 bg-blue/10 text-blue",
  completed: "border-blue/40 bg-blue/10 text-blue",
  cancelled: "border-g400/40 bg-g100 text-g600",
  no_show: "border-coral/40 bg-coral/10 text-coral",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${
        statusTone[status] ?? statusTone.scheduled
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function formatDay(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * The admin sessions table: per-row management plus multi-select bulk actions.
 *
 * Selection is page-scoped and deliberately not persisted across pagination —
 * "select all" that silently spans pages you've never looked at is how people
 * delete things they didn't mean to. The header checkbox covers exactly the
 * rows on screen.
 *
 * `showStudent` is off on the child page, where every row is the same student.
 */
export function SessionsTable({
  rows,
  teachers,
  showStudent = true,
  plansByStudent = {},
}: {
  rows: AdminSessionRow[];
  teachers: SessionTeacherOption[];
  showStudent?: boolean;
  /** A student's plans, keyed by student id — drives the per-row plan picker. */
  plansByStudent?: Record<string, SessionPlanOption[]>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedIds = useMemo(() => [...selected], [selected]);
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const deletableCount = useMemo(
    () => rows.filter((r) => selected.has(r.id) && isDeletableSession(r)).length,
    [rows, selected],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allOnPageSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const clear = () => {
    setSelected(new Set());
    setError(null);
  };

  const run = (
    fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>,
  ) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setNotice(res.message);
        setSelected(new Set());
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const bulkStatus = (status: string, verb: string) =>
    run(async () => {
      const res = await updateSessionsBulk(selectedIds, { status });
      return res.ok
        ? { ok: true as const, message: `${res.updated} session${res.updated === 1 ? "" : "s"} ${verb}.` }
        : res;
    });

  const bulkTeacher = (teacherId: string) =>
    run(async () => {
      const res = await updateSessionsBulk(selectedIds, { teacher_id: teacherId });
      const name = teachers.find((t) => t.id === teacherId)?.name ?? "the new teacher";
      return res.ok
        ? { ok: true as const, message: `${res.updated} session${res.updated === 1 ? "" : "s"} reassigned to ${name}.` }
        : res;
    });

  const bulkShift = (days: number) =>
    run(async () => {
      const res = await updateSessionsBulk(selectedIds, { shift_days: days });
      return res.ok
        ? {
            ok: true as const,
            message: `${res.updated} session${res.updated === 1 ? "" : "s"} moved ${Math.abs(days)} day${
              Math.abs(days) === 1 ? "" : "s"
            } ${days > 0 ? "later" : "earlier"}.`,
          }
        : res;
    });

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          deletableCount={deletableCount}
          teachers={teachers}
          pending={pending}
          onClear={clear}
          onCancel={() => bulkStatus("cancelled", "cancelled")}
          onComplete={() => bulkStatus("completed", "marked completed")}
          onReassign={bulkTeacher}
          onShift={bulkShift}
          onDelete={async () => {
            const res = await deleteSessionsBulk(selectedIds);
            if (!res.ok) return res;
            const parts = [`${res.deleted} deleted`];
            if (res.skipped > 0) {
              parts.push(`${res.skipped} skipped (completed or has a report)`);
            }
            setNotice(`${parts.join(" · ")}.`);
            setSelected(new Set());
            return { ok: true as const };
          }}
        />
      )}

      {notice && (
        <p className="rounded-xl border border-blue/30 bg-blue/5 px-4 py-2 text-[13px] font-semibold text-blue">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-coral/30 bg-coral/5 px-4 py-2 text-[13px] font-semibold text-coral">
          {error}
        </p>
      )}

      <TableScroll minWidth={showStudent ? 980 : 820}>
        <table className="w-full text-[14px]">
          <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  aria-label="Select all sessions on this page"
                  className="h-4 w-4 accent-[var(--color-coral)]"
                />
              </th>
              <th className="px-5 py-3">When</th>
              {showStudent && <th className="px-5 py-3">Student</th>}
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Teacher</th>
              <th className="px-5 py-3 text-right">Duration</th>
              <th className="px-5 py-3 text-right">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const checked = selected.has(s.id);
              return (
                <tr
                  key={s.id}
                  className={`border-t border-line ${checked ? "bg-blue/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      aria-label={`Select session on ${formatDay(s.session_date)}`}
                      className="h-4 w-4 accent-[var(--color-coral)]"
                    />
                  </td>
                  <td className="px-5 py-3 font-heading font-bold text-navy">
                    {formatDay(s.session_date)}
                  </td>
                  {showStudent && (
                    <td className="px-5 py-3 text-navy">
                      {s.students ? (
                        <Link
                          href={`/admin/students/${s.students.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {s.students.preferred_name ?? s.students.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3 text-g600">{s.subjects?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    {s.teacher ? (
                      <Link
                        href={`/admin/teachers/${s.teacher.id}`}
                        className="text-blue underline-offset-4 hover:underline"
                      >
                        {s.teacher.full_name ?? "Unnamed"}
                      </Link>
                    ) : (
                      <span className="text-g400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-g600">
                    {s.duration_minutes} min
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <SessionRowActions
                      sessionId={s.id}
                      sessionDate={s.session_date}
                      durationMinutes={s.duration_minutes}
                      teacherId={s.teacher?.id ?? null}
                      status={s.status}
                      lessonReportId={s.lesson_report_id}
                      teachers={teachers}
                      planId={s.payment_plan_id ?? null}
                      planOptions={plansByStudent[s.students?.id ?? ""] ?? []}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}

function BulkBar({
  count,
  deletableCount,
  teachers,
  pending,
  onClear,
  onCancel,
  onComplete,
  onReassign,
  onShift,
  onDelete,
}: {
  count: number;
  deletableCount: number;
  teachers: SessionTeacherOption[];
  pending: boolean;
  onClear: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onReassign: (teacherId: string) => void;
  onShift: (days: number) => void;
  onDelete: () => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [shift, setShift] = useState("7");
  const blocked = count - deletableCount;

  return (
    <div className="sticky top-[86px] z-20 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-navy bg-white px-4 py-3 shadow-[0_6px_20px_rgba(4,19,28,0.12)]">
      <span className="font-heading text-[13px] font-bold text-navy">
        {count} selected
      </span>

      <span aria-hidden="true" className="text-line">
        |
      </span>

      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="font-heading text-[13px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onComplete}
        disabled={pending}
        className="font-heading text-[13px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50"
      >
        Mark completed
      </button>

      <label className="flex items-center gap-2">
        <span className="sr-only">Reassign teacher</span>
        <select
          value=""
          disabled={pending}
          onChange={(e) => e.target.value && onReassign(e.target.value)}
          className={`${inputBase} w-auto py-1 text-[13px]`}
        >
          <option value="">Reassign to…</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="sr-only">Shift by days</span>
        <select
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          disabled={pending}
          className={`${inputBase} w-auto py-1 text-[13px]`}
        >
          <option value="-7">1 week earlier</option>
          <option value="-1">1 day earlier</option>
          <option value="1">1 day later</option>
          <option value="7">1 week later</option>
          <option value="14">2 weeks later</option>
        </select>
        <button
          type="button"
          onClick={() => onShift(Number(shift))}
          disabled={pending}
          className="font-heading text-[13px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50"
        >
          Shift
        </button>
      </label>

      <ConfirmDialog
        title={`Delete ${deletableCount} session${deletableCount === 1 ? "" : "s"}`}
        confirmLabel="Delete sessions"
        tone="danger"
        description={
          blocked > 0
            ? `${blocked} of the ${count} selected can't be deleted — they're completed or already have a lesson report, and will be left untouched.`
            : "This permanently removes the selected sessions. Cancel instead if you want to keep them on the record."
        }
        onConfirm={onDelete}
        trigger={
          <button
            type="button"
            disabled={pending || deletableCount === 0}
            className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:underline disabled:opacity-40"
          >
            Delete{deletableCount !== count ? ` (${deletableCount})` : ""}
          </button>
        }
      />

      <button
        type="button"
        onClick={onClear}
        className="ml-auto font-heading text-[13px] font-semibold text-g600 underline-offset-4 hover:text-navy hover:underline"
      >
        Clear
      </button>
    </div>
  );
}
