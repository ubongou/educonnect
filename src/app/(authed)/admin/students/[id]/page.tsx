import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { formatRegistrationNumber, formatDate } from "@/lib/format";
import type { IntakeJson } from "@/types/domain";
import { IntakeSummary } from "@/components/dashboard/IntakeSummary";
import { TeacherAssign, type TeacherOption } from "@/components/admin/TeacherAssign";
import { StudentManageBar } from "@/components/admin/StudentManageBar";
import { EnrollmentDeleteButton } from "@/components/admin/EnrollmentDeleteButton";
import {
  LinkParentToStudentForm,
  UnlinkButton,
  type LinkOption,
} from "@/components/admin/ParentStudentLinks";
import type { StudentFieldValues } from "@/components/admin/StudentFormFields";
import { ChildDashboardBody } from "@/components/dashboard/ChildDashboardBody";
import { TableScroll } from "@/components/ui/TableScroll";
import {
  SessionsTable,
  type AdminSessionRow,
} from "@/components/admin/SessionsTable";
import type { SessionTeacherOption } from "@/components/admin/SessionRowActions";

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
      className={`inline-flex items-center rounded-pill border px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${tone}`}
    >
      {status}
    </span>
  );
}

export default async function AdminStudentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const { id } = await params;
  const { subject: subjectRaw } = await searchParams;
  const supabase = await createClient();

  const [
    { data: student },
    { data: teacherList },
    { data: parentList },
    { data: sessionList },
  ] = await Promise.all([
      supabase
        .from("students")
        .select(
          `
        id, registration_number, full_name, preferred_name, age, gender,
        current_school, curriculum, curriculum_other, intake, intake_submitted_at,
        archived_at, is_test,
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
        // Hide soft-deleted reports from the embedded list (filter on the
        // embedded resource keeps the student row but drops deleted reports).
        .is("lesson_reports.deleted_at", null)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "teacher")
        .is("deactivated_at", null)
        .order("full_name"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "parent")
        .is("deactivated_at", null)
        .order("full_name"),
      // Every session for this child — no cap. The list is split into upcoming
      // and past below; one student's history is small enough to render whole,
      // and truncating it here is exactly the bug this page is meant to fix.
      supabase
        .from("sessions")
        .select(
          `
        id, session_date, duration_minutes, status, lesson_report_id, payment_plan_id,
        students ( id, full_name, preferred_name ),
        subjects ( name ),
        teacher:profiles!sessions_teacher_id_fkey ( id, full_name )
        `,
        )
        .eq("student_id", id)
        .order("session_date", { ascending: true }),
    ]);

  // Every plan this student has, any status — feeds the "charged to" picker on
  // each session row so a session stuck on an old, exhausted plan can be moved.
  const { data: studentPlanList } = await supabase
    .from("payment_plans")
    .select("id, reference_code, status")
    .eq("student_id", id)
    .order("created_at", { ascending: false });
  const studentPlanOptions = ((studentPlanList ?? []) as Array<{
    id: string;
    reference_code: string;
    status: string;
  }>).map((p) => ({ id: p.id, label: `${p.reference_code} · ${p.status}` }));
  const plansByStudent = { [id]: studentPlanOptions };

  if (!student) notFound();

  const teacherOptions = (teacherList ?? []) as TeacherOption[];

  const displayName = student.preferred_name ?? student.full_name;
  const parents = ((student.parent_students ?? []) as unknown as ParentLink[])
    .map((p) => p.profiles)
    .filter((p): p is NonNullable<ParentLink["profiles"]> => p !== null);

  // Offer only parents who aren't linked yet — re-linking is a no-op server
  // side, but showing them would imply otherwise.
  const linkedParentIds = new Set(parents.map((p) => p.id));
  const linkableParents: LinkOption[] = (
    (parentList ?? []) as { id: string; full_name: string | null; email: string | null }[]
  )
    .filter((p) => !linkedParentIds.has(p.id))
    .map((p) => ({
      id: p.id,
      label: p.full_name
        ? `${p.full_name}${p.email ? ` · ${p.email}` : ""}`
        : (p.email ?? "Unnamed parent"),
    }));

  const enrollments = ((student.enrollments ?? []) as unknown as EnrollmentRow[]).slice().sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );
  const reports = ((student.lesson_reports ?? []) as unknown as ReportRow[]).slice().sort(
    (a, b) => b.lesson_date.localeCompare(a.lesson_date),
  );
  const intake = (student.intake ?? null) as IntakeJson | null;

  const archived = student.archived_at != null;
  const isTest = student.is_test === true;

  // Sessions are date-only, so "upcoming" splits on today's calendar day —
  // a session dated today hasn't necessarily happened yet.
  const today = new Date().toISOString().slice(0, 10);
  const allSessions = (sessionList ?? []) as unknown as AdminSessionRow[];
  const upcomingSessions = allSessions.filter((s) => s.session_date >= today);
  // Newest first: the most recent lesson is the one being asked about.
  const pastSessions = allSessions
    .filter((s) => s.session_date < today)
    .slice()
    .reverse();
  const sessionCount = allSessions.length;
  const sessionTeacherOptions: SessionTeacherOption[] = (teacherList ?? []).map(
    (t) => ({ id: t.id, name: t.full_name ?? "Unnamed teacher" }),
  );
  const intakeFileCount = ((student.intake_files ?? []) as { id: string }[]).length;
  const deleteCascade = [
    `${enrollments.length} enrollment${enrollments.length === 1 ? "" : "s"}`,
    `${sessionCount} session${sessionCount === 1 ? "" : "s"}`,
    `${reports.length} lesson report${reports.length === 1 ? "" : "s"}`,
    `${intakeFileCount} intake file${intakeFileCount === 1 ? "" : "s"}`,
    `${parents.length} parent link${parents.length === 1 ? "" : "s"}`,
    "any uploaded documents",
  ];
  const editInitial: StudentFieldValues = {
    full_name: student.full_name ?? "",
    preferred_name: student.preferred_name ?? "",
    age: typeof student.age === "number" ? String(student.age) : "",
    gender: student.gender ?? "",
    current_school: student.current_school ?? "",
    curriculum: student.curriculum ?? "",
    curriculum_other: student.curriculum_other ?? "",
  };

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

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-pill border border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-semibold uppercase tracking-[0.1em] text-navy">
              {formatRegistrationNumber(student.registration_number)}
            </span>
            {archived && (
              <span className="inline-flex items-center rounded-pill border border-g400/40 bg-g100 px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g600">
                Archived
              </span>
            )}
            {isTest && (
              <span className="inline-flex items-center rounded-pill border border-blue/40 bg-blue/10 px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-blue">
                Test
              </span>
            )}
          </div>
          <h1 className="mt-3 font-heading text-[clamp(28px,3.4vw,40px)] font-semibold leading-tight text-navy">
            {displayName}
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {student.current_school ?? "School not set"}
            {student.curriculum && ` · ${student.curriculum} curriculum`}
            {typeof student.age === "number" && ` · age ${student.age}`}
          </p>
        </div>
        <StudentManageBar
          studentId={student.id}
          registrationNumber={student.registration_number}
          archived={archived}
          isTest={isTest}
          initial={editInitial}
          cascade={deleteCascade}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Linked parents
        </h2>
        {parents.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No parent accounts linked to this student.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {parents.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-semibold text-navy">
                    {p.full_name ?? "Unnamed parent"}
                  </p>
                  <p className="mt-1 text-[13px] text-g600">
                    {p.email ?? "no email"}
                    {p.phone && ` · ${p.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
                    >
                      Email
                    </a>
                  )}
                  <UnlinkButton
                    studentId={student.id}
                    parentId={p.id}
                    parentName={p.full_name ?? "This parent"}
                    studentName={displayName}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <LinkParentToStudentForm
            studentId={student.id}
            parents={linkableParents}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Enrollments
        </h2>
        {enrollments.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No enrollment requests.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-heading text-[15px] font-semibold text-navy">
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
                  <EnrollmentDeleteButton
                    enrollmentId={e.id}
                    subjectName={e.subjects?.name ?? "this"}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            Upcoming sessions
          </h2>
          <Link
            href={`/admin/sessions?student=${student.id}`}
            className="font-heading text-[13px] font-semibold text-blue underline-offset-4 hover:underline"
          >
            Schedule a session →
          </Link>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No upcoming sessions scheduled for {displayName}.
          </div>
        ) : (
          <SessionsTable
            rows={upcomingSessions}
            teachers={sessionTeacherOptions}
            showStudent={false}
            plansByStudent={plansByStudent}
          />
        )}

        {pastSessions.length > 0 && (
          <details className="group mt-4 overflow-hidden rounded-2xl border border-line bg-white">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 font-heading text-[13px] font-bold text-g600 marker:content-none hover:bg-paper">
              <span>Past sessions ({pastSessions.length})</span>
              <span
                aria-hidden="true"
                className="text-g400 transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <SessionsTable
                rows={pastSessions}
                teachers={sessionTeacherOptions}
                showStudent={false}
                plansByStudent={plansByStudent}
              />
            </div>
          </details>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Parent dashboard view
        </h2>
        <p className="mb-4 text-[13px] text-g600">
          Exactly what {displayName}&apos;s parent sees on their dashboard.
        </p>
        <ChildDashboardBody
          studentId={student.id}
          childDisplayName={displayName}
          childRegistrationNumber={student.registration_number}
          requestedSubject={subjectRaw}
          subjectHref={(slug) => `/admin/students/${student.id}?subject=${slug}`}
          variant="admin"
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Lesson reports
        </h2>
        {reports.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No lesson reports submitted yet.
          </div>
        ) : (
          <TableScroll minWidth={720}>
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
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
                  <tr key={r.id} className="border-t border-line hover:bg-paper">
                    <td className="px-5 py-3 font-heading font-bold text-navy">
                      {formatDate(r.lesson_date)}
                    </td>
                    <td className="px-5 py-3 text-navy">{r.subjects?.name ?? "—"}</td>
                    <td className="px-5 py-3 tabular-nums text-navy">
                      {r.understanding_check}/10
                    </td>
                    <td className="px-5 py-3 tabular-nums text-navy">
                      {r.confidence_level}/10
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
          </TableScroll>
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
