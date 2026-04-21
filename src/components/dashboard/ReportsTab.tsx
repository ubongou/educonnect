import Link from "next/link";
import { formatDate, formatSkillRating } from "@/lib/format";

export type ReportRow = {
  id: string;
  lesson_date: string;
  understanding_check: number;
  confidence_level: number;
  subjects: { name: string; slug: string } | null;
};

export function ReportsTab({
  studentId,
  reports,
}: {
  studentId: string;
  reports: ReportRow[];
}) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-10 text-center">
        <p className="text-[14px] text-g600">No lesson reports yet.</p>
      </div>
    );
  }

  const sorted = [...reports].sort((a, b) => b.lesson_date.localeCompare(a.lesson_date));

  return (
    <div className="overflow-hidden rounded-lg border-[1.5px] border-navy/10 bg-white">
      <table className="w-full text-[14px]">
        <thead className="bg-g50 text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
          <tr>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Subject</th>
            <th className="px-5 py-3">Understanding</th>
            <th className="px-5 py-3">Confidence</th>
            <th className="px-5 py-3 text-right">Report</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              className="border-t border-g100 transition-colors hover:bg-g50"
            >
              <td className="px-5 py-3 font-heading font-bold text-navy">
                {formatDate(r.lesson_date)}
              </td>
              <td className="px-5 py-3 text-navy">{r.subjects?.name ?? "—"}</td>
              <td className="px-5 py-3 tabular-nums text-navy">
                {formatSkillRating(r.understanding_check)}
              </td>
              <td className="px-5 py-3 tabular-nums text-navy">
                {formatSkillRating(r.confidence_level)}
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  href={`/dashboard/children/${studentId}/reports/${r.id}`}
                  className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
