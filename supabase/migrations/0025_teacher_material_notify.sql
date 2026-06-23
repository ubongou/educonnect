-- Teacher materials: optional note + email-notification timestamp.
--
-- `note` lets a teacher add a short message when sharing a file with the
-- parent ("here's Friday's homework"). `emailed_at` mirrors
-- `lesson_reports.emailed_at` — stamped once the parent notification email
-- has been sent so we don't re-notify on every re-confirm.

alter table public.teacher_materials
  add column if not exists note text,
  add column if not exists emailed_at timestamptz;
