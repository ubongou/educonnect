import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";

type SessionRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
};

// Sessions are scheduled by date only — no time of day.
function friendlyWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default async function TeacherOverview({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const profile = await requireTeacher();
  const { submitted } = await searchParams;

  const supabase = await createClient();
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [{ data: upcoming }, reportsSevenDays, studentsCount] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        `
        id, scheduled_at, duration_minutes,
        students ( id, full_name, preferred_name ),
        subjects ( name )
        `,
      )
      .eq("teacher_id", profile.id)
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("lesson_reports")
      .select("id", { count: "exact", head: true })
      .eq("uploaded_by", profile.id)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("enrollments")
      .select("student_id")
      .eq("teacher_id", profile.id)
      .eq("status", "approved"),
  ]);

  const upcomingRows = (upcoming ?? []) as unknown as SessionRow[];
  const reports7d = reportsSevenDays.count ?? 0;
  const studentSet = new Set((studentsCount.data ?? []).map((r) => r.student_id));

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Here&apos;s what&apos;s on your plate.
        </p>
      </div>

      {submitted === "1" && (
        <div
          role="status"
          className="mb-8 rounded-md border border-blue/40 bg-blue/10 px-4 py-3 text-[14px] font-semibold text-blue"
        >
          Lesson report submitted. The parent can see it now.
        </div>
      )}

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-line bg-white p-7">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Students
          </p>
          <p className="mt-2 font-heading text-[40px] font-semibold leading-none tabular-nums text-navy">
            {studentSet.size}
          </p>
          <p className="mt-3 text-[13px] text-g600">
            Distinct students across your approved enrollments.
          </p>
          <Link
            href="/teacher/students"
            className="mt-4 inline-flex items-center font-heading text-[13px] font-bold text-blue"
          >
            View students →
          </Link>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-7">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Reports · last 7 days
          </p>
          <p className="mt-2 font-heading text-[40px] font-semibold leading-none tabular-nums text-navy">
            {reports7d}
          </p>
          <p className="mt-3 text-[13px] text-g600">
            Lesson reports you submitted this week.
          </p>
          <Link
            href="/teacher/sessions?filter=needs"
            className="mt-4 inline-flex items-center font-heading text-[13px] font-bold text-blue"
          >
            New report →
          </Link>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-7">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
            Upcoming sessions
          </p>
          <p className="mt-2 font-heading text-[40px] font-semibold leading-none tabular-nums text-navy">
            {upcomingRows.length}
          </p>
          <p className="mt-3 text-[13px] text-g600">
            Scheduled in the next few days.
          </p>
          <Link
            href="/teacher/sessions"
            className="mt-4 inline-flex items-center font-heading text-[13px] font-bold text-blue"
          >
            See sessions →
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Next sessions
        </h2>
        {upcomingRows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-10 text-center">
            <p className="text-[14px] text-g600">
              Nothing scheduled yet. Admins will set your sessions here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcomingRows.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-semibold text-navy">
                    {s.students?.preferred_name ?? s.students?.full_name ?? "Unknown"}
                  </p>
                  <p className="mt-1 text-[12px] text-g400">
                    {s.subjects?.name ?? "Subject"} · {s.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-g600">
                    {friendlyWhen(s.scheduled_at)}
                  </span>
                  <StatusBadge tone="blue">Scheduled</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
