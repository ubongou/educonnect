import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PackageManager } from "@/components/teacher/PackageForms";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  lessonStatusLabel,
  lessonStatusTone,
  lessonWhen,
  loadAddableLessons,
  loadPackages,
} from "@/lib/packages/load";
import { canConfirm, confirmNeedsNote, isDone, runwayLabel } from "@/lib/packages/progress";

const statusCopy = {
  open: "Open",
  complete: "Waiting for the office",
  accepted: "Accepted",
} as const;

export default async function TeacherPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireTeacher();
  const { id } = await params;
  const supabase = await createClient();

  const { packages } = await loadPackages(supabase, { teacherId: profile.id, ids: [id] });
  const pkg = packages[0];
  if (!pkg) notFound();

  const addable =
    pkg.status === "open" ? await loadAddableLessons(supabase, profile.id, pkg.enrollmentId) : [];
  const toOption = (l: (typeof pkg.lessons)[number]) => ({
    id: l.id,
    when: lessonWhen(l),
    statusLabel: lessonStatusLabel(l.status),
    happened: isDone(l.status),
  });

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/teacher/packages" className="hover:text-navy">
          Packages
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">
          {pkg.studentName} · {pkg.subjectName}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-navy">
            {pkg.studentName} · {pkg.subjectName}
          </h1>
          <p className="mt-1 text-[13px] text-g600">
            Started {formatDate(pkg.createdAt)}
            {pkg.note ? ` · ${pkg.note}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge tone={pkg.status === "accepted" ? "green" : "blue"}>
            {statusCopy[pkg.status]}
          </StatusBadge>
          {pkg.status === "open" && (
            <StatusBadge tone={pkg.runway === "running" ? "blue" : pkg.runway === "out" ? "coral" : "amber"}>
              {runwayLabel(pkg.runway)}
            </StatusBadge>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Done" value={`${pkg.tally.done} of ${pkg.size}`} />
        <Stat label="Booked" value={pkg.tally.booked} />
        <Stat label="Still to book" value={pkg.tally.toBook} />
        <Stat label="Left to teach" value={pkg.tally.remaining} />
      </div>

      {pkg.returned && (
        <p className="mb-6 rounded-2xl border border-coral/40 bg-coral/10 p-4 text-[14px] text-navy">
          <span className="font-semibold">Returned by the office:</span> {pkg.reviewNote}
        </p>
      )}
      {pkg.status === "open" && pkg.tally.cancelled > 0 && (
        <p className="mb-6 rounded-2xl border border-yellow/60 bg-yellow/20 p-4 text-[14px] text-navy">
          {pkg.tally.cancelled} lesson{pkg.tally.cancelled === 1 ? " was" : "s were"} cancelled.
          Remove {pkg.tally.cancelled === 1 ? "it" : "them"} and add a replacement when one is booked.
        </p>
      )}

      {pkg.status === "open" ? (
        <div className="max-w-[760px]">
          <PackageManager
            packageId={pkg.id}
            size={pkg.size}
            note={pkg.note}
            lessons={pkg.lessons.map(toOption)}
            addable={addable.map(toOption)}
            needsNoteToConfirm={confirmNeedsNote(pkg.tally)}
            canConfirm={canConfirm(pkg.tally)}
            canCancel={pkg.tally.done === 0}
            doneCount={pkg.tally.done}
          />
        </div>
      ) : (
        <div className="max-w-[760px]">
          {pkg.completionNote && (
            <p className="mb-4 text-[14px] text-g600">Your note: {pkg.completionNote}</p>
          )}
          {pkg.status === "accepted" && pkg.reviewNote && (
            <p className="mb-4 text-[14px] text-g600">Office note: {pkg.reviewNote}</p>
          )}
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white">
            {pkg.lessons.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
                <span className="flex-1 text-navy">{lessonWhen(l)}</span>
                <StatusBadge tone={lessonStatusTone(l.status)}>{lessonStatusLabel(l.status)}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">{label}</p>
      <p className="mt-1 font-heading text-[24px] font-semibold tabular-nums text-navy">{value}</p>
    </div>
  );
}
