-- masani — booking requests: several subjects, plus "Other"
--
-- The /book form now lets a parent tick any number of subjects, including
-- "Other" with a free-text box.
--
--   • subjects       — every subject ticked (english / mathematics / science /
--                      other). Nullable: rows from before this have only
--                      `subject`, and are backfilled below.
--   • subject_other  — what the parent typed when they ticked "Other".
--   • subject        — kept, and still NOT NULL: the first ticked subject
--                      (a standard one when any is ticked). Its check now also
--                      allows 'other', for a request that is only "Other".
--
-- Code deployed a few minutes ahead of this migration falls back to the old
-- columns (see submitBookingRequest), so no request is lost either way.
--
-- Idempotent throughout — migrations auto-apply to production on push.

alter table public.booking_requests
  add column if not exists subjects text[],
  add column if not exists subject_other text;

alter table public.booking_requests
  drop constraint if exists booking_requests_subject_check;
alter table public.booking_requests
  add constraint booking_requests_subject_check
  check (subject in ('english','mathematics','science','other'));

alter table public.booking_requests
  drop constraint if exists booking_requests_subjects_check;
alter table public.booking_requests
  add constraint booking_requests_subjects_check
  check (
    subjects is null
    or (
      cardinality(subjects) > 0
      and subjects <@ array['english','mathematics','science','other']::text[]
    )
  );

update public.booking_requests
  set subjects = array[subject]
  where subjects is null;
