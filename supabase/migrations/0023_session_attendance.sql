-- masani LMS — teacher attendance capture (Part C, C10)
--
-- Sessions carry a status (scheduled / completed / cancelled / no_show), but
-- only admins can write to the sessions table (sessions_admin_write FOR ALL),
-- and 'completed' is set implicitly when a teacher files a report. There was no
-- way for a teacher to record that a student DIDN'T attend.
--
-- This RPC lets the assigned teacher (or an admin) flip a session between
-- 'scheduled' and 'no_show' — the attendance states a teacher owns. It's
-- SECURITY DEFINER with an explicit caller check, so it doesn't require opening
-- the sessions table to teacher writes wholesale. Admins keep full control over
-- every status via the direct admin-write path.

create or replace function public.set_session_attendance(
  p_session_id uuid,
  p_status     text
) returns public.sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.sessions;
begin
  if p_status not in ('scheduled', 'no_show') then
    raise exception 'attendance status must be scheduled or no_show'
      using errcode = '22023';
  end if;

  if not (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.sessions s
      where s.id = p_session_id and s.teacher_id = auth.uid()
    )
  ) then
    raise exception 'not authorized to update this session'
      using errcode = '42501';
  end if;

  update public.sessions
     set status = p_status
   where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;

revoke all on function public.set_session_attendance(uuid, text) from public;
grant execute on function public.set_session_attendance(uuid, text) to authenticated;
