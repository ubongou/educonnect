import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ResendReportButton } from "@/components/admin/ResendReportButton";
import {
  LessonReportView,
  type LessonReportViewData,
} from "@/components/dashboard/LessonReportView";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

type FullReport = {
  id: string;
  lesson_date: string;
  duration_minutes: number;
  lesson_focus: string;
  understanding_check: number;
  confidence_level: number;
  lesson_highlights: string | null;
  participation: number;
  focus_rating: number;
  homework: number;
  next_focus: string | null;
  how_to_help_at_home: string | null;
  emailed_at: string | null;
  students: {
    id: string;
    full_name: string;
    preferred_name: string | null;
  } | null;
  subjects: { name: string } | null;
  uploader: { full_name: string | null } | null;
  skill_ratings: Array<{
    rating: number;
    skill: { name: string } | null;
  }>;
};

export default async function AdminReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, lesson_date, duration_minutes, lesson_focus,
      understanding_check, confidence_level, lesson_highlights,
      participation, focus_rating, homework,
      next_focus, how_to_help_at_home, emailed_at,
      students ( id, full_name, preferred_name ),
      subjects ( name ),
      uploader:profiles!lesson_reports_uploaded_by_fkey ( full_name ),
      skill_ratings:lesson_report_skill_ratings (
        rating,
        skill:subject_skills ( name )
      )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  const report = data as unknown as FullReport | null;
  if (!report) notFound();

  const view: LessonReportViewData = {
    id: report.id,
    lesson_date: report.lesson_date,
    duration_minutes: report.duration_minutes,
    lesson_focus: report.lesson_focus,
    understanding_check: report.understanding_check,
    confidence_level: report.confidence_level,
    lesson_highlights: report.lesson_highlights,
    participation: report.participation,
    focus_rating: report.focus_rating,
    homework: report.homework,
    next_focus: report.next_focus,
    how_to_help_at_home: report.how_to_help_at_home,
    subject_name: report.subjects?.name ?? "Subject",
    teacher_name: report.uploader?.full_name ?? null,
    skill_ratings: (report.skill_ratings ?? [])
      .map((s) => ({ name: s.skill?.name ?? "Skill", rating: s.rating }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  const studentName =
    report.students?.preferred_name?.trim() || report.students?.full_name || "—";

  return (
    <Container>
      <div className="mb-6">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-blue underline-offset-4 hover:underline"
        >
          ← Back to reports
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Lesson report
          </p>
          <h1 className="mt-1 font-heading text-[28px] font-semibold text-navy">
            {studentName} ·{" "}
            <span className="text-g600">{report.subjects?.name ?? "Subject"}</span>
          </h1>
          <p className="mt-2 text-[13px] text-g600">
            Uploaded by {report.uploader?.full_name ?? "—"} ·{" "}
            {report.students?.id && (
              <Link
                href={`/admin/students/${report.students.id}`}
                className="underline-offset-4 hover:underline"
              >
                Open student profile
              </Link>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge tone={report.emailed_at ? "green" : "gray"}>
            {report.emailed_at
              ? `Email sent ${formatDate(report.emailed_at)}`
              : "Email not sent"}
          </StatusBadge>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/reports/${id}/edit`}
              className="inline-flex items-center rounded-pill border border-navy bg-white px-4 py-1.5 font-heading text-[12px] font-bold text-navy hover:bg-paper"
            >
              Edit report
            </Link>
            <ResendReportButton reportId={report.id} />
          </div>
        </div>
      </div>

      {saved === "1" && (
        <div
          role="status"
          className="mb-6 rounded-md border border-blue/30 bg-blue/10 px-4 py-3 text-[13px] text-navy"
        >
          <strong className="font-heading font-bold">Saved.</strong>{" "}
          Changes are live. The parent email was not re-sent.
        </div>
      )}

      <LessonReportView report={view} />
    </Container>
  );
}
