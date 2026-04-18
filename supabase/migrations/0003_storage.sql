-- EduConnect LMS — storage: private "intake-files" bucket with RLS
--
-- Path convention: {student_id}/{kind}-{uuid}.{ext}
-- The first path segment is the student UUID; policies check membership via
-- public.parent_students.

insert into storage.buckets (id, name, public)
values ('intake-files', 'intake-files', false)
on conflict (id) do nothing;

-- read: linked parent or admin
create policy "intake_files_read"
  on storage.objects
  for select
  using (
    bucket_id = 'intake-files'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );

-- insert: linked parent uploading into their own student's folder
create policy "intake_files_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'intake-files'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );

-- update (e.g., re-upload over same key): linked parent or admin
create policy "intake_files_update"
  on storage.objects
  for update
  using (
    bucket_id = 'intake-files'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );

-- delete: linked parent or admin
create policy "intake_files_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'intake-files'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.parent_students ps
        where ps.parent_id = auth.uid()
          and ps.student_id::text = split_part(name, '/', 1)
      )
    )
  );
