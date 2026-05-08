-- Soft-delete for parent + teacher accounts.
--
-- Hard-deleting a teacher would either fail (FK constraints to lesson_reports
-- and sessions are not CASCADE) or destroy history. Hard-deleting a parent
-- would CASCADE through parent_students -> enrollments -> lesson_reports and
-- erase the audit trail. Instead, mark accounts deactivated. The login action
-- rejects sign-ins with a non-null deactivated_at, and admin teacher dropdowns
-- filter to active rows.

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

-- Hot path is "list active teachers" / "list active parents". A partial index
-- by role keeps both queries fast without bloating with deactivated rows.
create index if not exists profiles_active_role_idx
  on public.profiles (role)
  where deactivated_at is null;
