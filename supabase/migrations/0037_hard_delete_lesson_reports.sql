-- masani LMS — hard delete for lesson reports (replaces the 0022 soft-delete).
--
-- A report sent by mistake has to leave no trace. The parent must not see a
-- "withdrawn" marker where the report used to be, and the teacher has to be
-- able to file the correct report against the same session. Soft-delete gave
-- us neither: the row stayed readable behind hand-written `deleted_at is null`
-- filters (the parent documents page had already forgotten one), and the
-- session kept its `lesson_report_id`, so the composer never reopened and the
-- teacher's "View report" link 404'd.
--
-- Three parts:
--   A. sessions.lesson_report_id was declared with no ON DELETE action, so a
--      real delete failed with an FK violation. Make it SET NULL.
--   B. delete_lesson_report() — admin-only. Reopens the session, removes the
--      report's own files (teacher attachments would otherwise be SET NULL and
--      resurface in the parent's "shared by your tutor" list), deletes the
--      report, and returns the storage keys so the caller can purge R2.
--   C. Purge the reports already soft-deleted and drop `deleted_at`. Dropping
--      it without the purge would resurrect those rows for parents. Their R2
--      objects can't be reached from SQL and are left orphaned — harmless, and
--      the only leftover from the old scheme.

-- -----------------------------------------------------------------------------
-- A. sessions.lesson_report_id → ON DELETE SET NULL
-- -----------------------------------------------------------------------------
alter table public.sessions
  drop constraint if exists sessions_lesson_report_id_fkey;
alter table public.sessions
  add constraint sessions_lesson_report_id_fkey
    foreign key (lesson_report_id) references public.lesson_reports (id)
    on delete set null;

-- -----------------------------------------------------------------------------
-- B. delete_lesson_report — the one way a report is removed.
--
-- SECURITY DEFINER because it has to reach past the caller's RLS into
-- `sessions`, `teacher_materials` and `student_documents` in one transaction:
-- a half-done delete (report gone, session still 'completed') is exactly the
-- dead end this migration exists to remove.
--
-- Returns the R2 storage keys of every file it removed. The row is the source
-- of truth, so it goes first; the caller deletes the objects best-effort
-- afterwards (an orphaned object is recoverable, an orphaned row is not).
-- -----------------------------------------------------------------------------
create or replace function public.delete_lesson_report(p_report_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_keys text[] := '{}';
  v_more text[];
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  if not exists (select 1 from public.lesson_reports where id = p_report_id) then
    raise exception 'report not found' using errcode = 'P0002';
  end if;

  -- Reopen the session so the teacher's composer offers it again. Attendance
  -- states the teacher set deliberately ('cancelled', 'no_show') are their
  -- call, not a side effect of filing a report, so they stay.
  update public.sessions
     set status = case when status = 'completed' then 'scheduled' else status end,
         lesson_report_id = null
   where lesson_report_id = p_report_id;

  -- Teacher attachments (homework/resources) ride the report and die with it.
  with dropped as (
    delete from public.teacher_materials
     where lesson_report_id = p_report_id
    returning storage_key
  )
  select coalesce(array_agg(storage_key) filter (where storage_key is not null), '{}'::text[])
    into v_more
    from dropped;
  v_keys := v_keys || v_more;

  -- The parent's completed-homework submission only exists in the context of
  -- this report; left behind it would show up as a loose document.
  with dropped as (
    delete from public.student_documents
     where lesson_report_id = p_report_id
    returning storage_key
  )
  select coalesce(array_agg(storage_key) filter (where storage_key is not null), '{}'::text[])
    into v_more
    from dropped;
  v_keys := v_keys || v_more;

  -- Skill ratings and the message thread cascade (0001, 0027).
  delete from public.lesson_reports where id = p_report_id;

  return v_keys;
end;
$$;

revoke all on function public.delete_lesson_report(uuid) from public;
grant execute on function public.delete_lesson_report(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- C. Purge the already-soft-deleted reports, then drop the column.
--
-- Guarded on the column still existing so the migration is safe to re-run.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'lesson_reports'
       and column_name  = 'deleted_at'
  ) then
    update public.sessions s
       set status = case when s.status = 'completed' then 'scheduled' else s.status end,
           lesson_report_id = null
      from public.lesson_reports lr
     where lr.id = s.lesson_report_id
       and lr.deleted_at is not null;

    delete from public.teacher_materials tm
     using public.lesson_reports lr
     where lr.id = tm.lesson_report_id
       and lr.deleted_at is not null;

    delete from public.student_documents sd
     using public.lesson_reports lr
     where lr.id = sd.lesson_report_id
       and lr.deleted_at is not null;

    delete from public.lesson_reports where deleted_at is not null;

    -- Drops lesson_reports_active_student_idx with it (partial on deleted_at).
    alter table public.lesson_reports drop column deleted_at;
  end if;
end $$;

-- The hot read path is still "reports for a student, newest first"; without the
-- soft-delete flag it no longer needs to be partial.
create index if not exists lesson_reports_student_date_idx
  on public.lesson_reports (student_id, lesson_date desc);

-- -----------------------------------------------------------------------------
-- D. mark_report_viewed — 0027's body reads `deleted_at`. Postgres doesn't
--    track plpgsql body dependencies, so the DROP COLUMN above leaves it
--    compiling fine and failing at call time. Recreate it without the check:
--    a deleted report has no row to stamp.
-- -----------------------------------------------------------------------------
create or replace function public.mark_report_viewed(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student uuid;
begin
  select student_id into v_student
  from public.lesson_reports
  where id = p_report_id;

  if v_student is null then
    return;
  end if;

  -- Only a parent linked to the student counts as a genuine view.
  if not exists (
    select 1 from public.parent_students ps
    where ps.student_id = v_student and ps.parent_id = auth.uid()
  ) then
    return;
  end if;

  update public.lesson_reports
  set first_viewed_at = coalesce(first_viewed_at, now()),
      last_viewed_at  = now()
  where id = p_report_id;
end;
$$;

grant execute on function public.mark_report_viewed(uuid) to authenticated;
