-- EduConnect LMS — file storage moves from Supabase Storage to Cloudflare R2.
--
-- Summary:
--   • Renames intake_files.storage_path  → storage_key  (now an R2 object
--     key, not a Supabase Storage path; rename for accuracy).
--   • Renames student_documents.storage_path → storage_key for the same
--     reason.
--   • Adds a status column ('pending' | 'ready') to both tables. Rows are
--     inserted as 'pending' immediately before the client uploads to R2 via
--     a presigned URL, then flipped to 'ready' on upload completion. Read
--     RLS hides 'pending' rows from non-admins so half-uploaded blobs never
--     appear in the UI.
--   • Drops the now-unused storage.objects RLS policies for the
--     'intake-files' and 'student-documents' buckets — the binary lives in
--     R2 from now on and Supabase Storage no longer mediates access. Table
--     RLS on intake_files and student_documents stays in active use.
--   • Introduces public.teacher_materials — teacher-uploaded files scoped to
--     a single student (parallel to student_documents but with the
--     read/write polarity inverted: teacher writes, parent reads).

-- -----------------------------------------------------------------------------
-- A. intake_files: rename storage_path → storage_key + add status + tighten read
-- -----------------------------------------------------------------------------
alter table public.intake_files rename column storage_path to storage_key;

alter table public.intake_files
  add column status text not null default 'ready'
    check (status in ('pending', 'ready'));

-- Existing rows pre-date R2; treat them as 'ready'. New rows from R2-aware
-- code will explicitly insert 'pending' and flip to 'ready' post-upload.
-- (No data backfill needed — the default already covers existing rows.)

-- Re-create read policy with status='ready' filter on non-admin branches.
-- Mirrors the policy installed in 0007_teacher_rls.sql.
drop policy if exists intake_files_read on public.intake_files;
create policy intake_files_read
  on public.intake_files for select
  using (
    public.is_admin(auth.uid())
    or (
      status = 'ready'
      and (
        exists (
          select 1 from public.parent_students ps
          where ps.student_id = intake_files.student_id and ps.parent_id = auth.uid()
        )
        or exists (
          select 1 from public.enrollments e
          where e.student_id = intake_files.student_id and e.teacher_id = auth.uid()
        )
      )
    )
  );

-- -----------------------------------------------------------------------------
-- B. student_documents: same shape as A
-- -----------------------------------------------------------------------------
alter table public.student_documents rename column storage_path to storage_key;

alter table public.student_documents
  add column status text not null default 'ready'
    check (status in ('pending', 'ready'));

drop policy if exists student_documents_read on public.student_documents;
create policy student_documents_read
  on public.student_documents for select
  using (
    public.is_admin(auth.uid())
    or (
      status = 'ready'
      and (
        exists (
          select 1 from public.parent_students ps
          where ps.student_id = student_documents.student_id and ps.parent_id = auth.uid()
        )
        or exists (
          select 1 from public.enrollments e
          where e.student_id = student_documents.student_id and e.teacher_id = auth.uid()
        )
      )
    )
  );

-- -----------------------------------------------------------------------------
-- C. Drop now-unused storage.objects RLS for the two buckets.
--    The binary lives in R2 from now on; Supabase Storage policies are dead
--    weight. Bucket rows themselves are left intact — no harm in keeping
--    them and dropping them would require a separate cleanup of any
--    lingering objects. Names match 0003_storage.sql + 0007_teacher_rls.sql
--    exactly (case + quoting).
-- -----------------------------------------------------------------------------
drop policy if exists "intake_files_read"   on storage.objects;
drop policy if exists "intake_files_insert" on storage.objects;
drop policy if exists "intake_files_update" on storage.objects;
drop policy if exists "intake_files_delete" on storage.objects;

drop policy if exists "student_documents_storage_read"   on storage.objects;
drop policy if exists "student_documents_storage_insert" on storage.objects;
drop policy if exists "student_documents_storage_update" on storage.objects;
drop policy if exists "student_documents_storage_delete" on storage.objects;

-- -----------------------------------------------------------------------------
-- D. teacher_materials table — teacher-uploaded files scoped to a student.
--    Parallel to student_documents but with the write polarity inverted:
--    teachers write, parents (+ admin + the assigned teacher) read.
-- -----------------------------------------------------------------------------
create table public.teacher_materials (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students (id) on delete cascade,
  uploaded_by         uuid not null references public.profiles (id),
  kind                text not null
                        check (kind in
                          ('lesson_material', 'homework', 'demo_video', 'photo', 'other')),
  original_filename   text not null,
  storage_key         text not null,
  mime_type           text,
  size_bytes          bigint,
  status              text not null default 'pending'
                        check (status in ('pending', 'ready')),
  uploaded_at         timestamptz not null default now()
);

create index teacher_materials_student_idx
  on public.teacher_materials (student_id, uploaded_at desc);

alter table public.teacher_materials enable row level security;

-- -----------------------------------------------------------------------------
-- E. teacher_materials RLS
--    • read:    admin, linked parent, assigned teacher (approved enrollment).
--               Hides 'pending' rows from non-admins.
--    • insert:  admin, or teacher uploading for a student where they have an
--               approved enrollment (uploaded_by must equal auth.uid() — no
--               impersonation).
--    • update:  admin, or the original uploader (e.g., flip status pending→ready).
--    • delete:  admin, or the original uploader.
-- -----------------------------------------------------------------------------
create policy teacher_materials_read
  on public.teacher_materials for select
  using (
    public.is_admin(auth.uid())
    or (
      status = 'ready'
      and (
        exists (
          select 1 from public.parent_students ps
          where ps.student_id = teacher_materials.student_id and ps.parent_id = auth.uid()
        )
        or exists (
          select 1 from public.enrollments e
          where e.student_id = teacher_materials.student_id
            and e.teacher_id = auth.uid()
            and e.status = 'approved'
        )
      )
    )
  );

create policy teacher_materials_insert
  on public.teacher_materials for insert
  with check (
    public.is_admin(auth.uid())
    or (
      uploaded_by = auth.uid()
      and exists (
        select 1 from public.enrollments e
        where e.student_id = teacher_materials.student_id
          and e.teacher_id = auth.uid()
          and e.status = 'approved'
      )
    )
  );

create policy teacher_materials_update
  on public.teacher_materials for update
  using (
    public.is_admin(auth.uid())
    or uploaded_by = auth.uid()
  )
  with check (
    public.is_admin(auth.uid())
    or uploaded_by = auth.uid()
  );

create policy teacher_materials_delete
  on public.teacher_materials for delete
  using (
    public.is_admin(auth.uid())
    or uploaded_by = auth.uid()
  );
