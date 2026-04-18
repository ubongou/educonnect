-- EduConnect LMS — RPC: create_student_with_intake
--
-- Atomic: generate a registration number, insert the student row, link it to
-- the calling parent via parent_students. Bypasses students RLS via
-- SECURITY DEFINER — parent link is guaranteed because we set added_by =
-- auth.uid() and insert the link in the same transaction.

create or replace function public.create_student_with_intake(
  p_full_name         text,
  p_preferred_name    text,
  p_age               smallint,
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
  v_reg_no   text := public.next_registration_number();
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  insert into public.students (
    registration_number, full_name, preferred_name, age, gender,
    current_school, curriculum, curriculum_other, intake,
    intake_submitted_at, added_by
  )
  values (
    v_reg_no, p_full_name, nullif(p_preferred_name, ''), p_age, p_gender,
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
  text, text, smallint, text, text, text, text, jsonb
) from public;

grant execute on function public.create_student_with_intake(
  text, text, smallint, text, text, text, text, jsonb
) to authenticated;
