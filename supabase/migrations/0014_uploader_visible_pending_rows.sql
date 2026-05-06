-- Two RLS gaps surfaced once the R2 upload flow ran end-to-end on prod:
--
-- 1. The read policies on student_documents + teacher_materials installed in
--    0012 hide rows where status = 'pending' from non-admins. The action
--    pattern is .insert({status:'pending'}).select('id').single() — and the
--    RETURNING SELECT is RLS-evaluated, so the just-inserted row is
--    invisible to its uploader. PostgREST surfaces this as the misleading
--    "new row violates row-level security policy" error. Fix: let the
--    uploader (uploaded_by = auth.uid()) always see their own row, in any
--    status.
--
-- 2. There was no parent UPDATE policy on student_documents at all. The
--    confirmStudentDocumentUpload action flips pending → ready via
--    .update().select().single(); RLS silently filters that update to zero
--    rows and PostgREST surfaces "Cannot coerce the result to a single
--    JSON object". teacher_materials already had a proper update policy
--    from 0012, so only student_documents needs one.

-- -----------------------------------------------------------------------------
-- A. student_documents — recreate read policy with uploader-visible clause.
-- -----------------------------------------------------------------------------
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
        or exists (
          select 1 from public.enrollments e
          where e.student_id = student_documents.student_id
            and e.teacher_id = auth.uid()
        )
      )
    )
  );

-- -----------------------------------------------------------------------------
-- B. student_documents — add parent UPDATE policy (was missing entirely).
-- -----------------------------------------------------------------------------
drop policy if exists student_documents_update_parent on public.student_documents;
create policy student_documents_update_parent
  on public.student_documents for update
  using (
    public.is_admin(auth.uid())
    or (
      uploaded_by = auth.uid()
      and exists (
        select 1 from public.parent_students ps
        where ps.student_id = student_documents.student_id
          and ps.parent_id = auth.uid()
      )
    )
  )
  with check (
    public.is_admin(auth.uid())
    or (
      uploaded_by = auth.uid()
      and exists (
        select 1 from public.parent_students ps
        where ps.student_id = student_documents.student_id
          and ps.parent_id = auth.uid()
      )
    )
  );

-- -----------------------------------------------------------------------------
-- C. teacher_materials — recreate read policy with uploader-visible clause.
-- -----------------------------------------------------------------------------
drop policy if exists teacher_materials_read on public.teacher_materials;
create policy teacher_materials_read
  on public.teacher_materials for select
  using (
    public.is_admin(auth.uid())
    or uploaded_by = auth.uid()
    or (
      status = 'ready'
      and (
        exists (
          select 1 from public.parent_students ps
          where ps.student_id = teacher_materials.student_id
            and ps.parent_id = auth.uid()
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
