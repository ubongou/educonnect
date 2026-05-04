-- EduConnect LMS — Pre-booking questionnaire submissions.
--
-- Public-facing form at /book writes here. The table is write-only from
-- the API surface (anon + authenticated can INSERT, nobody can SELECT/
-- UPDATE/DELETE). Service role bypasses RLS, so admins read/export from
-- the Supabase dashboard. We email each submission to the configured
-- admin address; this table exists so a Resend outage never costs a
-- lead.

create table public.booking_requests (
  id                  uuid primary key default gen_random_uuid(),
  child_name          text not null,
  child_age           int  not null check (child_age between 3 and 19),
  child_grade         text not null,
  curriculum          text not null
                        check (curriculum in
                          ('nigerian','british','american','canadian','other')),
  curriculum_other    text,
  subject             text not null
                        check (subject in ('english','mathematics','science')),
  learning_needs      text not null,
  current_performance text not null
                        check (current_performance in
                          ('excellent','good','average','needs_improvement','not_sure')),
  concerns            text,
  parent_name         text not null,
  parent_phone        text not null,
  parent_email        text not null,
  source              text not null default 'direct',
  created_at          timestamptz not null default now()
);

create index booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

alter table public.booking_requests enable row level security;

create policy "public can submit booking requests"
  on public.booking_requests
  for insert
  to anon, authenticated
  with check (true);
