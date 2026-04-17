-- EduConnect LMS — Row Level Security policies
-- Covers: profiles, students, parent_students, intake_files, subjects,
-- subject_skills, enrollments, lesson_reports, lesson_report_skill_ratings.
--
-- Conventions:
--  • "admin" = public.is_admin(auth.uid()) (see 0001_init.sql).
--  • Parents can only see rows connected to their own children via parent_students.
--  • Student INSERT is performed via the SECURITY DEFINER RPC create_student_with_intake
--    (0004), so there is no direct INSERT policy for parents on students.
--  • Admins have full access via separate ALL policies.

-- enable RLS
alter table public.profiles                     enable row level security;
alter table public.students                     enable row level security;
alter table public.parent_students              enable row level security;
alter table public.intake_files                 enable row level security;
alter table public.subjects                     enable row level security;
alter table public.subject_skills               enable row level security;
alter table public.enrollments                  enable row level security;
alter table public.lesson_reports               enable row level security;
alter table public.lesson_report_skill_ratings  enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy profiles_self_read
  on public.profiles for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy profiles_self_update
  on public.profiles for update
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy profiles_admin_write
  on public.profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
create policy students_parent_read
  on public.students for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = students.id and ps.parent_id = auth.uid()
    )
  );

create policy students_admin_write
  on public.students for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
-- NB: parent inserts go through the create_student_with_intake RPC (SECURITY DEFINER).

-- -----------------------------------------------------------------------------
-- parent_students
-- -----------------------------------------------------------------------------
create policy parent_students_read
  on public.parent_students for select
  using (parent_id = auth.uid() or public.is_admin(auth.uid()));

create policy parent_students_insert_self
  on public.parent_students for insert
  with check (parent_id = auth.uid() or public.is_admin(auth.uid()));

create policy parent_students_admin_write
  on public.parent_students for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- intake_files
-- -----------------------------------------------------------------------------
create policy intake_files_read
  on public.intake_files for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid()
    )
  );

create policy intake_files_insert_parent
  on public.intake_files for insert
  with check (
    exists (
      select 1 from public.parent_students ps
      where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid()
    )
  );

create policy intake_files_delete_parent
  on public.intake_files for delete
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid()
    )
  );

create policy intake_files_admin_write
  on public.intake_files for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- subjects (everyone reads non-archived; admin writes)
-- -----------------------------------------------------------------------------
create policy subjects_read
  on public.subjects for select
  using (not is_archived or public.is_admin(auth.uid()));

create policy subjects_admin_write
  on public.subjects for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- subject_skills (everyone reads; admin writes)
-- -----------------------------------------------------------------------------
create policy subject_skills_read
  on public.subject_skills for select
  using (true);

create policy subject_skills_admin_write
  on public.subject_skills for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- enrollments
-- -----------------------------------------------------------------------------
create policy enrollments_read
  on public.enrollments for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = enrollments.student_id and ps.parent_id = auth.uid()
    )
  );

create policy enrollments_parent_insert
  on public.enrollments for insert
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.parent_students ps
      where ps.student_id = enrollments.student_id and ps.parent_id = auth.uid()
    )
  );

create policy enrollments_admin_write
  on public.enrollments for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- lesson_reports
-- -----------------------------------------------------------------------------
create policy lesson_reports_read
  on public.lesson_reports for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = lesson_reports.student_id and ps.parent_id = auth.uid()
    )
  );

create policy lesson_reports_admin_write
  on public.lesson_reports for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- lesson_report_skill_ratings
-- -----------------------------------------------------------------------------
create policy lesson_report_skill_ratings_read
  on public.lesson_report_skill_ratings for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.lesson_reports lr
      join public.parent_students ps on ps.student_id = lr.student_id
      where lr.id = lesson_report_skill_ratings.lesson_report_id
        and ps.parent_id = auth.uid()
    )
  );

create policy lesson_report_skill_ratings_admin_write
  on public.lesson_report_skill_ratings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
