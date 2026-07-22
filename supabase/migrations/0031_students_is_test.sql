-- Flag test students so they don't skew admin metrics.
--
-- The team keeps a real, usable student account for testing the platform. It's
-- active (not archived) so it behaves like any other student, but it shouldn't
-- be counted among real students on the admin overview. `is_test` marks such
-- accounts; admins toggle it from the Students table. Excluded from the active
-- student count, but otherwise fully functional.

alter table public.students
  add column if not exists is_test boolean not null default false;

-- The overview counts "active, real" students: archived_at is null AND not test.
create index if not exists students_active_real_idx
  on public.students (created_at desc)
  where archived_at is null and is_test = false;
