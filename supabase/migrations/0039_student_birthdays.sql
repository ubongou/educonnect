-- masani LMS — children's birthdays
--
-- Parents now give a date of birth instead of an age when they register a
-- child, and teachers (with the office copied) get a reminder a week before
-- and the day before each birthday.
--
--   • students.date_of_birth — nullable: children registered before this have
--     only an age until the office fills it in. `age` stays (it's what those
--     children have) and is set from the date of birth for new ones.
--   • New versions of create_student_with_intake / admin_create_student that
--     take p_date_of_birth. The old versions stay, untouched, so a request
--     from code deployed a few minutes behind (or ahead of) this migration
--     still works. The two differ in argument name and type (p_age smallint
--     vs p_date_of_birth date), so no call is ambiguous.
--   • birthday_reminders — one row per (child, birthday, kind) once it's sent,
--     which is what stops the daily job ever sending the same reminder twice,
--     however often it runs.
--
-- Idempotent throughout — migrations auto-apply to production on push.

alter table public.students
  add column if not exists date_of_birth date;

-- -----------------------------------------------------------------------------
-- Shared checks
-- -----------------------------------------------------------------------------
create or replace function public._age_from_dob(p_dob date)
returns smallint
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_age integer;
begin
  if p_dob is null then
    raise exception 'Date of birth is required.' using errcode = '22023';
  end if;
  if p_dob > (now() at time zone 'Africa/Lagos')::date then
    raise exception 'Date of birth can''t be in the future.' using errcode = '22023';
  end if;
  v_age := extract(year from age((now() at time zone 'Africa/Lagos')::date, p_dob))::integer;
  if v_age < 3 or v_age > 25 then
    raise exception 'Children must be between 3 and 25 years old.' using errcode = '22023';
  end if;
  return v_age::smallint;
end;
$$;

revoke all on function public._age_from_dob(date) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Parent registration (with date of birth)
-- -----------------------------------------------------------------------------
create or replace function public.create_student_with_intake(
  p_full_name         text,
  p_preferred_name    text,
  p_date_of_birth     date,
  p_gender            text,
  p_current_school    text,
  p_curriculum        text,
  p_curriculum_other  text,
  p_intake            jsonb
) returns public.students
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student  public.students;
  v_reg_no   text;
  v_age      smallint;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  v_age := public._age_from_dob(p_date_of_birth);
  v_reg_no := public.next_registration_number();

  insert into public.students (
    registration_number, full_name, preferred_name, age, date_of_birth, gender,
    current_school, curriculum, curriculum_other, intake,
    intake_submitted_at, added_by
  )
  values (
    v_reg_no, p_full_name, nullif(p_preferred_name, ''), v_age, p_date_of_birth, p_gender,
    nullif(p_current_school, ''), p_curriculum,
    nullif(p_curriculum_other, ''),
    coalesce(p_intake, '{}'::jsonb),
    now(), auth.uid()
  )
  returning * into v_student;

  insert into public.parent_students (parent_id, student_id)
  values (auth.uid(), v_student.id);

  return v_student;
end;
$$;

revoke all on function public.create_student_with_intake(
  text, text, date, text, text, text, text, jsonb
) from public, anon;
grant execute on function public.create_student_with_intake(
  text, text, date, text, text, text, text, jsonb
) to authenticated;

-- -----------------------------------------------------------------------------
-- Admin creates a student (with date of birth)
-- -----------------------------------------------------------------------------
create or replace function public.admin_create_student(
  p_full_name         text,
  p_preferred_name    text,
  p_date_of_birth     date,
  p_gender            text,
  p_current_school    text,
  p_curriculum        text,
  p_curriculum_other  text,
  p_parent_id         uuid
) returns public.students
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student public.students;
  v_reg_no  text;
  v_age     smallint;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  v_age := public._age_from_dob(p_date_of_birth);
  v_reg_no := public.next_registration_number();

  insert into public.students (
    registration_number, full_name, preferred_name, age, date_of_birth, gender,
    current_school, curriculum, curriculum_other, intake, added_by
  )
  values (
    v_reg_no, p_full_name, nullif(p_preferred_name, ''), v_age, p_date_of_birth, p_gender,
    nullif(p_current_school, ''), p_curriculum, nullif(p_curriculum_other, ''),
    '{}'::jsonb, auth.uid()
  )
  returning * into v_student;

  if p_parent_id is not null then
    insert into public.parent_students (parent_id, student_id)
    values (p_parent_id, v_student.id)
    on conflict do nothing;
  end if;

  return v_student;
end;
$$;

revoke all on function public.admin_create_student(
  text, text, date, text, text, text, text, uuid
) from public, anon;
grant execute on function public.admin_create_student(
  text, text, date, text, text, text, text, uuid
) to authenticated;

-- -----------------------------------------------------------------------------
-- birthday_reminders — the sent log the daily job checks before every send.
-- -----------------------------------------------------------------------------
create table if not exists public.birthday_reminders (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  -- The birthday this reminder was for (this year's occurrence), so next
  -- year's reminders are new rows rather than blocked by this year's.
  birthday     date not null,
  kind         text not null check (kind in ('week_before', 'day_before')),
  recipients   text[] not null default '{}',
  sent_at      timestamptz not null default now(),
  unique (student_id, birthday, kind)
);

alter table public.birthday_reminders enable row level security;

-- Admin can read the log; the daily job writes with the service role.
drop policy if exists birthday_reminders_admin_read on public.birthday_reminders;
create policy birthday_reminders_admin_read
  on public.birthday_reminders for select
  using (public.is_admin(auth.uid()));
