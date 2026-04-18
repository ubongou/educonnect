-- EduConnect LMS — RPC: create_lesson_report
--
-- Admin-only. Inserts a lesson_reports row + all lesson_report_skill_ratings
-- rows in one transaction. Rejects when the referenced (student, subject)
-- does not have an approved enrollment.
--
-- Skill-ratings payload shape:
--   [{"skill_id": "<uuid>", "rating": 0..5}, ...]
-- Empty array is allowed (e.g., subject without seeded skills).

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
  p_skill_ratings       jsonb
) returns public.lesson_reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.lesson_reports;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin only' using errcode = '42501';
  end if;

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
    next_focus, how_to_help_at_home, uploaded_by
  )
  values (
    p_student_id, p_subject_id, p_lesson_date, p_duration_minutes, p_lesson_focus,
    p_understanding_check, p_confidence_level, nullif(p_lesson_highlights, ''),
    p_participation, p_focus_rating, p_homework,
    nullif(p_next_focus, ''), nullif(p_how_to_help_at_home, ''), auth.uid()
  )
  returning * into v_report;

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

revoke all on function public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb
) from public;

grant execute on function public.create_lesson_report(
  uuid, uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb
) to authenticated;
