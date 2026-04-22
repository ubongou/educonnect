import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  SubjectsManager,
  type SubjectRow,
} from "@/components/admin/SubjectsManager";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, name, slug, is_archived")
    .order("is_archived", { ascending: true })
    .order("name", { ascending: true });

  const rows = (data ?? []) as SubjectRow[];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[32px] font-extrabold text-navy">Subjects</h1>
        <p className="mt-2 text-[14px] text-g600">
          Parents can only request subjects listed here. Archived subjects stay on past reports
          and enrollments but hide from the request form.
        </p>
        <p className="mt-3 rounded-md border-[1.5px] border-blue/30 bg-blue/10 px-4 py-3 text-[13px] text-navy">
          Skill trackers are seeded only for Mathematics, English, and Science. New subjects will
          render lesson reports without the skill-tracker block until skills are added.
        </p>
      </div>

      <SubjectsManager rows={rows} />
    </Container>
  );
}
