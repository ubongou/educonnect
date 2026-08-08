-- Let admins archive individual skills inside a subject, the same way
-- subjects themselves can already be archived. Archiving (not hard delete)
-- is required because lesson_report_skill_ratings.skill_id references
-- subject_skills(id) with no `on delete` clause -- a hard delete would be
-- blocked by the FK the moment a skill has ever been rated.

alter table public.subject_skills
  add column if not exists is_archived boolean not null default false;

drop policy if exists subject_skills_read on public.subject_skills;
create policy subject_skills_read
  on public.subject_skills for select
  using (not is_archived or public.is_admin(auth.uid()));
