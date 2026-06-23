-- Lesson-report attachments + the homework round-trip.
--
-- Teachers attach workbooks/resources to a lesson report (they ride the
-- report's single email). Parents complete the homework and submit it back
-- against the same report; the teacher then sees it and can mark it reviewed.

-- -----------------------------------------------------------------------------
-- A. teacher_materials — add a 'staged' status + link to a lesson report.
--    'staged' rows are composer attachments not yet sent: the existing read
--    policy already hides non-'ready' rows from parents (and the uploader can
--    always see their own via the uploaded_by clause from 0014), so no policy
--    change is needed — only the CHECK constraint has to admit the new value.
-- -----------------------------------------------------------------------------
alter table public.teacher_materials
  drop constraint if exists teacher_materials_status_check;
alter table public.teacher_materials
  add constraint teacher_materials_status_check
    check (status in ('pending', 'ready', 'staged'));

alter table public.teacher_materials
  add column if not exists lesson_report_id uuid
    references public.lesson_reports (id) on delete set null;

create index if not exists teacher_materials_report_idx
  on public.teacher_materials (lesson_report_id);

-- -----------------------------------------------------------------------------
-- B. student_documents — allow homework submissions linked back to a report.
-- -----------------------------------------------------------------------------
alter table public.student_documents
  drop constraint if exists student_documents_kind_check;
alter table public.student_documents
  add constraint student_documents_kind_check
    check (kind in
      ('test_paper', 'school_report', 'exam_result', 'homework_submission', 'other'));

alter table public.student_documents
  add column if not exists lesson_report_id uuid
    references public.lesson_reports (id) on delete set null;
alter table public.student_documents
  add column if not exists reviewed_at timestamptz;

create index if not exists student_documents_report_idx
  on public.student_documents (lesson_report_id);

-- -----------------------------------------------------------------------------
-- C. mark_homework_reviewed — lets the assigned teacher (or an admin) stamp a
--    parent's homework submission as reviewed. SECURITY DEFINER so we don't
--    have to widen the student_documents UPDATE policy (which is scoped to the
--    uploading parent) to teachers for a single column.
-- -----------------------------------------------------------------------------
create or replace function public.mark_homework_reviewed(
  p_document_id uuid,
  p_reviewed    boolean default true
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student uuid;
begin
  select student_id into v_student
  from public.student_documents
  where id = p_document_id;

  if v_student is null then
    raise exception 'document not found' using errcode = 'P0002';
  end if;

  if not public.is_admin(auth.uid())
     and not exists (
       select 1 from public.enrollments e
       where e.student_id = v_student
         and e.teacher_id = auth.uid()
         and e.status = 'approved'
     )
  then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  update public.student_documents
  set reviewed_at = case when p_reviewed then now() else null end
  where id = p_document_id;
end;
$$;

grant execute on function public.mark_homework_reviewed(uuid, boolean) to authenticated;
