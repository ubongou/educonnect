import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  formatRegistrationNumber,
  formatDate,
  formatSkillRating,
} from "@/lib/format";
import type { IntakeJson } from "@/types/domain";
import { IntakeSummary } from "@/components/dashboard/IntakeSummary";
import { TeacherAssign, type TeacherOption } from "@/components/admin/TeacherAssign";

type EnrollmentRow = {
  id: string;
  status: string;
  decided_at: string | null;
  created_at: string;
  teacher_id: string | null;
  subjects: { name: string; slug: string } | null;
  teacher: { id: string; full_name: string | null } | null;
};

type ReportRow = {
  id: string;
  lesson_date: string;
  understanding_check: number;
  confidence_level: number;
  subjects: { name: string; slug: string } | null;
};

type ParentLink = {
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

const statusTone: Record<string, string> = {
  pending: "border-coral/40 bg-coral/10 text-coral",
  approved: "border-blue/40 bg-blue/10 text-blue",
  rejected: "border-g400/40 bg-g100 text-g600",
};

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? statusTone.pending;
  return (
    <span
      className={`inline-flex items-center rounded-pill border-[1.5px] px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${tone}`}
    >
      {status}
    </span>
  );
}

export default async function AdminStudentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: teacherList }] = await Promise.all([
    supabase
      .from("students")
      .select(
        `
        id, registration_number, full_name, preferred_name, age, gender,
        current_school, curriculum, curriculum_other, intake, intake_submitted_at,
        parent_students ( profiles ( id, full_name, email, phone ) ),
        enrollments (
          id, status, decided_at, created_at, teacher_id,
          subjects(name, slug),
          teacher:profiles!enrollments_teacher_id_fkey(id, full_name)
        ),
        lesson_reports (id, lesson_date, understanding_check, confidence_level, subjects(name, slug)),
        intake_files (id, kind, original_filename, size_bytes, uploaded_at)
        `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "teacher")
      .is("deactivated_at", null)
      .order("full_name"),
  ]);

  if (!student) notFound();

  const teacherOptions = (teacherList ?? []) as TeacherOption[];

  const displayName = student.preferred_name ?? student.full_name;
  const parents = ((student.parent_students ?? []) as unknown as ParentLink[])
    .map((p) => p.profiles)
    .filter((p): p is NonNullable<ParentLink["profiles"]> => p !== null);

  const enrollments = ((student.enrollments ?? []) as unknown as EnrollmentRow[]).slice().sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );
  const reports = ((student.lesson_reports ?? []) as unknown as ReportRow[]).slice().sort(
    (a, b) => b.lesson_date.localeCompare(a.lesson_date),
  );
  const intake = (student.intake ?? null) as IntakeJson | null;

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/admin/students" className="hover:text-navy">
          Students
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">{displayName}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-g100 pb-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border-[1.5px] border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-navy">
            {formatRegistrationNumber(student.registration_number)}
          </span>
          <h1 className="mt-3 font-heading text-[clamp(28px,3.4vw,40px)] font-extrabold leading-tight text-navy">
            {displayName}
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {student.current_school ?? "School not set"}
            {student.curriculum && ` · ${student.curriculum} curriculum`}
            {typeof student.age === "number" && ` · age ${student.age}`}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Linked parents
        </h2>
        {parents.length === 0 ? (
          <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-6 text-[14px] text-g600">
            No parent accounts linked to this student.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {parents.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-[1.5px] border-navy/10 bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-extrabold text-navy">
                    {p.full_name ?? "Unnamed parent"}
                  </p>
                  <p className="mt-1 text-[13px] text-g600">
                    {p.email ?? "no email"}
                    {p.phone && ` · ${p.phone}`}
                  </p>
                </div>
                {p.email && (
                  <a
                    href={`mailto:${p.email}`}
                    className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                  >
                    Email
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Enrollments
        </h2>
        {enrollments.length === 0 ? (
          <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-6 text-[14px] text-g600">
            No enrollment requests.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-[1.5px] border-navy/10 bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-extrabold text-navy">
                    {e.subjects?.name ?? "Subject"}
                  </p>
                  <p className="mt-1 text-[12px] text-g400">
                    Requested {formatDate(e.created_at)}
                    {e.decided_at && ` · decided ${formatDate(e.decided_at)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  {e.status !== "rejected" && (
                    <TeacherAssign
                      enrollmentId={e.id}
                      currentTeacherId={e.teacher_id}
                      teachers={teacherOptions}
                    />
                  )}
                  <StatusPill status={e.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Lesson reports
        </h2>
        {reports.length === 0 ? (
          <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-6 text-[14px] text-g600">
            No lesson reports submitted yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border-[1.5px] border-navy/10 bg-white">
            <table className="w-full text-[14px]">
              <thead className="bg-g50 text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Understanding</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3 text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-g100 hover:bg-g50">
                    <td className="px-5 py-3 font-heading font-bold text-navy">
                      {formatDate(r.lesson_date)}
                    </td>
                    <td className="px-5 py-3 text-navy">{r.subjects?.name ?? "—"}</td>
                    <td className="px-5 py-3 tabular-nums text-navy">
                      {formatSkillRating(r.understanding_check)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-navy">
                      {formatSkillRating(r.confidence_level)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Intake
        </h2>
        <IntakeSummary
          child={{
            full_name: student.full_name,
            preferred_name: student.preferred_name,
            age: student.age,
            gender: student.gender,
            current_school: student.current_school,
            curriculum: student.curriculum,
            curriculum_other: student.curriculum_other,
            intake_submitted_at: student.intake_submitted_at,
          }}
          intake={intake}
          files={student.intake_files ?? []}
        />
      </section>
    </Container>
  );
}
