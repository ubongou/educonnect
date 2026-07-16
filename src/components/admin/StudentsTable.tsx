"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRegistrationNumber, formatDate } from "@/lib/format";
import { inputBase } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableScroll } from "@/components/ui/TableScroll";
import { deleteStudent, setStudentArchived } from "@/lib/actions/students";

export type StudentRow = {
  id: string;
  registration_number: string;
  full_name: string;
  preferred_name: string | null;
  age: number | null;
  current_school: string | null;
  curriculum: string | null;
  intake_submitted_at: string | null;
  archived_at: string | null;
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
  const activeRows = filtered.filter((r) => r.archived_at == null);
  const archivedRows = filtered.filter((r) => r.archived_at != null);

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
        <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No students yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No students match “{q}”.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activeRows.length > 0 && (
            <TableScroll
              minWidth={880}
              className="overflow-hidden rounded-lg border border-line bg-white"
            >
              <table className="w-full text-[14px]">
                <Head />
                <tbody>
                  {activeRows.map((s) => (
                    <StudentTr key={s.id} s={s} />
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}

          {archivedRows.length > 0 && (
            <details className="group overflow-hidden rounded-lg border border-line bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 font-heading text-[13px] font-bold text-g600 marker:content-none hover:bg-paper">
                <span>Archived students ({archivedRows.length})</span>
                <span
                  aria-hidden="true"
                  className="text-g400 transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <TableScroll minWidth={880} className="border-t border-line">
                <table className="w-full text-[14px]">
                  <Head withAction />
                  <tbody>
                    {archivedRows.map((s) => (
                      <StudentTr key={s.id} s={s} withAction />
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Head({ withAction = false }: { withAction?: boolean }) {
  return (
    <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
      <tr>
        <th className="px-5 py-3">Reg no.</th>
        <th className="px-5 py-3">Full name</th>
        <th className="px-5 py-3">Preferred</th>
        <th className="px-5 py-3">School</th>
        <th className="px-5 py-3">Age</th>
        <th className="px-5 py-3">Intake</th>
        {withAction && <th className="px-5 py-3 text-right">Action</th>}
      </tr>
    </thead>
  );
}

function StudentTr({ s, withAction = false }: { s: StudentRow; withAction?: boolean }) {
  const archived = s.archived_at != null;
  return (
    <tr
      className={`border-t border-line transition-colors hover:bg-paper ${
        archived ? "bg-paper/50" : ""
      }`}
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
      {withAction && (
        <td className="px-5 py-3">
          <div className="flex items-center justify-end gap-4">
            <RestoreButton id={s.id} />
            <DeleteStudentButton
              id={s.id}
              registrationNumber={s.registration_number}
              fullName={s.full_name}
            />
          </div>
        </td>
      )}
    </tr>
  );
}

function RestoreButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setStudentArchived(id, false);
          if (res.ok) router.refresh();
        })
      }
      className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:text-navy hover:underline disabled:opacity-50"
    >
      {pending ? "Restoring…" : "Restore"}
    </button>
  );
}

function DeleteStudentButton({
  id,
  registrationNumber,
  fullName,
}: {
  id: string;
  registrationNumber: string;
  fullName: string;
}) {
  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="font-heading text-[13px] font-semibold text-coral underline-offset-4 hover:text-navy hover:underline"
        >
          Delete
        </button>
      }
      title={`Delete ${fullName}`}
      confirmLabel="Delete student"
      confirmWord={registrationNumber}
      cascade={[
        "All enrollments, scheduled and past sessions",
        "All lesson reports and skill ratings",
        "Intake files and uploaded documents",
        "The parent link to this student",
      ]}
      description="This permanently removes the student and everything below. It cannot be undone."
      onConfirm={() => deleteStudent(id)}
    />
  );
}
