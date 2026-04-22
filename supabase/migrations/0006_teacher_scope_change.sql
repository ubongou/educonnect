-- EduConnect LMS — scope change: add teacher role + sessions + student_documents.
--
-- Summary:
--  • profiles.role widens to include 'teacher'
--  • is_teacher(uid) helper (mirrors is_admin)
--  • enrollments gain a nullable teacher_id (admin assigns at approval)
--  • sessions table (admin-scheduled, one-off; linked to an enrollment)
--  • student_documents table (ongoing parent uploads post-intake)
--  • lesson_reports.session_id (reverse link from reports to the scheduled session)
--  • understanding_check + confidence_level CHECK widened from 0..5 to 1..10
--    to carry the inspiration's six named levels (Struggling…Mastery /
--    Withdrawn…Exceptional) via a bucket mapping in src/lib/scales.ts
--  • profiles.renewal_at — simple subscription-renewal hint for parent account page

-- -----------------------------------------------------------------------------
-- 1. Role widening + renewal_at
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('parent', 'admin', 'teacher'));

alter table public.profiles add column if not exists renewal_at date;

-- -----------------------------------------------------------------------------
-- 2. is_teacher helper (matches is_admin shape — no security definer needed;
--    the profile self-read policy already allows the caller to read their row)
-- -----------------------------------------------------------------------------
create or replace function public.is_teacher(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'teacher'
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. enrollments.teacher_id (assigned at approval)
-- -----------------------------------------------------------------------------
alter table public.enrollments
  add column if not exists teacher_id uuid references public.profiles (id);

create index if not exists enrollments_teacher_idx on public.enrollments (teacher_id);

-- -----------------------------------------------------------------------------
-- 4. sessions (admin-scheduled, one-off)
-- -----------------------------------------------------------------------------
create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  enrollment_id     uuid not null references public.enrollments (id) on delete cascade,
  student_id        uuid not null references public.students    (id) on delete cascade,
  subject_id        uuid not null references public.subjects    (id),
  teacher_id        uuid not null references public.profiles    (id),
  scheduled_at      timestamptz not null,
  duration_minutes  smallint not null default 60
                      check (duration_minutes between 15 and 240),
  status            text not null default 'scheduled'
                      check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  lesson_report_id  uuid references public.lesson_reports (id),
  created_at        timestamptz not null default now()
);

create index if not exists sessions_student_date_idx
  on public.sessions (student_id, scheduled_at desc);
create index if not exists sessions_teacher_date_idx
  on public.sessions (teacher_id, scheduled_at desc);

-- -----------------------------------------------------------------------------
-- 5. student_documents (ongoing parent uploads; distinct from intake_files)
-- -----------------------------------------------------------------------------
create table if not exists public.student_documents (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.students (id) on delete cascade,
  uploaded_by        uuid not null references public.profiles (id),
  kind               text not null
                       check (kind in ('test_paper', 'school_report', 'exam_result', 'other')),
  original_filename  text not null,
  storage_path       text not null,
  mime_type          text,
  size_bytes         bigint,
  uploaded_at        timestamptz not null default now()
);

create index if not exists student_documents_student_idx
  on public.student_documents (student_id, uploaded_at desc);

-- -----------------------------------------------------------------------------
-- 6. lesson_reports — add session_id reverse link + widen ratings CHECKs.
--    No prod reports exist yet, so widening CHECKs is a clean change.
--
--    Scale map (all client-decided):
--      understanding_check  : 1..10 (six named levels via src/lib/scales.ts)
--      confidence_level     : 1..10 (six named levels)
--      participation        : 0..10 (learning behaviours slider)
--      focus_rating         : 0..10 (learning behaviours slider)
--      homework             : 0..10 (learning behaviours slider)
--      lesson_report_skill_ratings.rating : 0..10 (per-skill tracker slider)
-- -----------------------------------------------------------------------------
alter table public.lesson_reports
  add column if not exists session_id uuid references public.sessions (id);

alter table public.lesson_reports
  drop constraint if exists lesson_reports_understanding_check_check;
alter table public.lesson_reports
  add constraint lesson_reports_understanding_check_check
  check (understanding_check between 1 and 10);

alter table public.lesson_reports
  drop constraint if exists lesson_reports_confidence_level_check;
alter table public.lesson_reports
  add constraint lesson_reports_confidence_level_check
  check (confidence_level between 1 and 10);

alter table public.lesson_reports
  drop constraint if exists lesson_reports_participation_check;
alter table public.lesson_reports
  add constraint lesson_reports_participation_check
  check (participation between 0 and 10);

alter table public.lesson_reports
  drop constraint if exists lesson_reports_focus_rating_check;
alter table public.lesson_reports
  add constraint lesson_reports_focus_rating_check
  check (focus_rating between 0 and 10);

alter table public.lesson_reports
  drop constraint if exists lesson_reports_homework_check;
alter table public.lesson_reports
  add constraint lesson_reports_homework_check
  check (homework between 0 and 10);

alter table public.lesson_report_skill_ratings
  drop constraint if exists lesson_report_skill_ratings_rating_check;
alter table public.lesson_report_skill_ratings
  add constraint lesson_report_skill_ratings_rating_check
  check (rating between 0 and 10);

-- -----------------------------------------------------------------------------
-- 7. Update create_lesson_report RPC — now accepts an optional session_id and
--    authorizes the caller as admin OR the session's teacher. When session_id
--    is set, the RPC also marks the session completed and back-links the
--    lesson_report_id so parent/admin queries can join either direction.
--
--    CHECK constraints above mean callers must pass 1..10 for understanding
--    and confidence. The old 14-arg overload is dropped so there is a single
--    canonical signature; CREATE OR REPLACE alone would leave the old
--    overload behind because PG treats differing arg lists as distinct
--    functions.
-- -----------------------------------------------------------------------------
drop function if exists public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb
);

create or replace function public.create_lesson_report(
  p_student_id          uuid,
  p_subject_id          uuid,
  p_lesson_date         date,
  p_duration_minutes    smallint,
  p_lesson_focus        text,
  p_understanding_check smallint,
  p_confidence_level    smallint,
  p_lesson_highlights   text,
  p_participation       smallint,
  p_focus_rating        smallint,
  p_homework            smallint,
  p_next_focus          text,
  p_how_to_help_at_home text,
  p_skill_ratings       jsonb,
  p_session_id          uuid default null
) returns public.lesson_reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.lesson_reports;
  v_authorized boolean;
begin
  -- Authorization: admin OR teacher assigned to the linked session / enrollment.
  if public.is_admin(auth.uid()) then
    v_authorized := true;
  elsif p_session_id is not null then
    v_authorized := exists (
      select 1 from public.sessions s
      where s.id = p_session_id
        and s.teacher_id = auth.uid()
        and s.student_id = p_student_id
        and s.subject_id = p_subject_id
    );
  else
    -- No session → admin path only (original behaviour).
    v_authorized := false;
  end if;

  if not v_authorized then
    raise exception 'not authorized to create a lesson report for this session'
      using errcode = '42501';
  end if;

  -- Enrollment sanity check (unchanged): there must be an approved enrollment.
  if not exists (
    select 1 from public.enrollments e
    where e.student_id = p_student_id
      and e.subject_id = p_subject_id
      and e.status = 'approved'
  ) then
    raise exception 'no approved enrollment for this (student, subject)'
      using errcode = '23503';
  end if;

  insert into public.lesson_reports (
    student_id, subject_id, lesson_date, duration_minutes, lesson_focus,
    understanding_check, confidence_level, lesson_highlights,
    participation, focus_rating, homework,
    next_focus, how_to_help_at_home, uploaded_by, session_id
  )
  values (
    p_student_id, p_subject_id, p_lesson_date, p_duration_minutes, p_lesson_focus,
    p_understanding_check, p_confidence_level, nullif(p_lesson_highlights, ''),
    p_participation, p_focus_rating, p_homework,
    nullif(p_next_focus, ''), nullif(p_how_to_help_at_home, ''), auth.uid(),
    p_session_id
  )
  returning * into v_report;

  if p_skill_ratings is not null
     and jsonb_typeof(p_skill_ratings) = 'array'
     and jsonb_array_length(p_skill_ratings) > 0 then
    insert into public.lesson_report_skill_ratings (lesson_report_id, skill_id, rating)
    select v_report.id,
           (r ->> 'skill_id')::uuid,
           (r ->> 'rating')::smallint
      from jsonb_array_elements(p_skill_ratings) as r;
  end if;

  if p_session_id is not null then
    update public.sessions
       set status = 'completed',
           lesson_report_id = v_report.id
     where id = p_session_id;
  end if;

  return v_report;
end;
$$;

revoke all on function public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb, uuid
) from public;

grant execute on function public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb, uuid
) to authenticated;
