-- masani LMS — sessions date-only (Part B, Slice 1: stop writing scheduled_at)
--
-- Slice 0 (0019) added `session_date` and the app dual-wrote both columns.
-- Slice 1 flips every create/edit form and display surface to `session_date`
-- and stops writing `scheduled_at` entirely. New rows therefore have no
-- timestamp to supply, so `scheduled_at` can no longer be NOT NULL.
--
-- The column is kept (now nullable) rather than dropped: existing rows keep
-- their original timestamps as a "preserve-but-hidden" audit trail until the
-- CONTRACT migration (Slice 6) drops it once we've confirmed nothing regressed.

alter table public.sessions
  alter column scheduled_at drop not null;
