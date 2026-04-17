-- EduConnect LMS — initial schema
-- Creates: profiles, students, parent_students, intake_files, subjects, subject_skills,
-- enrollments, lesson_reports, lesson_report_skill_ratings
-- Plus: profile auto-create trigger, registration-number generator, is_admin helper.

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'parent' check (role in ('parent', 'admin')),
  full_name   text,
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

-- keep profiles.email in sync on user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- registration-number generator (EC-YYYY-NNNNN)
-- -----------------------------------------------------------------------------
create sequence public.student_reg_seq start 1 no cycle;

create or replace function public.next_registration_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.student_reg_seq');
  return format('EC-%s-%s', to_char(now(), 'YYYY'), to_char(n, 'FM00000'));
end;
$$;

-- -----------------------------------------------------------------------------
-- is_admin helper (used by RLS policies)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
create table public.students (
  id                    uuid primary key default gen_random_uuid(),
  registration_number   text unique not null,
  full_name             text not null,
  preferred_name        text,
  age                   smallint check (age between 3 and 25),
  gender                text check (gender in ('male', 'female', 'prefer_not_to_say')),
  current_school        text,
  curriculum            text check (curriculum in ('british', 'nigerian', 'american', 'not_sure', 'other')),
  curriculum_other      text,
  intake                jsonb not null default '{}'::jsonb,
  intake_submitted_at   timestamptz,
  added_by              uuid references public.profiles (id),
  created_at            timestamptz not null default now()
);

create index students_added_by_idx on public.students (added_by);

-- -----------------------------------------------------------------------------
-- parent_students (M:N link)
-- -----------------------------------------------------------------------------
create table public.parent_students (
  parent_id   uuid not null references public.profiles (id) on delete cascade,
  student_id  uuid not null references public.students (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (parent_id, student_id)
);

create index parent_students_student_idx on public.parent_students (student_id);

-- -----------------------------------------------------------------------------
-- intake_files (metadata; binary lives in Supabase Storage bucket "intake-files")
-- -----------------------------------------------------------------------------
create table public.intake_files (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students (id) on delete cascade,
  kind                text not null check (kind in ('curriculum', 'school_report', 'class_notes')),
  original_filename   text not null,
  storage_path        text not null,
  mime_type           text,
  size_bytes          bigint,
  uploaded_at         timestamptz not null default now()
);

create index intake_files_student_idx on public.intake_files (student_id);

-- -----------------------------------------------------------------------------
-- subjects
-- -----------------------------------------------------------------------------
create table public.subjects (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,
  slug         text unique not null,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- subject_skills (per-subject skill tracker definitions)
-- -----------------------------------------------------------------------------
create table public.subject_skills (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  name         text not null,
  description  text,
  sort_order   smallint not null default 0,
  unique (subject_id, name)
);

create index subject_skills_subject_idx on public.subject_skills (subject_id, sort_order);

-- -----------------------------------------------------------------------------
-- enrollments
-- -----------------------------------------------------------------------------
create table public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  subject_id    uuid not null references public.subjects (id),
  requested_by  uuid not null references public.profiles (id),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by    uuid references public.profiles (id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (student_id, subject_id)
);

create index enrollments_status_idx on public.enrollments (status);
create index enrollments_student_idx on public.enrollments (student_id);

-- -----------------------------------------------------------------------------
-- lesson_reports (per-session rich report)
-- -----------------------------------------------------------------------------
create table public.lesson_reports (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.students (id) on delete cascade,
  subject_id            uuid not null references public.subjects (id),
  lesson_date           date not null,
  duration_minutes      smallint not null check (duration_minutes between 1 and 600),
  lesson_focus          text not null,
  understanding_check   smallint not null check (understanding_check between 0 and 5),
  confidence_level      smallint not null check (confidence_level between 0 and 5),
  lesson_highlights     text,
  participation         smallint not null check (participation between 0 and 5),
  focus_rating          smallint not null check (focus_rating between 0 and 5),
  homework              smallint not null check (homework between 0 and 5),
  next_focus            text,
  how_to_help_at_home   text,
  uploaded_by           uuid not null references public.profiles (id),
  emailed_at            timestamptz,
  created_at            timestamptz not null default now()
);

create index lesson_reports_student_date_idx on public.lesson_reports (student_id, lesson_date desc);
create index lesson_reports_subject_idx on public.lesson_reports (subject_id);

-- -----------------------------------------------------------------------------
-- lesson_report_skill_ratings (per-skill 0..5 rating tied to a report)
-- -----------------------------------------------------------------------------
create table public.lesson_report_skill_ratings (
  lesson_report_id  uuid not null references public.lesson_reports (id) on delete cascade,
  skill_id          uuid not null references public.subject_skills (id),
  rating            smallint not null check (rating between 0 and 5),
  primary key (lesson_report_id, skill_id)
);
