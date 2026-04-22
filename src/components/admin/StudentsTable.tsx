"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatRegistrationNumber, formatDate } from "@/lib/format";
import { inputBase } from "@/components/ui/FormField";

export type StudentRow = {
  id: string;
  registration_number: string;
  full_name: string;
  preferred_name: string | null;
  age: number | null;
  current_school: string | null;
  curriculum: string | null;
  intake_submitted_at: string | null;
};

function matches(s: StudentRow, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const haystack = [
    s.registration_number,
    s.full_name,
    s.preferred_name ?? "",
    s.current_school ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => rows.filter((r) => matches(r, q)), [rows, q]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, reg number, or school"
          aria-label="Search students"
          className={`${inputBase} w-full max-w-[360px]`}
        />
        <p className="text-[13px] text-g600">
          {filtered.length} of {rows.length} students
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No students yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No students match “{q}”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border-[1.5px] border-navy/10 bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-g50 text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              <tr>
                <th className="px-5 py-3">Reg no.</th>
                <th className="px-5 py-3">Full name</th>
                <th className="px-5 py-3">Preferred</th>
                <th className="px-5 py-3">School</th>
                <th className="px-5 py-3">Age</th>
                <th className="px-5 py-3">Intake</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-g100 transition-colors hover:bg-g50"
                >
                  <td className="px-5 py-3 font-heading font-bold tabular-nums text-navy">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {formatRegistrationNumber(s.registration_number)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-navy">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {s.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-g600">{s.preferred_name ?? "—"}</td>
                  <td className="px-5 py-3 text-g600">{s.current_school ?? "—"}</td>
                  <td className="px-5 py-3 tabular-nums text-navy">{s.age ?? "—"}</td>
                  <td className="px-5 py-3 text-g600">
                    {s.intake_submitted_at ? formatDate(s.intake_submitted_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
