-- masani LMS — soft-delete for lesson reports (Part A, Slice 5)
--
-- Lesson reports get emailed to parents and feed the progression charts, so a
-- mistaken or duplicate report shouldn't be hard-deleted on a whim. Add a
-- `deleted_at` flag: soft-deleted reports drop out of every parent/teacher/
-- admin read surface and the charts, but stay restorable from the admin
-- reports page. The session that pointed at the report keeps its link, so a
-- restore brings everything back intact.
--
-- Admins write this via the existing lesson_reports_admin_write (FOR ALL)
-- policy — no RPC needed.

alter table public.lesson_reports
  add column if not exists deleted_at timestamptz;

-- The hot read path is "active reports for a student, newest first". A partial
-- index keeps it cheap while soft-deleted rows sit out of the way.
create index if not exists lesson_reports_active_student_idx
  on public.lesson_reports (student_id, lesson_date desc)
  where deleted_at is null;
