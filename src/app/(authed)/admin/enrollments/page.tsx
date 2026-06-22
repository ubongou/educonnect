import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import {
  type PendingEnrollmentRow,
  type TeacherOption,
} from "@/components/admin/DecisionButtons";
import {
  BulkApproveEnrollments,
  type PendingRow,
} from "@/components/admin/BulkApproveEnrollments";
import {
  AddEnrollmentForm,
  type StudentOption,
  type SubjectOption,
} from "@/components/admin/AddEnrollmentForm";

type StudentRow = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  parent_students: { profiles: { full_name: string | null } | null }[] | null;
};

export default async function AdminEnrollmentsQueue() {
  const supabase = await createClient();

  const [{ data }, { data: teachers }, { data: studentsRaw }, { data: subjects }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select(
          `
        id, status, created_at,
        students ( id, full_name, preferred_name, registration_number ),
        subjects ( id, name, slug ),
        requester:profiles!enrollments_requested_by_fkey ( id, full_name, email )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "teacher")
        .is("deactivated_at", null)
        .order("full_name"),
      supabase
        .from("students")
        .select(
          "id, full_name, preferred_name, parent_students ( profiles ( full_name ) )",
        )
        .order("full_name"),
      supabase.from("subjects").select("id, name").order("name"),
    ]);

  const rows = (data ?? []) as unknown as PendingEnrollmentRow[];
  const teacherOptions = (teachers ?? []) as TeacherOption[];

  const pendingRows: PendingRow[] = rows.map((r) => ({
    id: r.id,
    studentId: r.students?.id ?? null,
    studentName: r.students?.preferred_name ?? r.students?.full_name ?? "Unknown",
    subjectName: r.subjects?.name ?? "—",
    parentName: r.requester?.full_name ?? "Unknown",
    parentEmail: r.requester?.email ?? null,
    requestedLabel: formatDate(r.created_at),
  }));

  const studentOptions: StudentOption[] = ((studentsRaw ?? []) as unknown as StudentRow[]).map(
    (s) => {
      const name = s.preferred_name ?? s.full_name;
      const parent = s.parent_students?.[0]?.profiles?.full_name;
      return { id: s.id, label: parent ? `${name} · parent: ${parent}` : name };
    },
  );
  const subjectOptions = (subjects ?? []) as SubjectOption[];

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Admin
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
            Enrollments queue
          </h1>
          <p className="mt-2 text-[14px] text-g600">
            {rows.length === 0
              ? "No pending enrollment requests."
              : `${rows.length} pending ${rows.length === 1 ? "request" : "requests"} awaiting review.`}
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
          Create an enrollment for a parent
        </h2>
        <AddEnrollmentForm
          students={studentOptions}
          subjects={subjectOptions}
          teachers={teacherOptions}
        />
      </section>

      <h2 className="mb-4 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-g400">
        Pending requests
      </h2>

      {rows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-line bg-white p-12 text-center">
          <p className="text-[14px] text-g600">You&apos;re all caught up.</p>
        </div>
      ) : (
        <BulkApproveEnrollments rows={pendingRows} teachers={teacherOptions} />
      )}
    </Container>
  );
}
