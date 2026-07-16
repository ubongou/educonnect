import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ResendReportButton } from "@/components/admin/ResendReportButton";
import { ReportDeleteRestore } from "@/components/admin/ReportDeleteRestore";
import { TableScroll } from "@/components/ui/TableScroll";
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

  const reportSelect = `
      id, lesson_date, lesson_focus, understanding_check, confidence_level,
      emailed_at, created_at,
      students ( id, full_name, preferred_name ),
      subjects ( name ),
      uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name )
      `;

  const [{ data }, { data: deletedData }] = await Promise.all([
    supabase
      .from("lesson_reports")
      .select(reportSelect)
      .is("deleted_at", null)
      .order("lesson_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("lesson_reports")
      .select(reportSelect)
      .not("deleted_at", "is", null)
      .order("lesson_date", { ascending: false })
      .limit(50),
  ]);

  const rows = (data ?? []) as unknown as ReportRow[];
  const deletedRows = (deletedData ?? []) as unknown as ReportRow[];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Lesson reports
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Every lesson report submitted by teachers across the platform. Showing
          the most recent {rows.length}.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">
            No lesson reports have been submitted yet.
          </p>
        </div>
      ) : (
        <TableScroll minWidth={980}>
          <table className="w-full text-[14px]">
            <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
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
                  <tr key={r.id} className="border-t border-line align-middle hover:bg-paper">
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
                        <ReportDeleteRestore reportId={r.id} deleted={false} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}

      {deletedRows.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            Recently deleted
          </h2>
          <p className="mb-4 text-[13px] text-g600">
            Hidden from parents, teachers, and the charts. Restore to bring a
            report back exactly as it was.
          </p>
          <TableScroll minWidth={720}>
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedRows.map((r) => {
                  const studentName =
                    r.students?.preferred_name?.trim() ||
                    r.students?.full_name ||
                    "—";
                  return (
                    <tr key={r.id} className="border-t border-line text-g600">
                      <td className="px-5 py-3 font-heading font-bold">
                        {formatDate(r.lesson_date)}
                      </td>
                      <td className="px-5 py-3">{studentName}</td>
                      <td className="px-5 py-3">{r.subjects?.name ?? "—"}</td>
                      <td className="px-5 py-3">{r.uploader?.full_name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <ReportDeleteRestore reportId={r.id} deleted={true} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </section>
      )}
    </Container>
  );
}
