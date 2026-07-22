-- Homework-as-a-link.
--
-- Homework isn't always a file: teachers often set work on an external quiz /
-- assessment site (Quizizz, Google Forms, …) and just want to hand the parent a
-- link the child clicks. Until now `teacher_materials` could only hold an
-- uploaded file (storage_key + original_filename, both NOT NULL). This lets a
-- row instead carry a URL, so links ride the same staged → promote → report
-- machinery as files (composer, report linking, emails, parent view).

-- -----------------------------------------------------------------------------
-- A. Add link_url and relax storage_key so a row is EITHER a file OR a link.
--    original_filename stays NOT NULL and doubles as the display label for both
--    (for a link it's a teacher-supplied title, defaulting to the URL).
-- -----------------------------------------------------------------------------
alter table public.teacher_materials
  add column if not exists link_url text;

alter table public.teacher_materials
  alter column storage_key drop not null;

-- Exactly one of {file, link}: a file has a storage_key and no link_url; a link
-- has a link_url and no storage_key.
alter table public.teacher_materials
  drop constraint if exists teacher_materials_file_xor_link_check;
alter table public.teacher_materials
  add constraint teacher_materials_file_xor_link_check
    check (
      (storage_key is not null and link_url is null)
      or (storage_key is null and link_url is not null)
    );
