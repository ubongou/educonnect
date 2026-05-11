-- EduConnect LMS — Admin edit of past lesson reports
--
-- Adds a minimal audit trail (edited_at + edited_by) and an `update_lesson_report`
-- RPC that swaps in updated fields + replaces skill ratings transactionally.
--
-- The original `create_lesson_report` flow stays untouched; this is a separate
-- entry point used only by /admin/reports/[id]/edit. Admin-only.

alter table public.lesson_reports
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid references public.profiles (id) on delete set null;

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
  p_skill_ratings       jsonb
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
  smallint, smallint, smallint, text, text, jsonb
) from public;

grant execute on function public.update_lesson_report(
  uuid, date, smallint, text, smallint, smallint, text,
  smallint, smallint, smallint, text, text, jsonb
) to authenticated;
