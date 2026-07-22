import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import { StudentsTable, type StudentRow } from "@/components/admin/StudentsTable";

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select(
      "id, registration_number, full_name, preferred_name, age, current_school, curriculum, intake_submitted_at, archived_at, is_test",
    )
    // Active first, then archived; newest within each group.
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as StudentRow[];

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Admin
          </p>
          <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">Students</h1>
          <p className="mt-2 text-[14px] text-g600">
            Every student on the platform. Search by name, reg number, or school.
          </p>
        </div>
        <Link
          href="/admin/students/new"
          className="inline-flex items-center gap-2 rounded-pill border-2 border-navy bg-coral px-5 py-[10px] font-heading text-[13px] font-bold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)]"
        >
          + New student
        </Link>
      </div>

      <StudentsTable rows={rows} />
    </Container>
  );
}
