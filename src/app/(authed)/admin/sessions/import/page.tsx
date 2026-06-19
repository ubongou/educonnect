import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { ImportSessionsForm } from "@/components/admin/ImportSessionsForm";
import type { SchedulableEnrollment } from "@/components/admin/SessionScheduler";

export default async function AdminImportSessionsPage() {
  const supabase = await createClient();

  const { data: schedulable } = await supabase
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
    .order("created_at", { ascending: false });

  const schedulableRows: SchedulableEnrollment[] = (schedulable ?? []).map((e: unknown) => {
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
  });

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">
          Import past sessions
        </h1>
        <p className="mt-2 text-[14px] text-g600">
          Bulk-add lessons that already happened for one enrollment. Each row is recorded as a
          completed session with its full lesson report. Back to{" "}
          <Link
            href="/admin/schedule"
            className="font-semibold text-blue underline-offset-4 hover:underline"
          >
            Schedule
          </Link>
          .
        </p>
      </div>

      <ImportSessionsForm enrollments={schedulableRows} />
    </Container>
  );
}
