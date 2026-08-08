import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";
import {
  SubjectsManager,
  type SkillRow,
  type SubjectRow,
} from "@/components/admin/SubjectsManager";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: skills }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, slug, is_archived")
      .order("is_archived", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("subject_skills")
      .select("id, subject_id, name, description, sort_order, is_archived")
      .order("sort_order", { ascending: true }),
  ]);

  const rows = (subjects ?? []) as SubjectRow[];
  const skillRows = (skills ?? []) as SkillRow[];

  return (
    <Container>
      <div className="mb-8">
        <p className="font-heading text-[12px] font-bold uppercase tracking-[0.12em] text-blue">
          Admin
        </p>
        <h1 className="mt-1 font-heading text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.02em] text-navy">Subjects</h1>
        <p className="mt-2 text-[14px] text-g600">
          Parents can only request subjects listed here. Archived subjects stay on past reports
          and enrollments but hide from the request form. Expand a subject to manage the skills
          its lesson reports track.
        </p>
      </div>

      <SubjectsManager rows={rows} skillRows={skillRows} />
    </Container>
  );
}
