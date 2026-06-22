import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatDate,
  formatRegistrationNumber,
} from "@/lib/format";
import type { IntakeJson } from "@/types/domain";
import { IntakeSummary } from "@/components/dashboard/IntakeSummary";
import { confidenceBadge, understandingBadge } from "@/lib/scales";
import {
  MaterialsUpload,
  type TeacherMaterial,
} from "@/components/teacher/MaterialsUpload";
import { isViewableMime } from "@/lib/uploads/viewable";
import {
  ChildDashboardBody,
  isSubjectSlug,
  type SubjectSlug,
} from "@/components/dashboard/ChildDashboardBody";

type ReportRow = {
  id: string;
  lesson_date: string;
  understanding_check: number;
  confidence_level: number;
  subjects: { name: string } | null;
};

type DocumentRow = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
  subjectName: string | null;
};

type DocRow = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
  enrollment_id: string | null;
  enrollments: { subjects: { name: string } | null } | null;
};

function humanSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const kindLabels: Record<string, string> = {
  test_paper: "Test paper",
  school_report: "School report",
  exam_result: "Exam result",
  other: "Other",
};

type TeacherEnrollment = {
  id: string;
  status: string;
  subjects: { name: string; slug: string } | null;
};

export default async function TeacherStudentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const profile = await requireTeacher();
  const { id } = await params;
  const { subject: subjectRaw } = await searchParams;

  const supabase = await createClient();

  // Verify this teacher is actually assigned to this student via at least
  // one enrollment. RLS would block most reads, but an explicit check
  // gives a nicer 404 than an empty student fetch. We also use these to scope
  // the embedded progress dashboard to the subjects this teacher teaches.
  const { data: enrollmentData } = await supabase
    .from("enrollments")
    .select("id, status, subjects ( name, slug )")
    .eq("student_id", id)
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: true });
  const teacherEnrollments = (enrollmentData ?? []) as unknown as TeacherEnrollment[];
  if (teacherEnrollments.length === 0) notFound();

  // Distinct, valid-slug subjects from approved enrollments — one dashboard
  // per enrolment, switchable when the teacher teaches several subjects.
  const dashboardSubjects: { slug: SubjectSlug; name: string }[] = [];
  const seenSlugs = new Set<string>();
  for (const e of teacherEnrollments) {
    if (e.status !== "approved") continue;
    const slug = e.subjects?.slug;
    const name = e.subjects?.name;
    if (slug && name && isSubjectSlug(slug) && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      dashboardSubjects.push({ slug, name });
    }
  }
  const selectedSubject: SubjectSlug | null =
    dashboardSubjects.find((d) => d.slug === subjectRaw)?.slug ??
    dashboardSubjects[0]?.slug ??
    null;

  const { data: student } = await supabase
    .from("students")
    .select(
      `
      id, registration_number, full_name, preferred_name, age, gender,
      current_school, curriculum, curriculum_other, intake, intake_submitted_at,
      intake_files ( id, kind, original_filename, size_bytes, uploaded_at )
      `,
    )
    .eq("id", id)
    .maybeSingle();
  if (!student) notFound();

  const [{ data: reports }, { data: documents }, { data: materials }] =
    await Promise.all([
      supabase
        .from("lesson_reports")
        .select(
          `
        id, lesson_date, understanding_check, confidence_level,
        subjects ( name )
        `,
        )
        .eq("student_id", id)
        .order("lesson_date", { ascending: false })
        .limit(20),
      supabase
        .from("student_documents")
        .select(
          "id, kind, original_filename, size_bytes, uploaded_at, mime_type, enrollment_id, enrollments ( subjects ( name ) )",
        )
        .eq("student_id", id)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("teacher_materials")
        .select("id, kind, original_filename, size_bytes, uploaded_at, mime_type")
        .eq("student_id", id)
        .eq("status", "ready")
        .order("uploaded_at", { ascending: false }),
    ]);

  const reportRows = (reports ?? []) as unknown as ReportRow[];
  const docs: DocumentRow[] = ((documents ?? []) as unknown as DocRow[]).map(
    (d) => ({
      id: d.id,
      kind: d.kind,
      original_filename: d.original_filename,
      size_bytes: d.size_bytes,
      uploaded_at: d.uploaded_at,
      mime_type: d.mime_type,
      subjectName: d.enrollments?.subjects?.name ?? null,
    }),
  );
  const teacherMaterials = (materials ?? []) as TeacherMaterial[];
  const intake = (student.intake ?? null) as IntakeJson | null;
  const displayName = student.preferred_name ?? student.full_name;

  return (
    <Container>
      <div className="mb-4 text-[13px] text-g600">
        <Link href="/teacher/students" className="hover:text-navy">
          My students
        </Link>
        <span aria-hidden="true" className="mx-2">
          ›
        </span>
        <span className="font-semibold text-navy">{displayName}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border border-navy bg-yellow px-3 py-1 font-heading text-[11px] font-semibold uppercase tracking-[0.1em] text-navy">
            {formatRegistrationNumber(student.registration_number)}
          </span>
          <h1 className="mt-3 font-heading text-[clamp(28px,3.4vw,40px)] font-semibold leading-tight text-navy">
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
          Materials I&apos;ve shared with {displayName}
        </h2>
        <MaterialsUpload studentId={id} materials={teacherMaterials} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Documents shared by the parent
        </h2>
        {docs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No documents uploaded yet. Parents can share test papers or reports from
            their dashboard.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge tone="gray">
                    {kindLabels[d.kind] ?? d.kind}
                  </StatusBadge>
                  {d.subjectName && (
                    <StatusBadge tone="blue">{d.subjectName}</StatusBadge>
                  )}
                  <div>
                    <p className="font-heading text-[14px] font-semibold text-navy">
                      {d.original_filename}
                    </p>
                    <p className="mt-1 text-[12px] text-g400">
                      Uploaded {formatDate(d.uploaded_at)} · {humanSize(d.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isViewableMime(d.mime_type) && (
                    <a
                      href={`/api/student-documents/${d.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                  <a
                    href={`/api/student-documents/${d.id}/download?disposition=attachment`}
                    className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedSubject && (
        <section className="mt-10">
          <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            Progress dashboard
          </h2>
          {dashboardSubjects.length > 1 && (
            <nav
              aria-label="Select enrolment"
              className="mb-6 flex flex-wrap items-center gap-2"
            >
              {dashboardSubjects.map((d) => {
                const active = d.slug === selectedSubject;
                return (
                  <Link
                    key={d.slug}
                    href={`/teacher/students/${id}?subject=${d.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center rounded-pill border px-4 py-[7px] font-heading text-[13px] font-semibold transition-colors ${
                      active
                        ? "border-navy bg-navy text-yellow"
                        : "border-navy/20 bg-white text-navy hover:bg-paper"
                    }`}
                  >
                    {d.name}
                  </Link>
                );
              })}
            </nav>
          )}
          <ChildDashboardBody
            studentId={id}
            childDisplayName={displayName}
            childRegistrationNumber={student.registration_number}
            selectedSubject={selectedSubject}
            subjectSlug={selectedSubject}
            subjectHref={(slug) => `/teacher/students/${id}?subject=${slug}`}
            variant="teacher"
          />
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Past lesson reports
        </h2>
        {reportRows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            No reports for this student yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-[14px]">
              <thead className="bg-paper text-left font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-g400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Understanding</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((r) => {
                  const u = understandingBadge(r.understanding_check);
                  const c = confidenceBadge(r.confidence_level);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-line transition-colors hover:bg-paper"
                    >
                      <td className="px-5 py-3 font-heading font-bold text-navy">
                        <Link
                          href={`/teacher/reports/${r.id}`}
                          className="block underline-offset-4 hover:underline"
                        >
                          {formatDate(r.lesson_date)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-navy">
                        {r.subjects?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={c.tone}>{c.label}</StatusBadge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/teacher/reports/${r.id}`}
                          className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
