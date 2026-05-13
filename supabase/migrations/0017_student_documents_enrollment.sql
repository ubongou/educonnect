-- 0017 — Per-teacher document routing.
--
-- Parents now choose which approved enrollment a document is for, so each
-- doc carries an enrollment_id (the enrollment row carries teacher_id, so
-- the teacher RLS clause narrows naturally).
--
-- The column is nullable: pre-existing rows from before this migration
-- keep NULL and remain visible to every teacher of the student during the
-- transition. The app layer (Zod) forbids new inserts without an
-- enrollment_id; admins may still write NULL via the service-role path
-- if ever needed.

alter table public.student_documents
  add column if not exists enrollment_id uuid
    references public.enrollments (id) on delete set null;

create index if not exists student_documents_enrollment_idx
  on public.student_documents (enrollment_id);

-- Recreate the read policy so teachers only see rows scoped to their own
-- enrollment, with a transitional fallback for legacy NULL rows.
drop policy if exists student_documents_read on public.student_documents;
create policy student_documents_read
  on public.student_documents for select
  using (
    public.is_admin(auth.uid())
    or uploaded_by = auth.uid()
    or (
      status = 'ready'
      and (
        exists (
          select 1 from public.parent_students ps
          where ps.student_id = student_documents.student_id
            and ps.parent_id = auth.uid()
        )
        or (
          -- Teacher view: scope by enrollment when set, fall back to
          -- "any teacher of the student" for legacy NULL rows.
          enrollment_id is not null
          and exists (
            select 1 from public.enrollments e
            where e.id = student_documents.enrollment_id
              and e.teacher_id = auth.uid()
              and e.status = 'approved'
          )
        )
        or (
          enrollment_id is null
          and exists (
            select 1 from public.enrollments e
            where e.student_id = student_documents.student_id
              and e.teacher_id = auth.uid()
              and e.status = 'approved'
          )
        )
      )
    )
  );
