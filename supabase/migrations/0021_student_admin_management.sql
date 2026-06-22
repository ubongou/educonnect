-- masani LMS — admin student management (Part A, Slice 4)
--
-- Adds:
--   • students.archived_at — soft-delete flag. Archived students drop out of
--     parent dashboards and the active admin list but keep all history.
--   • admin_create_student RPC — lets an admin create a student directly
--     (parents create via create_student_with_intake, which links the caller
--     as parent). This generates the registration number, inserts the row with
--     added_by = the acting admin, and optionally links an existing parent.
--     SECURITY DEFINER + an explicit is_admin() guard, mirroring the existing
--     student/report RPCs.
--
-- Edit, archive, and hard-delete go through the students_admin_write RLS policy
-- (FOR ALL to admins) directly from server actions — no RPC needed for those.

alter table public.students
  add column if not exists archived_at timestamptz;

-- Hot path is "list active students"; a partial index keeps it cheap.
create index if not exists students_active_idx
  on public.students (created_at desc)
  where archived_at is null;

create or replace function public.admin_create_student(
  p_full_name         text,
  p_preferred_name    text,
  p_age               smallint,
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
  v_reg_no  text := public.next_registration_number();
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  insert into public.students (
    registration_number, full_name, preferred_name, age, gender,
    current_school, curriculum, curriculum_other, intake, added_by
  )
  values (
    v_reg_no, p_full_name, nullif(p_preferred_name, ''), p_age, p_gender,
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
  text, text, smallint, text, text, text, text, uuid
) from public;

grant execute on function public.admin_create_student(
  text, text, smallint, text, text, text, text, uuid
) to authenticated;
