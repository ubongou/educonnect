-- Text homework submissions.
--
-- Parents can send their child's completed homework back as a short written
-- answer (e.g. "1. fish  2. books") instead of uploading a file. That's stored
-- as a `student_documents` row (kind 'homework_submission') carrying
-- `submission_text` and no file, so it flows through the same review / status /
-- teacher-notify machinery as an uploaded submission.

-- -----------------------------------------------------------------------------
-- Add submission_text and relax the file columns so a row is EITHER a file
-- (storage_key + original_filename) OR text (submission_text).
-- -----------------------------------------------------------------------------
alter table public.student_documents
  add column if not exists submission_text text;

alter table public.student_documents
  alter column storage_key drop not null;
alter table public.student_documents
  alter column original_filename drop not null;

-- A row is a file (has storage_key + original_filename, no text) or a text
-- submission (has submission_text, no file). Existing rows are all files, so
-- they satisfy the first branch.
alter table public.student_documents
  drop constraint if exists student_documents_file_xor_text_check;
alter table public.student_documents
  add constraint student_documents_file_xor_text_check
    check (
      (storage_key is not null and original_filename is not null
        and submission_text is null)
      or (submission_text is not null and storage_key is null
        and original_filename is null)
    );
