import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ResendReportButton } from "@/components/admin/ResendReportButton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { confidenceBadge, understandingBadge } from "@/lib/scales";
import { formatDate } from "@/lib/format";

type ReportRow = {
  id: string;
  lesson_date: string;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  emailed_at: string | null;
  created_at: string;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
  uploader: { full_name: string | null } | null;
};

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, lesson_date, lesson_focus, understanding_check, confidence_level,
      emailed_at, created_at,
      students ( id, full_name, preferred_name ),
      subjects ( name ),
      uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name )
      `,
    )
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as ReportRow[];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">
          Lesson reports
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Every lesson report submitted by teachers across the platform. Showing
          the most recent {rows.length}.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
          <p className="text-[14px] text-g600">
            No lesson reports have been submitted yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border-[1.5px] border-navy/10 bg-white">
          <table className="w-full text-[14px]">
            <thead className="bg-g50 text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Understanding</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const u = understandingBadge(r.understanding_check);
                const c = confidenceBadge(r.confidence_level);
                const studentName =
                  r.students?.preferred_name?.trim() ||
                  r.students?.full_name ||
                  "—";
                const emailTone: "green" | "gray" =
                  r.emailed_at ? "green" : "gray";
                const emailLabel = r.emailed_at
                  ? `Sent ${formatDate(r.emailed_at)}`
                  : "Not sent";
                return (
                  <tr key={r.id} className="border-t border-g100 align-middle hover:bg-g50">
                    <td className="px-5 py-3 font-heading font-bold text-navy">
                      {formatDate(r.lesson_date)}
                    </td>
                    <td className="px-5 py-3 text-navy">
                      {r.students?.id ? (
                        <Link
                          href={`/admin/students/${r.students.id}`}
                          className="font-semibold underline-offset-4 hover:underline"
                        >
                          {studentName}
                        </Link>
                      ) : (
                        studentName
                      )}
                    </td>
                    <td className="px-5 py-3 text-navy">
                      {r.subjects?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-navy">
                      {r.uploader?.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-heading text-[13px] font-bold tabular-nums text-navy">
                          {r.understanding_check}/10
                        </span>
                        <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-heading text-[13px] font-bold tabular-nums text-navy">
                          {r.confidence_level}/10
                        </span>
                        <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={emailTone}>{emailLabel}</StatusBadge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/admin/reports/${r.id}`}
                          className="font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-blue underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
                        <ResendReportButton reportId={r.id} />
                      </div>
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
