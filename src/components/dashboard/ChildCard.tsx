import Link from "next/link";
import type { EnrollmentStatus } from "@/types/domain";
import { formatDate, formatRegistrationNumber } from "@/lib/format";

type EnrollmentLite = { status: string; subject_id: string };
type ReportLite = { id: string; lesson_date: string };

export type ChildCardStudent = {
  id: string;
  registration_number: string;
  full_name: string;
  preferred_name: string | null;
  current_school: string | null;
  enrollments: EnrollmentLite[] | null;
  lesson_reports: ReportLite[] | null;
};

function countBy(list: EnrollmentLite[] | null | undefined, status: EnrollmentStatus) {
  if (!list) return 0;
  return list.filter((e) => e.status === status).length;
}

function latestReport(reports: ReportLite[] | null | undefined): string | null {
  if (!reports || reports.length === 0) return null;
  const sorted = [...reports].sort((a, b) => b.lesson_date.localeCompare(a.lesson_date));
  return sorted[0]?.lesson_date ?? null;
}

export function ChildCard({ student }: { student: ChildCardStudent }) {
  const displayName = student.preferred_name ?? student.full_name;
  const approved = countBy(student.enrollments, "approved");
  const pending = countBy(student.enrollments, "pending");
  const lastReport = latestReport(student.lesson_reports);

  return (
    <Link
      href={`/dashboard/children/${student.id}`}
      className="group flex flex-col gap-5 rounded-lg border-[1.5px] border-navy/10 bg-white p-6 shadow-[0_8px_24px_-20px_rgba(4,19,28,0.25)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-[0_14px_32px_-18px_rgba(4,19,28,0.35)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-navy">
            {formatRegistrationNumber(student.registration_number)}
          </span>
          <h3 className="mt-3 font-heading text-[22px] font-extrabold leading-tight text-navy">
            {displayName}
          </h3>
          {student.current_school && (
            <p className="mt-1 text-[13px] text-g600">{student.current_school}</p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="mt-2 h-8 w-8 shrink-0 rounded-full border-[1.5px] border-navy/20 transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full p-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-g100 pt-4 text-[12px]">
        <div>
          <dt className="font-heading font-semibold uppercase tracking-[0.08em] text-g400">
            Approved
          </dt>
          <dd className="mt-1 font-heading text-[20px] font-extrabold text-navy">{approved}</dd>
        </div>
        <div>
          <dt className="font-heading font-semibold uppercase tracking-[0.08em] text-g400">
            Pending
          </dt>
          <dd className="mt-1 font-heading text-[20px] font-extrabold text-coral">{pending}</dd>
        </div>
        <div>
          <dt className="font-heading font-semibold uppercase tracking-[0.08em] text-g400">
            Last report
          </dt>
          <dd className="mt-1 font-heading text-[13px] font-bold text-navy">
            {lastReport ? formatDate(lastReport) : "—"}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
