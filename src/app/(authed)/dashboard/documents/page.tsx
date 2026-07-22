import { Container } from "@/components/ui/Container";
import { ChildTabs, type ChildTabOption } from "@/components/dashboard/ChildTabs";
import {
  DocumentUpload,
  type UploadedDocument,
} from "@/components/dashboard/DocumentUpload";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { getParentChildren, pickChild, childTabColor } from "@/lib/dashboard/children";
import { isViewableMime } from "@/lib/uploads/viewable";

type TutorMaterialRow = {
  id: string;
  kind: string;
  original_filename: string;
  size_bytes: number | null;
  uploaded_at: string;
  mime_type: string | null;
};

const tutorMaterialKindLabels: Record<string, string> = {
  lesson_material: "Lesson material",
  homework: "Homework",
  demo_video: "Demo video",
  photo: "Photo",
  other: "Other",
};

function humanSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DashboardDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const { child: childIdRaw } = await searchParams;
  const { children } = await getParentChildren("/dashboard/documents");
  const selected = pickChild(children, childIdRaw);

  if (!selected) {
    return (
      <Container>
        <p className="text-[14px] text-g600">Add a child first to upload documents.</p>
      </Container>
    );
  }

  const supabase = await createClient();
  const [
    { data },
    { data: materialsData },
    { data: enrollmentRows },
    { data: homeworkData },
    { data: submissionsData },
  ] = await Promise.all([
    supabase
      .from("student_documents")
      .select(
        "id, kind, original_filename, size_bytes, uploaded_at, mime_type, enrollment_id, enrollments ( subjects ( name ) )",
      )
      .eq("student_id", selected.id)
      // Completed-homework submissions live on the lesson report, not in the
      // flat document archive.
      .neq("kind", "homework_submission")
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("teacher_materials")
      .select("id, kind, original_filename, size_bytes, uploaded_at, mime_type")
      .eq("student_id", selected.id)
      // Report attachments show under their report; this list is standalone
      // tutor materials only.
      .is("lesson_report_id", null)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select(
        "id, subjects ( name ), teacher:profiles!enrollments_teacher_id_fkey ( full_name )",
      )
      .eq("student_id", selected.id)
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
    // Homework workbooks attached to lesson reports, with their report context.
    supabase
      .from("teacher_materials")
      .select(
        "id, original_filename, mime_type, link_url, lesson_report_id, lesson_reports ( lesson_date, subjects ( name ) )",
      )
      .eq("student_id", selected.id)
      .eq("kind", "homework")
      .eq("status", "ready")
      .not("lesson_report_id", "is", null)
      .order("uploaded_at", { ascending: false }),
    // Completed-homework the parent has submitted back, to derive status.
    supabase
      .from("student_documents")
      .select("lesson_report_id, reviewed_at")
      .eq("student_id", selected.id)
      .eq("kind", "homework_submission")
      .eq("status", "ready"),
  ]);

  type EnrollmentRow = {
    id: string;
    subjects: { name: string } | null;
    teacher: { full_name: string | null } | null;
  };

  const enrollmentOptions = ((enrollmentRows ?? []) as unknown as EnrollmentRow[])
    .map((e) => ({
      id: e.id,
      subjectName: e.subjects?.name ?? "Subject",
      teacherName: e.teacher?.full_name ?? null,
    }));

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

  const documents: UploadedDocument[] = ((data ?? []) as unknown as DocRow[]).map(
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
  const tutorMaterials = (materialsData ?? []) as TutorMaterialRow[];

  // Homework hub: each report-attached homework workbook + its submission state.
  type HomeworkRow = {
    id: string;
    original_filename: string;
    mime_type: string | null;
    link_url: string | null;
    lesson_report_id: string | null;
    lesson_reports: {
      lesson_date: string;
      subjects: { name: string } | null;
    } | null;
  };
  type SubmissionRow = {
    lesson_report_id: string | null;
    reviewed_at: string | null;
  };

  const homeworkRows = (homeworkData ?? []) as unknown as HomeworkRow[];
  const statusByReport = new Map<
    string,
    { submitted: boolean; reviewed: boolean }
  >();
  for (const s of (submissionsData ?? []) as SubmissionRow[]) {
    if (!s.lesson_report_id) continue;
    const cur = statusByReport.get(s.lesson_report_id) ?? {
      submitted: false,
      reviewed: false,
    };
    cur.submitted = true;
    if (s.reviewed_at) cur.reviewed = true;
    statusByReport.set(s.lesson_report_id, cur);
  }

  const homeworkItems = homeworkRows.map((h) => {
    const st = h.lesson_report_id
      ? statusByReport.get(h.lesson_report_id)
      : undefined;
    const status: "todo" | "submitted" | "reviewed" = st?.reviewed
      ? "reviewed"
      : st?.submitted
        ? "submitted"
        : "todo";
    return {
      id: h.id,
      original_filename: h.original_filename,
      mime_type: h.mime_type,
      link_url: h.link_url,
      reportId: h.lesson_report_id,
      lessonDate: h.lesson_reports?.lesson_date ?? null,
      subjectName: h.lesson_reports?.subjects?.name ?? null,
      status,
    };
  });

  const childOptions: ChildTabOption[] = children.map((c, i) => ({
    id: c.id,
    label: c.preferred_name ?? c.full_name,
    dotColor: childTabColor(i),
  }));

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Parent dashboard
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Documents
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Share test papers, school reports, and exam results with your child&apos;s
          teacher.
        </p>
      </div>

      <ChildTabs
        basePath="/dashboard/documents"
        tabs={childOptions}
        activeId={selected.id}
      />

      <DocumentUpload
        studentId={selected.id}
        documents={documents}
        enrollments={enrollmentOptions}
      />

      {homeworkItems.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
            Homework
          </h2>
          <ul className="flex flex-col gap-2">
            {homeworkItems.map((h) => {
              const tone =
                h.status === "reviewed"
                  ? "green"
                  : h.status === "submitted"
                    ? "blue"
                    : "amber";
              const label =
                h.status === "reviewed"
                  ? "Reviewed"
                  : h.status === "submitted"
                    ? "Submitted"
                    : "To do";
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge tone={tone}>{label}</StatusBadge>
                    <div>
                      <p className="font-heading text-[14px] font-semibold text-navy">
                        {h.original_filename}
                      </p>
                      <p className="mt-1 text-[12px] text-g400">
                        {h.lessonDate ? formatDate(h.lessonDate) : "Lesson"}
                        {h.subjectName ? ` · ${h.subjectName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {h.link_url ? (
                      <a
                        href={h.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                      >
                        Open link
                      </a>
                    ) : (
                      <>
                        {isViewableMime(h.mime_type) && (
                          <a
                            href={`/api/teacher-materials/${h.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                          >
                            View
                          </a>
                        )}
                        <a
                          href={`/api/teacher-materials/${h.id}/download?disposition=attachment`}
                          className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                        >
                          Download
                        </a>
                      </>
                    )}
                    {h.reportId && (
                      <a
                        href={`/dashboard/sessions?child=${selected.id}&report=${h.reportId}`}
                        className="font-heading text-[13px] font-bold text-navy underline-offset-4 hover:underline"
                      >
                        {h.status === "todo" ? "Submit work" : "Open report"}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Materials shared by your tutor
        </h2>
        {tutorMaterials.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-line bg-white p-6 text-[14px] text-g600">
            Your tutor hasn&apos;t shared any materials for this child yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {tutorMaterials.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-line bg-white px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge tone="gray">
                    {tutorMaterialKindLabels[m.kind] ?? m.kind}
                  </StatusBadge>
                  <div>
                    <p className="font-heading text-[14px] font-semibold text-navy">
                      {m.original_filename}
                    </p>
                    <p className="mt-1 text-[12px] text-g400">
                      Uploaded {formatDate(m.uploaded_at)} ·{" "}
                      {humanSize(m.size_bytes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isViewableMime(m.mime_type) && (
                    <a
                      href={`/api/teacher-materials/${m.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-[13px] font-bold text-blue underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  )}
                  <a
                    href={`/api/teacher-materials/${m.id}/download?disposition=attachment`}
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
    </Container>
  );
}
