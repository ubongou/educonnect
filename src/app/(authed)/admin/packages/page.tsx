import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableScroll } from "@/components/ui/TableScroll";
import { PackageReviewActions } from "@/components/admin/PackageReviewActions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { formatDate } from "@/lib/format";
import {
  lessonStatusLabel,
  lessonStatusTone,
  lessonWhen,
  loadPackages,
  type PackageView,
} from "@/lib/packages/load";
import {
  ALMOST_OUT_THRESHOLD,
  compareByUrgency,
  enrollmentsWithoutPackage,
  reviewFlags,
  runwayLabel,
} from "@/lib/packages/progress";

const runwayTone = { running: "blue", almost_out: "amber", out: "coral" } as const;

type LooseSession = {
  id: string;
  enrollment_id: string;
  session_date: string;
  students: { id: string; full_name: string; preferred_name: string | null; is_test: boolean } | null;
  subjects: { name: string } | null;
  teacher: { full_name: string | null } | null;
};

/**
 * The office's view of teacher packages: what teachers have confirmed (to
 * accept or send back), which open packages are almost out, and which
 * children are having lessons nobody has put on a package.
 *
 * On-screen only for "almost out" — the parent renewal emails tied to payment
 * plans already cover that by email, and this page doesn't duplicate them.
 */
export default async function AdminPackagesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [live, accepted, upcomingResult, packagedResult] = await Promise.all([
    loadPackages(supabase, { statuses: ["open", "complete"] }),
    loadPackages(supabase, { statuses: ["accepted"], limit: 30 }),
    fetchAllRows<LooseSession>((from, to) =>
      supabase
        .from("sessions")
        .select(
          `
          id, enrollment_id, session_date,
          students ( id, full_name, preferred_name, is_test ),
          subjects ( name ),
          teacher:profiles!sessions_teacher_id_fkey ( full_name )
          `,
        )
        .eq("status", "scheduled")
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .order("id")
        .range(from, to) as unknown as PromiseLike<{
        data: LooseSession[] | null;
        error: { message: string } | null;
      }>,
    ),
    fetchAllRows<{ session_id: string }>((from, to) =>
      supabase.from("teacher_package_sessions").select("session_id").order("session_id").range(from, to),
    ),
  ]);

  const loadError =
    live.error ?? accepted.error ?? upcomingResult.error ?? packagedResult.error ?? null;

  const waiting = live.packages.filter((p) => p.status === "complete");
  const open = live.packages.filter((p) => p.status === "open").sort((a, b) => compareByUrgency(a.tally, b.tally));
  const almostOut = open.filter((p) => p.runway === "almost_out").length;
  const out = open.filter((p) => p.runway === "out").length;

  // Children having upcoming lessons with no open package to count them.
  const packaged = new Set(packagedResult.rows.map((r) => r.session_id));
  const loose = upcomingResult.rows.filter((s) => !packaged.has(s.id) && !s.students?.is_test);
  const missing = enrollmentsWithoutPackage({
    openPackageEnrollmentIds: open.map((p) => p.enrollmentId),
    upcomingUnpackagedSessions: loose,
  });
  const noPackage = [...missing].map((enrollmentId) => {
    const lessons = loose.filter((s) => s.enrollment_id === enrollmentId);
    return { enrollmentId, first: lessons[0], count: lessons.length };
  });

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Teacher packages
        </h1>
        <p className="mt-2 max-w-[680px] text-[14px] text-g600">
          Teachers set up each child&apos;s block of lessons and confirm it when it&apos;s done.
          &ldquo;Almost out&rdquo; means {ALMOST_OUT_THRESHOLD} or fewer lessons left. Teachers never
          see rates or plans — billing still happens on{" "}
          <Link href="/admin/payments" className="font-semibold text-navy underline-offset-4 hover:underline">
            Payments
          </Link>
          .
        </p>
      </div>

      {loadError && (
        <p role="alert" className="mb-6 rounded-2xl border border-coral/40 bg-coral/10 p-4 text-[14px] text-navy">
          Couldn&apos;t load everything: {loadError}
        </p>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="Waiting for you" value={waiting.length} hint="Confirmed complete by the teacher" tone={waiting.length > 0 ? "coral" : undefined} />
        <Stat label="Out" value={out} hint="All lessons used, not yet confirmed" tone={out > 0 ? "coral" : undefined} />
        <Stat label="Almost out" value={almostOut} hint={`${ALMOST_OUT_THRESHOLD} or fewer lessons left`} />
        <Stat label="No package" value={noPackage.length} hint="Upcoming lessons nobody is counting" />
      </div>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-[20px] font-semibold text-navy">Waiting for you</h2>
        {waiting.length === 0 ? (
          <p className="text-[14px] text-g600">Nothing to review.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {waiting.map((p) => {
              const flags = reviewFlags(p.status, p.lessons);
              return (
                <li key={p.id} className="rounded-[24px] border border-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-heading text-[16px] font-semibold text-navy">
                        <Link href={`/admin/students/${p.studentId}`} className="underline-offset-4 hover:underline">
                          {p.studentName}
                        </Link>{" "}
                        · {p.subjectName}
                      </p>
                      <p className="mt-1 text-[13px] tabular-nums text-g600">
                        {p.teacherName} · {p.tally.done} of {p.size} lessons · confirmed{" "}
                        {p.completedAt ? formatDate(p.completedAt) : "—"}
                      </p>
                      {p.completionNote && (
                        <p className="mt-2 text-[14px] text-navy">&ldquo;{p.completionNote}&rdquo;</p>
                      )}
                      {flags.map((f) => (
                        <p key={f} className="mt-2 text-[13px] font-semibold text-coral">
                          {f}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <PackageReviewActions packageId={p.id} canAccept={flags.length === 0} />
                      <Link
                        href={`/admin/payments?student=${p.studentId}`}
                        className="text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                      >
                        Open {p.studentName}&apos;s payments →
                      </Link>
                    </div>
                  </div>
                  <LessonList package={p} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-[20px] font-semibold text-navy">Open packages</h2>
        {open.length === 0 ? (
          <p className="text-[14px] text-g600">No open packages.</p>
        ) : (
          <TableScroll minWidth={820}>
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">Child</th>
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Next lesson</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {open.map((p) => {
                  const next = p.lessons.find((l) => l.status === "scheduled" && l.session_date >= today);
                  return (
                    <tr key={p.id} className="border-t border-line align-top">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/students/${p.studentId}`}
                          className="font-heading font-semibold text-navy underline-offset-4 hover:underline"
                        >
                          {p.studentName}
                        </Link>
                        <p className="text-[12px] text-g400">{p.subjectName}</p>
                        {p.returned && (
                          <p className="mt-1 text-[12px] text-coral">Returned: {p.reviewNote}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-g600">{p.teacherName}</td>
                      <td className="px-5 py-3 tabular-nums text-g600">
                        <span className="text-navy">
                          {p.tally.done} of {p.size}
                        </span>{" "}
                        done · {p.tally.booked} booked
                        <p className="mt-1 text-[12px] text-g400">
                          {p.tally.remaining} left · {p.tally.toBook} still to book
                          {p.tally.cancelled > 0 && ` · ${p.tally.cancelled} cancelled`}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-g600">{next ? formatDate(next.session_date) : "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <StatusBadge tone={runwayTone[p.runway]}>{runwayLabel(p.runway)}</StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-1 font-heading text-[20px] font-semibold text-navy">No package</h2>
        <p className="mb-4 text-[13px] text-g600">
          Upcoming lessons with no open package for that child and subject — the teacher hasn&apos;t
          started one.
        </p>
        {noPackage.length === 0 ? (
          <p className="text-[14px] text-g600">Every upcoming lesson is on a package.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
            {noPackage.map(({ enrollmentId, first, count }) => (
              <li key={enrollmentId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[14px]">
                <span>
                  <span className="font-semibold text-navy">
                    {first?.students?.preferred_name ?? first?.students?.full_name ?? "Student"}
                  </span>{" "}
                  <span className="text-g600">
                    · {first?.subjects?.name ?? "Subject"} · {first?.teacher?.full_name ?? "Teacher"}
                  </span>
                </span>
                <span className="tabular-nums text-g600">
                  {count} upcoming · next {first ? formatDate(first.session_date) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-heading text-[20px] font-semibold text-navy">Recently accepted</h2>
        {accepted.packages.length === 0 ? (
          <p className="text-[14px] text-g600">None yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white">
            {accepted.packages.map((p) => (
              <li key={p.id} className="px-5 py-3 text-[14px]">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 marker:content-none">
                    <span>
                      <span className="font-semibold text-navy">{p.studentName}</span>{" "}
                      <span className="text-g600">
                        · {p.subjectName} · {p.teacherName}
                      </span>
                    </span>
                    <span className="tabular-nums text-g600">
                      {p.tally.done} of {p.size} · accepted {p.reviewedAt ? formatDate(p.reviewedAt) : "—"}
                    </span>
                  </summary>
                  <LessonList package={p} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}

function LessonList({ package: p }: { package: PackageView }) {
  return (
    <ul className="mt-4 flex flex-col divide-y divide-line rounded-xl border border-line">
      {p.lessons.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
          <span className="text-navy">{lessonWhen(l)}</span>
          <StatusBadge tone={lessonStatusTone(l.status)}>{lessonStatusLabel(l.status)}</StatusBadge>
        </li>
      ))}
    </ul>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "coral";
}) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-5">
      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">{label}</p>
      <p
        className={`mt-2 font-heading text-[30px] font-semibold leading-none tabular-nums ${
          tone === "coral" ? "text-coral" : "text-navy"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] text-g600">{hint}</p>
    </div>
  );
}
