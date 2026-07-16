"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importPastSessions } from "@/lib/actions/sessions";
import { inputBase } from "@/components/ui/FormField";
import type { SchedulableEnrollment } from "@/components/admin/SessionScheduler";
import { TableScroll } from "@/components/ui/TableScroll";

// Column order parents paste in. Optional trailing columns may be omitted.
const COLUMNS = [
  "lesson_date",
  "duration_minutes",
  "lesson_focus",
  "understanding_check",
  "confidence_level",
  "participation",
  "focus_rating",
  "homework",
  "lesson_highlights",
  "next_focus",
  "how_to_help_at_home",
] as const;

export type ImportRowPayload = {
  lesson_date: string;
  duration_minutes: number;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  participation: number;
  focus_rating: number;
  homework: number;
  lesson_highlights?: string;
  next_focus?: string;
  how_to_help_at_home?: string;
};

type ParsedRow = {
  line: number;
  cells: string[];
  ok: boolean;
  error: string | null;
  payload: ImportRowPayload | null;
};

function intInRange(v: string, lo: number, hi: number): number | null {
  if (!/^-?\d+$/.test(v.trim())) return null;
  const n = Number(v.trim());
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
}

function parsePaste(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ",";
  const out: ParsedRow[] = [];

  lines.forEach((line, idx) => {
    const cells = line.split(delimiter).map((c) => c.trim());

    // Skip a header row (only ever the first line) when its first cell isn't a date.
    if (idx === 0 && !/^\d{4}-\d{2}-\d{2}$/.test(cells[0] ?? "")) {
      return;
    }

    const get = (i: number) => cells[i] ?? "";
    const errors: string[] = [];

    const lesson_date = get(0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lesson_date)) errors.push("date must be YYYY-MM-DD");

    const duration_minutes = intInRange(get(1), 15, 240);
    if (duration_minutes === null) errors.push("duration 15–240");

    const lesson_focus = get(2);
    if (!lesson_focus) errors.push("lesson focus required");

    const understanding_check = intInRange(get(3), 1, 10);
    if (understanding_check === null) errors.push("understanding 1–10");

    const confidence_level = intInRange(get(4), 1, 10);
    if (confidence_level === null) errors.push("confidence 1–10");

    const participation = intInRange(get(5), 0, 10);
    if (participation === null) errors.push("participation 0–10");

    const focus_rating = intInRange(get(6), 0, 10);
    if (focus_rating === null) errors.push("focus 0–10");

    const homework = intInRange(get(7), 0, 10);
    if (homework === null) errors.push("homework 0–10");

    const ok = errors.length === 0;
    out.push({
      line: idx + 1,
      cells,
      ok,
      error: ok ? null : errors.join(", "),
      payload:
        ok &&
        duration_minutes !== null &&
        understanding_check !== null &&
        confidence_level !== null &&
        participation !== null &&
        focus_rating !== null &&
        homework !== null
          ? {
              lesson_date,
              duration_minutes,
              lesson_focus,
              understanding_check,
              confidence_level,
              participation,
              focus_rating,
              homework,
              lesson_highlights: get(8) || undefined,
              next_focus: get(9) || undefined,
              how_to_help_at_home: get(10) || undefined,
            }
          : null,
    });
  });

  return out;
}

export function ImportSessionsForm({
  enrollments,
}: {
  enrollments: SchedulableEnrollment[];
}) {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => parsePaste(raw), [raw]);
  const validRows = parsed.filter((r) => r.ok);

  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-6 text-[14px] text-g600">
        No approved enrollments with a teacher assigned yet. Approve an enrollment and assign a
        teacher first.
      </div>
    );
  }

  const onImport = () => {
    setError(null);
    setResult(null);

    if (!enrollmentId) {
      setError("Pick an enrollment first.");
      return;
    }
    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    startTransition(async () => {
      const res = await importPastSessions({
        enrollment_id: enrollmentId,
        rows: validRows.map((r) => r.payload),
      });
      if (res.ok) {
        const base = `Imported ${res.imported} past session${res.imported === 1 ? "" : "s"}.`;
        setResult(
          res.failed.length > 0
            ? `${base} ${res.failed.length} failed: ${res.failed
                .map((f) => `row ${f.row} (${f.error})`)
                .join("; ")}`
            : base,
        );
        if (res.failed.length === 0) setRaw("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-line bg-paper p-4 text-[13px] text-g600">
        <p className="font-semibold text-navy">Paste columns in this order (tab or comma separated):</p>
        <p className="mt-2 font-mono text-[12px] leading-relaxed">{COLUMNS.join(", ")}</p>
        <p className="mt-2">
          A header row is auto-skipped. Ranges: duration 15–240, understanding/confidence 1–10,
          participation/focus/homework 0–10. The last three columns (highlights, next focus, how to
          help at home) are optional. Each row becomes a completed session with a full report — no
          emails are sent.
        </p>
      </div>

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

      <label className="flex flex-col gap-[7px]">
        <span className="font-heading text-[13px] font-semibold text-navy">Paste rows</span>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          placeholder={
            "2026-03-04\t60\tFractions recap\t7\t6\t8\t7\t5\tGreat progress\tDecimals next\tPractise 10 mins"
          }
          className={`${inputBase} font-mono text-[12px]`}
        />
      </label>

      {parsed.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2 text-[12px] font-semibold text-g600">
            <span>
              {validRows.length} of {parsed.length} row{parsed.length === 1 ? "" : "s"} valid
            </span>
          </div>
          <TableScroll minWidth={620} className="">
            <table className="w-full text-[13px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Focus</th>
                  <th className="px-3 py-2 text-right">Mins</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((r) => (
                  <tr key={r.line} className="border-t border-line">
                    <td className="px-3 py-2 tabular-nums text-g400">{r.line}</td>
                    <td className="px-3 py-2 text-navy">{r.cells[0] ?? "—"}</td>
                    <td className="px-3 py-2 text-g600">{r.cells[2] ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-g600">
                      {r.cells[1] ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="font-semibold text-blue">valid</span>
                      ) : (
                        <span className="font-semibold text-coral">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
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
      {result && (
        <p
          role="status"
          className="rounded-md border border-blue/40 bg-blue/10 px-3 py-2 text-[13px] font-semibold text-blue"
        >
          {result}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onImport}
          disabled={pending || validRows.length === 0}
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-6 py-[11px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending
            ? "Importing…"
            : `Import ${validRows.length} session${validRows.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}
