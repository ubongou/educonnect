import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  SessionScheduler,
  type SchedulableEnrollment,
} from "@/components/admin/SessionScheduler";
import { RecurringSessionForm } from "@/components/admin/RecurringSessionForm";
import {
  SessionRowActions,
  type SessionTeacherOption,
} from "@/components/admin/SessionRowActions";

type SessionRow = {
  id: string;
  session_date: string;
  duration_minutes: number;
  status: string;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
  teacher: { id: string; full_name: string | null } | null;
};

const statusTone: Record<string, string> = {
  scheduled: "border-blue/40 bg-blue/10 text-blue",
  completed: "border-blue/40 bg-blue/10 text-blue",
  cancelled: "border-g400/40 bg-g100 text-g600",
  no_show: "border-coral/40 bg-coral/10 text-coral",
};

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? statusTone.scheduled;
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${tone}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default async function AdminSchedulePage() {
  const supabase = await createClient();

  // Sessions are date-only — "upcoming" means today or later by calendar day.
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: sessions }, { data: schedulable }, { data: teacherList }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select(
          `
        id, session_date, duration_minutes, status,
        students ( id, full_name, preferred_name ),
        subjects ( name ),
        teacher:profiles!sessions_teacher_id_fkey ( id, full_name )
        `,
        )
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .limit(60),
      supabase
        .from("enrollments")
        .select(
          `
        id, teacher_id,
        students ( full_name, preferred_name ),
        subjects ( name ),
        teacher:profiles!enrollments_teacher_id_fkey ( full_name )
        `,
        )
        .eq("status", "approved")
        .not("teacher_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "teacher")
        .is("deactivated_at", null)
        .order("full_name"),
    ]);

  const teacherOptions: SessionTeacherOption[] = (teacherList ?? []).map((t) => ({
    id: t.id,
    name: t.full_name ?? "Unnamed teacher",
  }));

  const rows = (sessions ?? []) as unknown as SessionRow[];

  const schedulableRows: SchedulableEnrollment[] = (schedulable ?? []).map(
    (e: unknown) => {
      const row = e as {
        id: string;
        students: { full_name: string; preferred_name: string | null } | null;
        subjects: { name: string } | null;
        teacher: { full_name: string | null } | null;
      };
      return {
        id: row.id,
        student_name:
          row.students?.preferred_name ?? row.students?.full_name ?? "Unknown student",
        subject_name: row.subjects?.name ?? "Subject",
        teacher_name: row.teacher?.full_name ?? "Unassigned",
      };
    },
  );

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">Schedule</h1>
        <p className="mt-2 text-[14px] text-g600">
          Schedule individual sessions for approved enrollments. Each session becomes
          visible to the assigned teacher and the student&apos;s parent immediately.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Schedule a session
        </h2>
        <SessionScheduler enrollments={schedulableRows} />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Schedule a recurring run
        </h2>
        <RecurringSessionForm enrollments={schedulableRows} />
      </section>

      <section className="mb-12">
        <h2 className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Import past sessions
        </h2>
        <p className="text-[14px] text-g600">
          Bulk-add lessons that already happened, each with a full report, on the{" "}
          <Link
            href="/admin/sessions/import"
            className="font-semibold text-blue underline-offset-4 hover:underline"
          >
            import page
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Upcoming sessions
        </h2>
        {rows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
            <p className="text-[14px] text-g600">No sessions scheduled.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3 text-right">Duration</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-5 py-3 font-heading font-bold text-navy">
                      {new Date(s.session_date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-navy">
                      {s.students?.preferred_name ?? s.students?.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-g600">{s.subjects?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      {s.teacher ? (
                        <Link
                          href={`/admin/teachers/${s.teacher.id}`}
                          className="text-blue underline-offset-4 hover:underline"
                        >
                          {s.teacher.full_name ?? "Unnamed"}
                        </Link>
                      ) : (
                        <span className="text-g400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-g600">
                      {s.duration_minutes} min
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <SessionRowActions
                        sessionId={s.id}
                        sessionDate={s.session_date}
                        durationMinutes={s.duration_minutes}
                        teacherId={s.teacher?.id ?? null}
                        status={s.status}
                        teachers={teacherOptions}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
