-- EduConnect LMS — RLS hardening pass.
--
-- Closes two privilege-escalation holes the policies in 0002_rls.sql left open:
--
--   1. profiles_self_update allowed any authenticated user to PATCH their own
--      row with `{"role": "admin"}` and self-promote. The app never writes
--      `role` / `email` / `id` from the parent UI, but RLS — not app code — is
--      the gate. We replace the open self-update policy with one that still
--      lets users edit their own full_name/phone but enforces immutability of
--      role/email/id via a BEFORE UPDATE trigger that runs as INVOKER (so
--      auth.uid() is the actual caller, not the trigger owner).
--
--   2. parent_students_insert_self allowed any parent to POST a row with
--      {parent_id: self, student_id: <any-uuid>} and become a "parent" of an
--      arbitrary student. Once linked, every downstream students /
--      intake_files / lesson_reports policy treats them as that student's
--      parent. The legitimate flow goes through create_student_with_intake
--      (SECURITY DEFINER, bypasses RLS), so dropping the self-insert policy
--      and locking inserts to admin only breaks nothing.
--
-- Idempotent: re-running this migration drops + recreates the policies and
-- trigger.

-- -----------------------------------------------------------------------------
-- 1. profiles — block non-admin changes to role / email / id
-- -----------------------------------------------------------------------------

create or replace function public.profiles_block_privileged_updates()
returns trigger
language plpgsql
security invoker  -- run with caller's auth.uid()
set search_path = public, pg_temp
as $$
begin
  -- Bypass for the service_role (used by createTeacher to flip the
  -- auto-created profile's role to 'teacher' right after auth.admin.createUser)
  -- and for admins via the regular auth client.
  if current_user in ('service_role', 'supabase_admin', 'postgres')
     or public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'cannot change profile id'
      using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    raise exception 'only admins can change role'
      using errcode = '42501';
  end if;

  if new.email is distinct from old.email then
    raise exception 'email is managed by auth.users; update via auth.updateUser'
      using errcode = '42501';
  end if;

  -- renewal_at is admin-only as well — parents shouldn't extend their own
  -- subscription window.
  if new.renewal_at is distinct from old.renewal_at then
    raise exception 'only admins can change renewal_at'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_block_privileged_updates on public.profiles;
create trigger profiles_block_privileged_updates
  before update on public.profiles
  for each row execute function public.profiles_block_privileged_updates();

-- -----------------------------------------------------------------------------
-- 2. parent_students — drop self-insert, keep admin-only writes.
--    The legitimate parent path uses create_student_with_intake (SECURITY
--    DEFINER), so this drop is invisible to the app.
-- -----------------------------------------------------------------------------
drop policy if exists parent_students_insert_self on public.parent_students;

-- parent_students_admin_write (FOR ALL) from 0002 already covers admin writes;
-- nothing else to do here.

-- -----------------------------------------------------------------------------
-- 3. Note: we deliberately do NOT add a column-level revoke on profiles here.
--    Admins use the regular auth client (not service-role) for admin UI
--    actions, so they share the `authenticated` Postgres role with parents.
--    Column-level revokes are evaluated before RLS and would block admins
--    too. The trigger above is the single authoritative gate — when admin
--    UI lands for renewal_at / role flips it'll just work because the
--    trigger short-circuits on is_admin(auth.uid()).
