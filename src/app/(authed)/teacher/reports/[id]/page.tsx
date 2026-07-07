import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import {
  LessonReportView,
  type LessonReportViewData,
} from "@/components/dashboard/LessonReportView";
import { ReportAttachmentsManager } from "@/components/teacher/ReportAttachmentsManager";
import { ReportThread } from "@/components/dashboard/ReportThread";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { loadReportFiles } from "@/lib/reports/attachments";
import { loadReportThread } from "@/lib/reports/messages";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

type FullReport = {
  id: string;
  uploaded_by: string;
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
  recording_url: string | null;
  first_viewed_at: string | null;
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

export default async function TeacherReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, uploaded_by, lesson_date, duration_minutes, lesson_focus,
      understanding_check, confidence_level, lesson_highlights,
      participation, focus_rating, homework,
      next_focus, how_to_help_at_home, recording_url, first_viewed_at,
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
    .is("deleted_at", null)
    .maybeSingle();

  // RLS scopes what a teacher can read: reports they uploaded, plus reports
  // for any (student, subject) they're the enrolled teacher of — exactly what
  // the embedded progress dashboard surfaces. A missing row means RLS blocked
  // it, so a plain not-found is the right response.
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
    recording_url: report.recording_url,
    subject_name: report.subjects?.name ?? "Subject",
    teacher_name: report.uploader?.full_name ?? null,
    skill_ratings: (report.skill_ratings ?? [])
      .map((s) => ({ name: s.skill?.name ?? "Skill", rating: s.rating }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  const studentName =
    report.students?.preferred_name?.trim() || report.students?.full_name || "—";
  const studentId = report.students?.id;

  const { attachments, submissions } = await loadReportFiles(supabase, id);
  const messages = await loadReportThread(supabase, id);

  return (
    <Container>
      <div className="mb-6 text-[13px] text-g600">
        <Link href="/teacher/students" className="hover:text-navy">
          My students
        </Link>
        {studentId && (
          <>
            <span aria-hidden="true" className="mx-2">
              ›
            </span>
            <Link href={`/teacher/students/${studentId}`} className="hover:text-navy">
              {studentName}
            </Link>
          </>
        )}
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">Lesson report</span>
      </div>

      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Lesson report
        </p>
        <h1 className="mt-1 font-heading text-[28px] font-semibold text-navy">
          {studentName} ·{" "}
          <span className="text-g600">{report.subjects?.name ?? "Subject"}</span>
        </h1>
        <div className="mt-3">
          <StatusBadge tone={report.first_viewed_at ? "blue" : "gray"}>
            {report.first_viewed_at
              ? `Viewed by parent ${formatDate(report.first_viewed_at)}`
              : "Not viewed yet"}
          </StatusBadge>
        </div>
      </div>

      <LessonReportView
        report={view}
        attachments={attachments}
        submissions={submissions}
        reviewable
        thread={
          <ReportThread
            reportId={report.id}
            messages={messages}
            viewerId={teacher.id}
          />
        }
      />

      {studentId && (
        <div className="mt-6">
          <ReportAttachmentsManager reportId={report.id} studentId={studentId} />
        </div>
      )}
    </Container>
  );
}
