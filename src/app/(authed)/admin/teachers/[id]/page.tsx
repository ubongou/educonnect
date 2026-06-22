import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatRegistrationNumber } from "@/lib/format";
import { ProfileManageBar } from "@/components/admin/ProfileManageBar";

type EnrollmentRow = {
  id: string;
  status: string;
  students: {
    id: string;
    full_name: string;
    preferred_name: string | null;
    registration_number: string;
  } | null;
  subjects: { id: string; name: string } | null;
};

type SessionRow = {
  id: string;
  session_date: string;
  status: string;
  students: { id: string; full_name: string; preferred_name: string | null } | null;
  subjects: { name: string } | null;
};

export default async function AdminTeacherDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, role, deactivated_at")
    .eq("id", id)
    .eq("role", "teacher")
    .maybeSingle();

  if (!teacher) notFound();

  const [{ data: enrollments }, { data: sessions }, { data: otherTeachers }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select(
          `
        id, status,
        students ( id, full_name, preferred_name, registration_number ),
        subjects ( id, name )
        `,
        )
        .eq("teacher_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select(
          `
        id, session_date, status,
        students ( id, full_name, preferred_name ),
        subjects ( name )
        `,
        )
        .eq("teacher_id", id)
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .order("session_date", { ascending: true })
        .limit(20),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "teacher")
        .is("deactivated_at", null)
        .neq("id", id)
        .order("full_name"),
    ]);

  const enr = (enrollments ?? []) as unknown as EnrollmentRow[];
  const sess = (sessions ?? []) as unknown as SessionRow[];

  // Reassign data for deactivation: live workload + other active teachers.
  const reassignTargets = (otherTeachers ?? []).map((t) => ({
    id: t.id,
    name: t.full_name ?? "Unnamed teacher",
  }));
  const activeEnrollmentCount = enr.filter((e) => e.status === "approved").length;
  const upcomingSessionCount = sess.filter((s) => s.status === "scheduled").length;

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/admin/teachers" className="hover:text-navy">
          Teachers
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">{teacher.full_name ?? "Unnamed"}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <h1 className="font-heading text-[clamp(28px,3.4vw,40px)] font-semibold leading-tight text-navy">
            {teacher.full_name ?? "Unnamed teacher"}
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {teacher.email ?? "no email"}
            {teacher.phone && ` · ${teacher.phone}`}
            {` · created ${formatDate(teacher.created_at)}`}
          </p>
        </div>
        <ProfileManageBar
          profileId={teacher.id}
          fullName={teacher.full_name ?? "Unnamed teacher"}
          phone={teacher.phone ?? ""}
          email={teacher.email ?? ""}
          active={teacher.deactivated_at == null}
          reassign={{
            targets: reassignTargets,
            enrollmentCount: activeEnrollmentCount,
            sessionCount: upcomingSessionCount,
          }}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Assigned enrollments
        </h2>
        {enr.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            This teacher isn&apos;t assigned to any enrollments yet. Head to{" "}
            <Link
              href="/admin/enrollments"
              className="font-semibold text-blue underline-offset-4 hover:underline"
            >
              Enrollments
            </Link>{" "}
            to approve pending requests and assign them.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {enr.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-semibold text-navy">
                    {e.students?.preferred_name ?? e.students?.full_name ?? "Unknown"}
                    {" · "}
                    {e.subjects?.name ?? "Subject"}
                  </p>
                  {e.students && (
                    <p className="mt-1 text-[12px] text-g400">
                      {formatRegistrationNumber(e.students.registration_number)} ·{" "}
                      <Link
                        href={`/admin/students/${e.students.id}`}
                        className="text-blue underline-offset-4 hover:underline"
                      >
                        Student detail
                      </Link>
                    </p>
                  )}
                </div>
                <span className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                  {e.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Upcoming sessions
        </h2>
        {sess.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No upcoming sessions scheduled for this teacher. Visit{" "}
            <Link
              href="/admin/schedule"
              className="font-semibold text-blue underline-offset-4 hover:underline"
            >
              Schedule
            </Link>{" "}
            to create one.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sess.map((s) => (
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
                    <td className="px-5 py-3 text-right font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-g400">
                      {s.status}
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
