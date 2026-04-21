import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ChildCard, type ChildCardStudent } from "@/components/dashboard/ChildCard";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select(
      "id, registration_number, full_name, preferred_name, current_school, enrollments(status, subject_id), lesson_reports(id, lesson_date)",
    )
    .order("created_at", { ascending: false });

  const rows = (students ?? []) as unknown as ChildCardStudent[];

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
            Parent dashboard
          </p>
          <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">My children</h1>
        </div>
        <Button href="/dashboard/children/new">Add another child</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-dashed border-g100 bg-white p-12 text-center">
          <p className="text-[15px] text-g600">
            No children linked to your account yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((s) => (
            <ChildCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </Container>
  );
}
