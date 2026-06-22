-- 0024 — Attach a class recording link to a lesson report.
--
-- Parents asked to be able to re-watch the class. We store an *external*
-- recording URL (Zoom / Google Meet / Loom / unlisted YouTube, etc.) rather
-- than hosting video bytes — cheapest path, no storage/egress, and the
-- hosting tool handles streaming + access.
--
--   • lesson_reports.recording_url  — nullable https URL
--   • create_lesson_report / update_lesson_report gain a p_recording_url arg
--     so the teacher can add it at submit time and an admin can add/replace
--     it later from the edit screen.
--
-- The CHECK keeps obvious junk out (must be an https:// link); the app layer
-- (Zod) does the stricter URL validation.

alter table public.lesson_reports
  add column if not exists recording_url text;

alter table public.lesson_reports
  drop constraint if exists lesson_reports_recording_url_check;
alter table public.lesson_reports
  add constraint lesson_reports_recording_url_check
  check (recording_url is null or recording_url ~ '^https://');

-- -----------------------------------------------------------------------------
-- create_lesson_report — re-declare with the new trailing p_recording_url arg.
-- Body is identical to 0006 plus the recording_url insert. Drop the prior
-- 15-arg overload first so there is a single canonical signature.
-- -----------------------------------------------------------------------------
drop function if exists public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb, uuid
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
  p_session_id          uuid default null,
  p_recording_url       text default null
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
    next_focus, how_to_help_at_home, uploaded_by, session_id, recording_url
  )
  values (
    p_student_id, p_subject_id, p_lesson_date, p_duration_minutes, p_lesson_focus,
    p_understanding_check, p_confidence_level, nullif(p_lesson_highlights, ''),
    p_participation, p_focus_rating, p_homework,
    nullif(p_next_focus, ''), nullif(p_how_to_help_at_home, ''), auth.uid(),
    p_session_id, nullif(p_recording_url, '')
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
  smallint, smallint, smallint, text, text, jsonb, uuid, text
) from public;

grant execute on function public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb, uuid, text
) to authenticated;

-- -----------------------------------------------------------------------------
-- update_lesson_report — re-declare with the new trailing p_recording_url arg.
-- Body is identical to 0016 plus the recording_url update. Still admin-only;
-- a teacher who forgot to add the link at submit time asks an admin to edit.
-- -----------------------------------------------------------------------------
drop function if exists public.update_lesson_report(
  uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb
);

create or replace function public.update_lesson_report(
  p_report_id           uuid,
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
  p_recording_url       text default null
) returns public.lesson_reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.lesson_reports;
  v_caller uuid := auth.uid();
begin
  if not public.is_admin(v_caller) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  update public.lesson_reports
     set lesson_date         = p_lesson_date,
         duration_minutes    = p_duration_minutes,
         lesson_focus        = p_lesson_focus,
         understanding_check = p_understanding_check,
         confidence_level    = p_confidence_level,
         lesson_highlights   = nullif(p_lesson_highlights, ''),
         participation       = p_participation,
         focus_rating        = p_focus_rating,
         homework            = p_homework,
         next_focus          = nullif(p_next_focus, ''),
         how_to_help_at_home = nullif(p_how_to_help_at_home, ''),
         recording_url       = nullif(p_recording_url, ''),
         edited_at           = now(),
         edited_by           = v_caller
   where id = p_report_id
   returning * into v_report;

  if v_report.id is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;

  -- Replace skill ratings wholesale. Simpler + safer than diffing client-side
  -- payloads, and the table is narrow enough that the churn is negligible.
  delete from public.lesson_report_skill_ratings
   where lesson_report_id = v_report.id;

  if p_skill_ratings is not null and jsonb_typeof(p_skill_ratings) = 'array'
     and jsonb_array_length(p_skill_ratings) > 0 then
    insert into public.lesson_report_skill_ratings (lesson_report_id, skill_id, rating)
    select v_report.id,
           (r ->> 'skill_id')::uuid,
           (r ->> 'rating')::smallint
      from jsonb_array_elements(p_skill_ratings) as r;
  end if;

  return v_report;
end;
$$;

revoke all on function public.update_lesson_report(
  uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb, text
) from public;

grant execute on function public.update_lesson_report(
  uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb, text
) to authenticated;
