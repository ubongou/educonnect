-- EduConnect LMS — RLS + storage for teacher role, sessions, student_documents.
--
-- Adds teacher clauses to existing read policies and introduces policies for
-- the two new tables and the new storage bucket. Each teacher clause scopes
-- access to rows connected via enrollments.teacher_id (i.e., a teacher only
-- sees students + reports for the enrollments they own).

-- -----------------------------------------------------------------------------
-- enable RLS on new tables
-- -----------------------------------------------------------------------------
alter table public.sessions           enable row level security;
alter table public.student_documents  enable row level security;

-- -----------------------------------------------------------------------------
-- students — extend read to include "teacher of any enrollment for this student"
-- -----------------------------------------------------------------------------
drop policy if exists students_parent_read on public.students;
create policy students_parent_read
  on public.students for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = students.id and ps.parent_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollments e
      where e.student_id = students.id and e.teacher_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- intake_files — teacher can read intakes of their students
-- -----------------------------------------------------------------------------
drop policy if exists intake_files_read on public.intake_files;
create policy intake_files_read
  on public.intake_files for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollments e
      where e.student_id = intake_files.student_id and e.teacher_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- enrollments — teacher can read their own enrollments
-- -----------------------------------------------------------------------------
drop policy if exists enrollments_read on public.enrollments;
create policy enrollments_read
  on public.enrollments for select
  using (
    public.is_admin(auth.uid())
    or enrollments.teacher_id = auth.uid()
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = enrollments.student_id and ps.parent_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- lesson_reports — teacher can read / insert their own
-- -----------------------------------------------------------------------------
drop policy if exists lesson_reports_read on public.lesson_reports;
create policy lesson_reports_read
  on public.lesson_reports for select
  using (
    public.is_admin(auth.uid())
    or lesson_reports.uploaded_by = auth.uid()
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = lesson_reports.student_id and ps.parent_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollments e
      where e.student_id = lesson_reports.student_id
        and e.subject_id = lesson_reports.subject_id
        and e.teacher_id = auth.uid()
    )
  );

-- Teacher inserts via the create_lesson_report RPC (SECURITY DEFINER), so no
-- direct insert policy for teachers here — the RPC enforces the check.

-- -----------------------------------------------------------------------------
-- lesson_report_skill_ratings — teacher of the underlying report can read
-- -----------------------------------------------------------------------------
drop policy if exists lesson_report_skill_ratings_read on public.lesson_report_skill_ratings;
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
    or exists (
      select 1
        from public.lesson_reports lr
        join public.enrollments e on e.student_id = lr.student_id
                                 and e.subject_id = lr.subject_id
       where lr.id = lesson_report_skill_ratings.lesson_report_id
         and e.teacher_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- sessions
--   • read:  admin, teacher (self), parent (of the student)
--   • write: admin only (create_lesson_report RPC does status updates for
--            teachers via SECURITY DEFINER)
-- -----------------------------------------------------------------------------
create policy sessions_read
  on public.sessions for select
  using (
    public.is_admin(auth.uid())
    or sessions.teacher_id = auth.uid()
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = sessions.student_id and ps.parent_id = auth.uid()
    )
  );

create policy sessions_admin_write
  on public.sessions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- student_documents
--   • read:    admin, linked parent, teacher of any enrollment for this student
--   • insert:  linked parent (uploading on behalf of their child)
--   • delete:  linked parent who uploaded it, or admin
-- -----------------------------------------------------------------------------
create policy student_documents_read
  on public.student_documents for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = student_documents.student_id and ps.parent_id = auth.uid()
    )
    or exists (
      select 1 from public.enrollments e
      where e.student_id = student_documents.student_id and e.teacher_id = auth.uid()
    )
  );

create policy student_documents_insert_parent
  on public.student_documents for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.parent_students ps
      where ps.student_id = student_documents.student_id and ps.parent_id = auth.uid()
    )
  );

create policy student_documents_delete_parent
  on public.student_documents for delete
  using (
    public.is_admin(auth.uid())
    or (
      uploaded_by = auth.uid()
      and exists (
        select 1 from public.parent_students ps
        where ps.student_id = student_documents.student_id and ps.parent_id = auth.uid()
      )
    )
  );

create policy student_documents_admin_write
  on public.student_documents for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Storage bucket for student-documents — same path convention as intake-files:
--   {student_id}/{kind}-{uuid}.{ext}
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('student-documents', 'student-documents', false)
on conflict (id) do nothing;

create policy "student_documents_storage_read"
  on storage.objects for select
  using (
    bucket_id = 'student-documents'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
      or exists (
        select 1 from public.enrollments e
        where e.teacher_id = auth.uid()
          and e.student_id::text = split_part(name, '/', 1)
      )
    )
  );

create policy "student_documents_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'student-documents'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );

create policy "student_documents_storage_update"
  on storage.objects for update
  using (
    bucket_id = 'student-documents'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );

create policy "student_documents_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'student-documents'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );
