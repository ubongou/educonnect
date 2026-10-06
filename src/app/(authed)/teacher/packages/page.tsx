import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { loadPackages, type PackageView } from "@/lib/packages/load";
import { runwayLabel } from "@/lib/packages/progress";

type EnrollmentRow = {
  id: string;
  student_id: string;
  students: { full_name: string; preferred_name: string | null; archived_at: string | null } | null;
  subjects: { name: string } | null;
};

const runwayTone = { running: "blue", almost_out: "amber", out: "coral" } as const;

/**
 * The teacher's packages: one row per child + subject they teach, showing the
 * open package's progress (or a prompt to start one), then the packages
 * waiting on the office and the ones it has accepted.
 */
export default async function TeacherPackagesPage() {
  const profile = await requireTeacher();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: enrollmentData }, { packages, error }, { data: upcoming }, { data: packaged }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("id, student_id, students ( full_name, preferred_name, archived_at ), subjects ( name )")
        .eq("teacher_id", profile.id)
        .eq("status", "approved"),
      loadPackages(supabase, { teacherId: profile.id }),
      supabase
        .from("sessions")
        .select("id, enrollment_id")
        .eq("teacher_id", profile.id)
        .eq("status", "scheduled")
        .gte("session_date", today)
        .limit(1000),
      supabase.from("teacher_package_sessions").select("session_id"),
    ]);

  const enrollments = ((enrollmentData ?? []) as unknown as EnrollmentRow[])
    .filter((e) => !e.students?.archived_at)
    .sort((a, b) =>
      (a.students?.preferred_name ?? a.students?.full_name ?? "").localeCompare(
        b.students?.preferred_name ?? b.students?.full_name ?? "",
      ),
    );

  const openByEnrollment = new Map(
    packages.filter((p) => p.status === "open").map((p) => [p.enrollmentId, p]),
  );
  const taken = new Set((packaged ?? []).map((p) => p.session_id));
  const unpackagedUpcoming = new Map<string, number>();
  for (const s of upcoming ?? []) {
    if (taken.has(s.id)) continue;
    unpackagedUpcoming.set(s.enrollment_id, (unpackagedUpcoming.get(s.enrollment_id) ?? 0) + 1);
  }

  const waiting = packages.filter((p) => p.status === "complete");
  const accepted = packages.filter((p) => p.status === "accepted").slice(0, 20);

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Teacher
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Packages
        </h1>
        <p className="mt-2 max-w-[640px] text-[14px] text-g600">
          Set up each child&apos;s block of lessons ahead of time, put their booked lessons towards
          it, and confirm it when it&apos;s done. The office uses this to know when to bill.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-coral/40 bg-coral/10 p-4 text-[14px] text-navy">
          Couldn&apos;t load your packages: {error}
        </p>
      )}

      <section className="mb-10">
        <h2 className="mb-4 font-heading text-[18px] font-semibold text-navy">Your children</h2>
        {enrollments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-[14px] text-g600">
            You don&apos;t have any children assigned yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {enrollments.map((e) => {
              const pkg = openByEnrollment.get(e.id);
              const loose = unpackagedUpcoming.get(e.id) ?? 0;
              const name = e.students?.preferred_name ?? e.students?.full_name ?? "Student";
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-heading text-[15px] font-semibold text-navy">
                      {name} · {e.subjects?.name ?? "Subject"}
                    </p>
                    {pkg ? (
                      <p className="mt-1 text-[13px] tabular-nums text-g600">
                        {pkg.tally.done} of {pkg.size} done · {pkg.tally.booked} booked ·{" "}
                        {pkg.tally.toBook} still to book
                        {pkg.tally.cancelled > 0 && (
                          <span className="text-coral">
                            {" "}
                            · {pkg.tally.cancelled} cancelled — needs replacing
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-[13px] text-g600">No open package.</p>
                    )}
                    {pkg?.returned && (
                      <p className="mt-1 text-[13px] font-semibold text-coral">
                        Returned by the office: {pkg.reviewNote}
                      </p>
                    )}
                    {loose > 0 && (
                      <p className="mt-1 text-[12px] text-g400">
                        {loose} upcoming lesson{loose === 1 ? "" : "s"} not on a package
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {pkg && (
                      <StatusBadge tone={runwayTone[pkg.runway]}>{runwayLabel(pkg.runway)}</StatusBadge>
                    )}
                    <Link
                      href={pkg ? `/teacher/packages/${pkg.id}` : `/teacher/packages/new?enrollment=${e.id}`}
                      className="inline-flex items-center rounded-pill border border-navy/20 bg-white px-4 py-2 font-heading text-[13px] font-semibold text-navy hover:bg-paper"
                    >
                      {pkg ? "Open" : "Start package"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HistoryList title="Waiting for the office" empty="Nothing waiting." packages={waiting} />
      <HistoryList title="Accepted" empty="None yet." packages={accepted} />
    </Container>
  );
}

function HistoryList({
  title,
  empty,
  packages,
}: {
  title: string;
  empty: string;
  packages: PackageView[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-[18px] font-semibold text-navy">{title}</h2>
      {packages.length === 0 ? (
        <p className="text-[14px] text-g600">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
          {packages.map((p) => (
            <li key={p.id}>
              <Link
                href={`/teacher/packages/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[14px] hover:bg-paper"
              >
                <span className="font-semibold text-navy">
                  {p.studentName} · {p.subjectName}
                </span>
                <span className="tabular-nums text-g600">
                  {p.tally.done} of {p.size} · confirmed{" "}
                  {p.completedAt ? formatDate(p.completedAt) : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
