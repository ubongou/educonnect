import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AdminReportEditForm } from "@/components/admin/AdminReportEditForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type EditLoadReport = {
  id: string;
  subject_id: string;
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
  students: {
    id: string;
    full_name: string;
    preferred_name: string | null;
  } | null;
  subjects: { name: string } | null;
  skill_ratings: Array<{
    rating: number;
    skill: { id: string; name: string; sort_order: number } | null;
  }>;
};

type SubjectSkillRow = {
  id: string;
  name: string;
  sort_order: number;
};

export default async function AdminReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("lesson_reports")
    .select(
      `
      id, subject_id, lesson_date, duration_minutes, lesson_focus,
      understanding_check, confidence_level, lesson_highlights,
      participation, focus_rating, homework,
      next_focus, how_to_help_at_home,
      students ( id, full_name, preferred_name ),
      subjects ( name ),
      skill_ratings:lesson_report_skill_ratings (
        rating,
        skill:subject_skills ( id, name, sort_order )
      )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  const report = data as unknown as EditLoadReport | null;
  if (!report) notFound();

  // Pull the full skill list for the subject so admins can rate skills that
  // weren't rated in the original report (or zero out ones that were).
  const { data: subjectSkillsRaw } = await supabase
    .from("subject_skills")
    .select("id, name, sort_order")
    .eq("subject_id", report.subject_id)
    .order("sort_order", { ascending: true });

  const subjectSkills = (subjectSkillsRaw ?? []) as SubjectSkillRow[];

  const existingRatings = new Map<string, number>();
  for (const r of report.skill_ratings ?? []) {
    if (r.skill?.id) existingRatings.set(r.skill.id, r.rating);
  }

  const skills = subjectSkills.map((s) => ({
    id: s.id,
    name: s.name,
    rating: existingRatings.get(s.id) ?? 0,
  }));

  const studentName =
    report.students?.preferred_name?.trim() || report.students?.full_name || "—";
  const subjectName = report.subjects?.name ?? "Subject";

  return (
    <Container>
      <div className="mb-6">
        <Link
          href={`/admin/reports/${id}`}
          className="inline-flex items-center gap-1 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-blue underline-offset-4 hover:underline"
        >
          ← Back to report
        </Link>
      </div>

      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Edit lesson report
        </p>
        <h1 className="mt-1 font-heading text-[28px] font-semibold text-navy">
          {studentName} ·{" "}
          <span className="text-g600">{subjectName}</span>
        </h1>
      </div>

      <AdminReportEditForm
        reportId={report.id}
        studentName={studentName}
        subjectName={subjectName}
        initial={{
          lesson_date: report.lesson_date,
          duration_minutes: report.duration_minutes,
          lesson_focus: report.lesson_focus,
          lesson_highlights: report.lesson_highlights,
          next_focus: report.next_focus,
          how_to_help_at_home: report.how_to_help_at_home,
          understanding_check: report.understanding_check,
          confidence_level: report.confidence_level,
          participation: report.participation,
          focus_rating: report.focus_rating,
          homework: report.homework,
        }}
        skills={skills}
      />
    </Container>
  );
}
