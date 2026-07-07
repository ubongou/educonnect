-- Report engagement: parent view-receipts + a two-way report thread.
--
-- Two features tied to a single lesson report:
--   1. View tracking — when the linked parent opens a report we stamp
--      first_viewed_at / last_viewed_at so admins and teachers can tell the
--      report has actually been read. (One parent per child, so plain columns
--      on lesson_reports are enough — no per-parent table.)
--   2. lesson_report_messages — a small thread on the report shared by the
--      linked parent, the assigned teacher, and admins.

-- -----------------------------------------------------------------------------
-- A. lesson_reports — view-receipt timestamps.
-- -----------------------------------------------------------------------------
alter table public.lesson_reports
  add column if not exists first_viewed_at timestamptz,
  add column if not exists last_viewed_at  timestamptz;

-- -----------------------------------------------------------------------------
-- B. mark_report_viewed — stamps the receipt. SECURITY DEFINER so we don't
--    have to grant parents UPDATE on lesson_reports; it only writes when the
--    caller is the linked parent, so an admin/teacher preview never counts as
--    "the parent viewed it". Idempotent: safe to call on every open.
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
  where id = p_report_id and deleted_at is null;

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

-- -----------------------------------------------------------------------------
-- C. lesson_report_messages — the two-way thread.
-- -----------------------------------------------------------------------------
create table public.lesson_report_messages (
  id                uuid primary key default gen_random_uuid(),
  lesson_report_id  uuid not null references public.lesson_reports (id) on delete cascade,
  author_id         uuid not null references public.profiles (id),
  body              text not null check (length(btrim(body)) > 0),
  created_at        timestamptz not null default now()
);

create index lesson_report_messages_report_idx
  on public.lesson_report_messages (lesson_report_id, created_at);

alter table public.lesson_report_messages enable row level security;

-- Read: admin, the linked parent, or the student's assigned teacher.
create policy lesson_report_messages_read
  on public.lesson_report_messages for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.lesson_reports lr
      join public.parent_students ps on ps.student_id = lr.student_id
      where lr.id = lesson_report_messages.lesson_report_id
        and ps.parent_id = auth.uid()
    )
    or exists (
      select 1
      from public.lesson_reports lr
      join public.enrollments e on e.student_id = lr.student_id
      where lr.id = lesson_report_messages.lesson_report_id
        and e.teacher_id = auth.uid()
        and e.status = 'approved'
    )
  );

-- Insert: same audience, and only ever as yourself.
create policy lesson_report_messages_insert
  on public.lesson_report_messages for insert
  with check (
    author_id = auth.uid()
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1
        from public.lesson_reports lr
        join public.parent_students ps on ps.student_id = lr.student_id
        where lr.id = lesson_report_messages.lesson_report_id
          and ps.parent_id = auth.uid()
      )
      or exists (
        select 1
        from public.lesson_reports lr
        join public.enrollments e on e.student_id = lr.student_id
        where lr.id = lesson_report_messages.lesson_report_id
          and e.teacher_id = auth.uid()
          and e.status = 'approved'
      )
    )
  );

-- Admins can moderate (delete) if needed; nobody edits messages in place.
create policy lesson_report_messages_admin_write
  on public.lesson_report_messages for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
