import Link from "next/link";
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

function friendlyWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TeacherComposerPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const profile = await requireTeacher();
  const { session: selectedId } = await searchParams;

  const supabase = await createClient();

  // Composable = teacher's own sessions that are scheduled + in the past 14
  // days, OR upcoming within the next 14 days, and don't already have a
  // lesson_report attached. Includes recently-completed ones without a
  // report so late write-ups are still possible.
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const fourteenDaysAhead = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const { data: raw } = await supabase
    .from("sessions")
    .select(
      `
      id, scheduled_at, duration_minutes, status,
      student_id, subject_id, lesson_report_id,
      students ( full_name, preferred_name ),
      subjects ( name )
      `,
    )
    .eq("teacher_id", profile.id)
    .gte("scheduled_at", fourteenDaysAgo.toISOString())
    .lte("scheduled_at", fourteenDaysAhead.toISOString())
    .order("scheduled_at", { ascending: true });

  const sessions = ((raw ?? []) as unknown as RawSession[]).filter(
    (s) => s.lesson_report_id === null && s.status !== "cancelled",
  );

  const selected = sessions.find((s) => s.id === selectedId) ?? sessions[0];

  if (!selected) {
    return (
      <Container>
        <div className="mb-8">
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Teacher
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
            Lesson report
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            Every scheduled session that&apos;s still awaiting a report shows up here.
          </p>
        </div>
        <div className="rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[14px] text-g600">
            No sessions waiting for a report. Once admins schedule your next session
            you&apos;ll see it here.
          </p>
        </div>
      </Container>
    );
  }

  const { data: skills } = await supabase
    .from("subject_skills")
    .select("id, name, sort_order")
    .eq("subject_id", selected.subject_id)
    .order("sort_order");

  const skillRows = (skills ?? []) as SubjectSkill[];

  const composable: ComposableSession = {
    id: selected.id,
    scheduled_at: selected.scheduled_at,
    duration_minutes: selected.duration_minutes,
    student_id: selected.student_id,
    subject_id: selected.subject_id,
    student_name:
      selected.students?.preferred_name ??
      selected.students?.full_name ??
      "Unknown student",
    subject_name: selected.subjects?.name ?? "Subject",
  };

  return (
    <Container>
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

      {sessions.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Session
          </span>
          {sessions.map((s) => {
            const active = s.id === selected.id;
            const name =
              s.students?.preferred_name ?? s.students?.full_name ?? "Unknown";
            return (
              <Link
                key={s.id}
                href={`/teacher/sessions?session=${s.id}`}
                className={`inline-flex items-center gap-2 rounded-pill border px-4 py-[6px] font-heading text-[12px] font-semibold transition-colors ${
                  active
                    ? "border-navy bg-navy text-yellow"
                    : "border-navy/20 bg-white text-navy hover:bg-paper"
                }`}
              >
                {name} · {s.subjects?.name ?? "Subject"} ·{" "}
                {friendlyWhen(s.scheduled_at)}
              </Link>
            );
          })}
        </div>
      )}

      <LessonReportForm session={composable} skills={skillRows} />
    </Container>
  );
}
