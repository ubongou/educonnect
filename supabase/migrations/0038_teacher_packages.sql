-- masani LMS — teacher packages
--
-- A teacher's own record of a child's block of lessons, kept apart from the
-- admin's payment plans. The teacher opens a package ahead of time ("8
-- sessions of Maths for Edan"), puts scheduled lessons towards it, and
-- confirms it complete when the block is done. The office sees every package,
-- which ones are almost out, and which children are having lessons with no
-- package at all — the shorthand for "when do we bill this family next".
--
-- Deliberately money-free: no rates, totals or plan links live here, and
-- teachers get no read access to payment_plans, so nothing on the teacher side
-- can reveal what a family is charged.
--
-- Lifecycle:
--   open      → teacher is filling it; lessons can be added/removed
--   complete  → teacher confirmed; waiting for the office
--   accepted  → office has it; frozen
-- A "return" from the office sends a complete package back to open with a
-- reason, so the teacher fixes the same package rather than starting over.
--
-- Teachers only ever write through the SECURITY DEFINER functions below, which
-- check ownership on every call. There are no direct write policies.
--
-- Idempotent throughout — migrations auto-apply to production on push.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.teacher_packages (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.profiles (id),
  student_id       uuid not null references public.students (id) on delete cascade,
  -- The child + subject the package is for. Packages are per enrollment so a
  -- child with two subjects (or two teachers) has independent counts.
  enrollment_id    uuid not null references public.enrollments (id) on delete cascade,
  size             integer not null check (size between 1 and 200),
  note             text check (char_length(note) <= 2000),

  status           text not null default 'open'
                     check (status in ('open', 'complete', 'accepted')),

  completed_at     timestamptz,
  completion_note  text check (char_length(completion_note) <= 2000),

  -- Last office decision. On a return this is the reason the teacher sees.
  review_note      text check (char_length(review_note) <= 2000),
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,

  created_at       timestamptz not null default now()
);

create index if not exists teacher_packages_teacher_idx
  on public.teacher_packages (teacher_id, created_at desc);
create index if not exists teacher_packages_student_idx
  on public.teacher_packages (student_id);
create index if not exists teacher_packages_status_idx
  on public.teacher_packages (status);

-- One open package per child + subject at a time, so "how many are left" has a
-- single answer.
create unique index if not exists teacher_packages_one_open_idx
  on public.teacher_packages (enrollment_id)
  where status = 'open';

create table if not exists public.teacher_package_sessions (
  package_id  uuid not null references public.teacher_packages (id) on delete cascade,
  session_id  uuid not null references public.sessions (id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (package_id, session_id)
);

-- A lesson counts towards at most one package, ever. This is what makes a
-- lesson impossible to put on two packages, even under concurrent requests.
create unique index if not exists teacher_package_sessions_session_idx
  on public.teacher_package_sessions (session_id);

-- -----------------------------------------------------------------------------
-- RLS — read-only for teachers (own rows), full read for admins, nothing for
-- parents. All writes go through the functions below.
-- -----------------------------------------------------------------------------
alter table public.teacher_packages         enable row level security;
alter table public.teacher_package_sessions enable row level security;

drop policy if exists teacher_packages_read on public.teacher_packages;
create policy teacher_packages_read
  on public.teacher_packages for select
  using (
    public.is_admin(auth.uid())
    or teacher_packages.teacher_id = auth.uid()
  );

drop policy if exists teacher_package_sessions_read on public.teacher_package_sessions;
create policy teacher_package_sessions_read
  on public.teacher_package_sessions for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.teacher_packages p
       where p.id = teacher_package_sessions.package_id
         and p.teacher_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Helpers (internal — not granted to clients)
-- -----------------------------------------------------------------------------

-- Locks and returns an open package the caller owns, or raises.
create or replace function public._own_open_package(p_package_id uuid)
returns public.teacher_packages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg public.teacher_packages;
begin
  select * into v_pkg
    from public.teacher_packages
   where id = p_package_id
   for update;

  if v_pkg.id is null or v_pkg.teacher_id is distinct from auth.uid() then
    raise exception 'Package not found.' using errcode = 'P0002';
  end if;
  if v_pkg.status <> 'open' then
    raise exception 'This package is no longer open.' using errcode = '22023';
  end if;
  return v_pkg;
end;
$$;

-- Supabase grants new functions to anon/authenticated by default; helpers
-- must not be callable directly.
revoke all on function public._own_open_package(uuid) from public, anon, authenticated;

-- Adds lessons to a package after checking every one of them: the caller's
-- own lesson, for this child and subject, not cancelled, not already on a
-- package, and within the package's size.
create or replace function public._package_add_sessions(
  p_pkg         public.teacher_packages,
  p_session_ids uuid[]
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ids     uuid[];
  v_valid   integer;
  v_active  integer;
begin
  select coalesce(array_agg(distinct x), '{}') into v_ids
    from unnest(coalesce(p_session_ids, '{}')) as x;
  if cardinality(v_ids) = 0 then
    return;
  end if;

  select count(*) into v_valid
    from public.sessions s
   where s.id = any (v_ids)
     and s.teacher_id    = p_pkg.teacher_id
     and s.student_id    = p_pkg.student_id
     and s.enrollment_id = p_pkg.enrollment_id
     and s.status       <> 'cancelled';
  if v_valid <> cardinality(v_ids) then
    raise exception 'Some of those lessons can''t be added — they must be your own, uncancelled lessons for this child and subject.'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.teacher_package_sessions tps
     where tps.session_id = any (v_ids)
  ) then
    raise exception 'Some of those lessons are already on a package.'
      using errcode = '23505';
  end if;

  select count(*) into v_active
    from public.teacher_package_sessions tps
    join public.sessions s on s.id = tps.session_id
   where tps.package_id = p_pkg.id
     and s.status <> 'cancelled';
  if v_active + cardinality(v_ids) > p_pkg.size then
    raise exception 'That would put % lessons on a package of %. Raise the package size first.',
      v_active + cardinality(v_ids), p_pkg.size
      using errcode = '22023';
  end if;

  insert into public.teacher_package_sessions (package_id, session_id)
  select p_pkg.id, x from unnest(v_ids) as x;
end;
$$;

-- Takes a package row as an argument, so a direct call could forge one —
-- callable only from the functions above.
revoke all on function public._package_add_sessions(public.teacher_packages, uuid[]) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Teacher functions
-- -----------------------------------------------------------------------------

create or replace function public.teacher_package_create(
  p_enrollment_id uuid,
  p_size          integer,
  p_note          text,
  p_session_ids   uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enr  public.enrollments;
  v_pkg  public.teacher_packages;
begin
  if not public.is_teacher(auth.uid()) then
    raise exception 'Teachers only.' using errcode = '42501';
  end if;

  select * into v_enr from public.enrollments where id = p_enrollment_id;
  if v_enr.id is null or v_enr.teacher_id is distinct from auth.uid() then
    raise exception 'You don''t teach that child this subject.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.teacher_packages
     where enrollment_id = p_enrollment_id and status = 'open'
  ) then
    raise exception 'There''s already an open package for this child and subject.'
      using errcode = '23505';
  end if;

  insert into public.teacher_packages (teacher_id, student_id, enrollment_id, size, note)
  values (auth.uid(), v_enr.student_id, v_enr.id, p_size, nullif(btrim(p_note), ''))
  returning * into v_pkg;

  perform public._package_add_sessions(v_pkg, p_session_ids);
  return v_pkg.id;
end;
$$;

create or replace function public.teacher_package_add_sessions(
  p_package_id  uuid,
  p_session_ids uuid[]
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public._package_add_sessions(public._own_open_package(p_package_id), p_session_ids);
end;
$$;

-- Only lessons that haven't happened (scheduled or cancelled) can come off a
-- package. A taught or no-show lesson is the record of the block.
create or replace function public.teacher_package_remove_session(
  p_package_id uuid,
  p_session_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg    public.teacher_packages;
  v_status text;
begin
  v_pkg := public._own_open_package(p_package_id);

  select s.status into v_status
    from public.teacher_package_sessions tps
    join public.sessions s on s.id = tps.session_id
   where tps.package_id = v_pkg.id and tps.session_id = p_session_id;

  if v_status is null then
    raise exception 'That lesson isn''t on this package.' using errcode = 'P0002';
  end if;
  if v_status in ('completed', 'no_show') then
    raise exception 'A lesson that''s already happened can''t be taken off its package.'
      using errcode = '22023';
  end if;

  delete from public.teacher_package_sessions
   where package_id = v_pkg.id and session_id = p_session_id;
end;
$$;

create or replace function public.teacher_package_update(
  p_package_id uuid,
  p_size       integer,
  p_note       text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg    public.teacher_packages;
  v_active integer;
begin
  v_pkg := public._own_open_package(p_package_id);

  if p_size is null or p_size < 1 or p_size > 200 then
    raise exception 'Package size must be between 1 and 200.' using errcode = '22023';
  end if;

  select count(*) into v_active
    from public.teacher_package_sessions tps
    join public.sessions s on s.id = tps.session_id
   where tps.package_id = v_pkg.id
     and s.status <> 'cancelled';
  if p_size < v_active then
    raise exception 'This package already has % lessons on it. Take some off before making it smaller.', v_active
      using errcode = '22023';
  end if;

  update public.teacher_packages
     set size = p_size,
         note = nullif(btrim(p_note), '')
   where id = v_pkg.id;
end;
$$;

-- Confirms a package complete. If fewer lessons have happened than the size,
-- or some on it are still upcoming, the teacher is ending it early and must
-- say why; the lessons that haven't happened come off so the next package can
-- take them.
create or replace function public.teacher_package_confirm(
  p_package_id uuid,
  p_note       text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg      public.teacher_packages;
  v_done     integer;
  v_upcoming integer;
  v_note     text := nullif(btrim(p_note), '');
begin
  v_pkg := public._own_open_package(p_package_id);

  select count(*) filter (where s.status in ('completed', 'no_show')),
         count(*) filter (where s.status = 'scheduled')
    into v_done, v_upcoming
    from public.teacher_package_sessions tps
    join public.sessions s on s.id = tps.session_id
   where tps.package_id = v_pkg.id;

  if v_done = 0 then
    raise exception 'No lessons on this package have happened yet.' using errcode = '22023';
  end if;
  if (v_done < v_pkg.size or v_upcoming > 0) and v_note is null then
    raise exception 'Only % of % lessons have happened. Add a note saying why you''re ending this package early.',
      v_done, v_pkg.size
      using errcode = '22023';
  end if;

  delete from public.teacher_package_sessions tps
   using public.sessions s
   where s.id = tps.session_id
     and tps.package_id = v_pkg.id
     and s.status not in ('completed', 'no_show');

  update public.teacher_packages
     set status = 'complete',
         completed_at = now(),
         completion_note = v_note
   where id = v_pkg.id;
end;
$$;

-- Deletes an open package that nothing has happened on yet (a mistake). Once a
-- lesson on it is taught, the teacher confirms it early instead, so the record
-- of what was taught is never lost.
create or replace function public.teacher_package_cancel(p_package_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg public.teacher_packages;
begin
  v_pkg := public._own_open_package(p_package_id);

  if exists (
    select 1 from public.teacher_package_sessions tps
    join public.sessions s on s.id = tps.session_id
   where tps.package_id = v_pkg.id
     and s.status in ('completed', 'no_show')
  ) then
    raise exception 'Lessons on this package have already happened. Confirm it complete (with a note) instead.'
      using errcode = '22023';
  end if;

  delete from public.teacher_packages where id = v_pkg.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Admin function — accept or return a completed package.
-- -----------------------------------------------------------------------------
create or replace function public.admin_package_review(
  p_package_id uuid,
  p_action     text,
  p_note       text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pkg  public.teacher_packages;
  v_note text := nullif(btrim(p_note), '');
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admins only.' using errcode = '42501';
  end if;

  select * into v_pkg from public.teacher_packages where id = p_package_id for update;
  if v_pkg.id is null then
    raise exception 'Package not found.' using errcode = 'P0002';
  end if;
  if v_pkg.status <> 'complete' then
    raise exception 'Only a package the teacher has confirmed complete can be reviewed.'
      using errcode = '22023';
  end if;

  if p_action = 'accept' then
    -- A lesson whose report was deleted after confirmation is no longer
    -- "happened"; accepting would record a block that wasn't delivered.
    if exists (
      select 1 from public.teacher_package_sessions tps
      join public.sessions s on s.id = tps.session_id
     where tps.package_id = v_pkg.id
       and s.status not in ('completed', 'no_show')
    ) then
      raise exception 'Some lessons on this package are no longer marked as happened. Return it to the teacher instead.'
        using errcode = '22023';
    end if;

    update public.teacher_packages
       set status = 'accepted',
           review_note = v_note,
           reviewed_by = auth.uid(),
           reviewed_at = now()
     where id = v_pkg.id;

  elsif p_action = 'return' then
    if v_note is null then
      raise exception 'Say why you''re returning it — the teacher sees this.' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.teacher_packages
       where enrollment_id = v_pkg.enrollment_id and status = 'open'
    ) then
      raise exception 'The teacher has already started the next package for this child and subject, so this one can''t be reopened. Accept it, or ask them to cancel the new one first.'
        using errcode = '23505';
    end if;

    update public.teacher_packages
       set status = 'open',
           completed_at = null,
           review_note = v_note,
           reviewed_by = auth.uid(),
           reviewed_at = now()
     where id = v_pkg.id;
  else
    raise exception 'Unknown action.' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.teacher_package_create(uuid, integer, text, uuid[]) from public, anon;
revoke all on function public.teacher_package_add_sessions(uuid, uuid[]) from public, anon;
revoke all on function public.teacher_package_remove_session(uuid, uuid) from public, anon;
revoke all on function public.teacher_package_update(uuid, integer, text) from public, anon;
revoke all on function public.teacher_package_confirm(uuid, text) from public, anon;
revoke all on function public.teacher_package_cancel(uuid) from public, anon;
revoke all on function public.admin_package_review(uuid, text, text) from public, anon;

grant execute on function public.teacher_package_create(uuid, integer, text, uuid[]) to authenticated;
grant execute on function public.teacher_package_add_sessions(uuid, uuid[]) to authenticated;
grant execute on function public.teacher_package_remove_session(uuid, uuid) to authenticated;
grant execute on function public.teacher_package_update(uuid, integer, text) to authenticated;
grant execute on function public.teacher_package_confirm(uuid, text) to authenticated;
grant execute on function public.teacher_package_cancel(uuid) to authenticated;
grant execute on function public.admin_package_review(uuid, text, text) to authenticated;
