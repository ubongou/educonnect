import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  ReportView,
  type ReportViewReport,
  type ReportViewSkill,
  type ReportViewStudent,
  type ReportViewSubject,
} from "@/components/dashboard/ReportView";

type ReportWithJoins = ReportViewReport & {
  students: (ReportViewStudent & { id: string }) | null;
  subjects: (ReportViewSubject & { id: string }) | null;
  lesson_report_skill_ratings: Array<{ skill_id: string; rating: number }> | null;
};

export default async function ParentReportPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const { id, reportId } = await params;
  const supabase = await createClient();

  const { data: report } = (await supabase
    .from("lesson_reports")
    .select(
      `
      id, lesson_date, duration_minutes, lesson_focus,
      understanding_check, confidence_level, lesson_highlights,
      participation, focus_rating, homework,
      next_focus, how_to_help_at_home, emailed_at,
      students(id, full_name, preferred_name, registration_number),
      subjects(id, name),
      lesson_report_skill_ratings(skill_id, rating)
      `,
    )
    .eq("id", reportId)
    .eq("student_id", id)
    .maybeSingle()) as { data: ReportWithJoins | null };

  if (!report || !report.students || !report.subjects) notFound();

  const { data: subjectSkills } = await supabase
    .from("subject_skills")
    .select("id, name, description, sort_order")
    .eq("subject_id", report.subjects.id)
    .order("sort_order");

  const ratingsBySkill = new Map(
    (report.lesson_report_skill_ratings ?? []).map((r) => [r.skill_id, r.rating]),
  );
  const skills: ReportViewSkill[] = (subjectSkills ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    rating: ratingsBySkill.get(s.id) ?? null,
  }));

  const displayName = report.students.preferred_name ?? report.students.full_name;

  return (
    <Container>
      <div className="mb-6 text-[13px] text-g600">
        <Link href="/dashboard" className="hover:text-navy">
          My children
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <Link href={`/dashboard/children/${id}`} className="hover:text-navy">
          {displayName}
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <Link
          href={`/dashboard/children/${id}?tab=reports`}
          className="hover:text-navy"
        >
          Reports
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">
          {report.subjects.name} · {report.lesson_date}
        </span>
      </div>

      <ReportView
        report={report}
        student={report.students}
        subject={report.subjects}
        skills={skills}
      />
    </Container>
  );
}
