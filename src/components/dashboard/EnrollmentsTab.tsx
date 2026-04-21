import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { EnrollmentStatus } from "@/types/domain";

export type EnrollmentRow = {
  id: string;
  status: string;
  decided_at: string | null;
  created_at: string;
  subjects: { name: string; slug: string } | null;
};

const statusStyles: Record<EnrollmentStatus, string> = {
  pending: "border-coral/40 bg-coral/10 text-coral",
  approved: "border-blue/40 bg-blue/10 text-blue",
  rejected: "border-g400/40 bg-g100 text-g600",
};

function StatusPill({ status }: { status: string }) {
  const style = statusStyles[status as EnrollmentStatus] ?? statusStyles.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill border-[1.5px] px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${style}`}
    >
      {status}
    </span>
  );
}

export function EnrollmentsTab({
  studentId,
  enrollments,
}: {
  studentId: string;
  enrollments: EnrollmentRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-g600">
          Subjects your child is enrolled in. Admins review requests and match a teacher.
        </p>
        <Button href={`/dashboard/children/${studentId}/enroll`}>Request a subject</Button>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
          <p className="text-[14px] text-g600">No subjects requested yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {enrollments.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-[1.5px] border-navy/10 bg-white px-5 py-4"
            >
              <div>
                <h4 className="font-heading text-[16px] font-extrabold text-navy">
                  {e.subjects?.name ?? "Subject"}
                </h4>
                <p className="mt-1 text-[12px] text-g400">
                  Requested {formatDate(e.created_at)}
                  {e.decided_at && ` · decided ${formatDate(e.decided_at)}`}
                </p>
              </div>
              <StatusPill status={e.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
