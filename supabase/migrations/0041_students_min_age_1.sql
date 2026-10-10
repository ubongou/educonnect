-- masani LMS — children from age 1
--
-- Physical classes take toddlers, so the youngest child a parent or the
-- office can register drops from 3 to 1 (the upper limit stays 25):
--
--   • students.age CHECK          3–25 → 1–25
--   • _age_from_dob()             same range, same message wording
--
-- MIN_AGE in src/lib/birthdays.ts mirrors this for the form's own check.
-- Either order of deploy is safe: until both are live, the stricter of the
-- two (3) still applies and the error message says so.
--
-- Idempotent throughout — migrations auto-apply to production on push.

alter table public.students
  drop constraint if exists students_age_check;
alter table public.students
  add constraint students_age_check check (age between 1 and 25);

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
  if v_age < 1 or v_age > 25 then
    raise exception 'Children must be between 1 and 25 years old.' using errcode = '22023';
  end if;
  return v_age::smallint;
end;
$$;

revoke all on function public._age_from_dob(date) from public, anon, authenticated;
