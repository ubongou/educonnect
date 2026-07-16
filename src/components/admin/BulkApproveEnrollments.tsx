"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DecisionButtons, type TeacherOption } from "@/components/admin/DecisionButtons";
import { approveEnrollmentsBulk } from "@/lib/actions/enrollments";
import { inputBase } from "@/components/ui/FormField";
import { TableScroll } from "@/components/ui/TableScroll";

export type PendingRow = {
  id: string;
  studentId: string | null;
  studentName: string;
  subjectName: string;
  parentName: string;
  parentEmail: string | null;
  requestedLabel: string;
};

/**
 * The pending-enrollments table with multi-select for bulk approval. Each row
 * keeps its per-row DecisionButtons (approve-with-teacher / reject); the bulk
 * bar approves every checked row at once, optionally assigning one teacher to
 * all of them (teachers can also be set per row afterwards).
 */
export function BulkApproveEnrollments({
  rows,
  teachers,
}: {
  rows: PendingRow[];
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTeacher, setBulkTeacher] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allChecked = rows.length > 0 && selected.size === rows.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));

  const approveSelected = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveEnrollmentsBulk(
        Array.from(selected),
        bulkTeacher || null,
      );
      if (res.ok) {
        setSelected(new Set());
        setBulkTeacher("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3">
        <span className="text-[13px] text-g600">
          {selected.size === 0
            ? "Select requests to approve in bulk."
            : `${selected.size} selected`}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={bulkTeacher}
            onChange={(e) => setBulkTeacher(e.target.value)}
            aria-label="Assign teacher to all selected"
            className={`${inputBase} w-auto py-1`}
          >
            <option value="">Assign teacher later</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name ?? "Unnamed teacher"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={approveSelected}
            disabled={pending || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-5 py-[8px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 enabled:hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
          >
            {pending ? "Approving…" : `Approve ${selected.size || ""} selected`}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[13px] font-semibold text-coral"
        >
          {error}
        </p>
      )}

      <TableScroll minWidth={780}>
        <table className="w-full text-[14px]">
          <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            <tr>
              <th className="px-5 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Requested</th>
              <th className="px-5 py-3 text-right">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={`Select ${r.studentName}`}
                  />
                </td>
                <td className="px-5 py-3">
                  {r.studentId ? (
                    <Link
                      href={`/admin/students/${r.studentId}`}
                      className="font-heading font-bold text-navy underline-offset-4 hover:underline"
                    >
                      {r.studentName}
                    </Link>
                  ) : (
                    <span className="font-heading font-bold text-navy">
                      {r.studentName}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-navy">{r.subjectName}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-col">
                    <span className="text-navy">{r.parentName}</span>
                    {r.parentEmail && (
                      <a
                        href={`mailto:${r.parentEmail}`}
                        className="text-[12px] text-g400 underline-offset-4 hover:underline"
                      >
                        {r.parentEmail}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-g600">{r.requestedLabel}</td>
                <td className="px-5 py-3">
                  <DecisionButtons id={r.id} teachers={teachers} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
