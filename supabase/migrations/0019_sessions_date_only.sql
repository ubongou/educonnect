-- masani LMS — sessions become date-only (Part B, Slice 0: additive/expand step)
--
-- Sessions have always been scheduled by calendar day in the product; the
-- teacher portal already presents them date-only. The data model, however,
-- still carries a full `scheduled_at timestamptz`. This migration introduces a
-- `session_date date` column alongside it and backfills from the existing
-- timestamps.
--
-- This is the EXPAND half of an expand/contract migration. It is intentionally
-- additive: `scheduled_at` is left in place and still NOT NULL, so every
-- existing reader/writer keeps working unchanged. Application code dual-writes
-- both columns from this slice on (derive session_date from the chosen day),
-- so the two stay in sync while the UI is migrated surface-by-surface.
--
-- Later slices:
--   • Slice 1 flips the create/edit forms + every display surface to
--     `session_date` and stops writing `scheduled_at`.
--   • Slice 6 (CONTRACT) drops `scheduled_at` once nothing reads it.
--
-- Backfill uses the UTC calendar day. Imported historical sessions were
-- deliberately stamped `T12:00:00Z` (see importPastSessions), so the UTC day is
-- the stable, drift-free choice for every existing row.

alter table public.sessions
  add column if not exists session_date date;

update public.sessions
   set session_date = (scheduled_at at time zone 'UTC')::date
 where session_date is null;

alter table public.sessions
  alter column session_date set not null;

-- Date-keyed twins of the existing scheduled_at indexes. The old indexes stay
-- until scheduled_at is dropped in the contract migration.
create index if not exists sessions_student_date_only_idx
  on public.sessions (student_id, session_date desc);
create index if not exists sessions_teacher_date_only_idx
  on public.sessions (teacher_id, session_date desc);
