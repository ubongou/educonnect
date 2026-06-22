import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  LessonReportForm,
  type ComposableSession,
  type SubjectSkill,
} from "@/components/teacher/LessonReportForm";

type RawSession = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  student_id: string;
  subject_id: string;
  lesson_report_id: string | null;
  students: { full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
};

/**
 * The lesson-report composer for a single session. Reached from a row in the
 * Sessions hub (/teacher/sessions). If the session already has a report we send
 * the teacher to the read-only view instead of letting them double-file.
 */
export default async function TeacherSessionComposerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireTeacher();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("sessions")
    .select(
      `
      id, scheduled_at, duration_minutes, status,
      student_id, subject_id, lesson_report_id,
      students ( full_name, preferred_name ),
      subjects ( name )
      `,
    )
    .eq("id", id)
    .eq("teacher_id", profile.id)
    .maybeSingle();

  const session = data as unknown as RawSession | null;
  if (!session) notFound();
  if (session.lesson_report_id) {
    redirect(`/teacher/reports/${session.lesson_report_id}`);
  }
  if (session.status === "cancelled") notFound();

  const { data: skills } = await supabase
    .from("subject_skills")
    .select("id, name, sort_order")
    .eq("subject_id", session.subject_id)
    .order("sort_order");

  const skillRows = (skills ?? []) as SubjectSkill[];

  const studentName =
    session.students?.preferred_name ??
    session.students?.full_name ??
    "Unknown student";

  const composable: ComposableSession = {
    id: session.id,
    scheduled_at: session.scheduled_at,
    duration_minutes: session.duration_minutes,
    student_id: session.student_id,
    subject_id: session.subject_id,
    student_name: studentName,
    subject_name: session.subjects?.name ?? "Subject",
  };

  return (
    <Container>
      <div className="mb-6 text-[13px] text-g600">
        <Link href="/teacher/sessions" className="hover:text-navy">
          Sessions
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">Lesson report</span>
      </div>

      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Lesson report
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Fill in after the session — parents see the report immediately.
        </p>
      </div>

      <LessonReportForm session={composable} skills={skillRows} />
    </Container>
  );
}
