import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  DecisionButtons,
  type PendingEnrollmentRow,
} from "@/components/admin/DecisionButtons";

export default async function AdminEnrollmentsQueue() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      id, status, created_at,
      students ( id, full_name, preferred_name, registration_number ),
      subjects ( id, name, slug ),
      requester:profiles!enrollments_requested_by_fkey ( id, full_name, email )
      `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as unknown as PendingEnrollmentRow[];

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Admin
          </p>
          <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
            Enrollments queue
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {rows.length === 0
              ? "No pending enrollment requests."
              : `${rows.length} pending ${rows.length === 1 ? "request" : "requests"} awaiting review.`}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-12 text-center">
          <p className="text-[14px] text-g600">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border-[1.5px] border-navy/10 bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-g50 text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Parent</th>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3 text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const studentName =
                  r.students?.preferred_name ?? r.students?.full_name ?? "Unknown";
                return (
                  <tr key={r.id} className="border-t border-g100">
                    <td className="px-5 py-3">
                      {r.students ? (
                        <Link
                          href={`/admin/students/${r.students.id}`}
                          className="font-heading font-bold text-navy underline-offset-4 hover:underline"
                        >
                          {studentName}
                        </Link>
                      ) : (
                        <span className="font-heading font-bold text-navy">{studentName}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-navy">{r.subjects?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-navy">
                          {r.requester?.full_name ?? "Unknown"}
                        </span>
                        {r.requester?.email && (
                          <a
                            href={`mailto:${r.requester.email}`}
                            className="text-[12px] text-g400 underline-offset-4 hover:underline"
                          >
                            {r.requester.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-g600">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3">
                      <DecisionButtons id={r.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
