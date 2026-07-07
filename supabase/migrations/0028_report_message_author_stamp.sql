-- Denormalise the message author's display name + role onto each message.
--
-- The thread loader runs under the caller's RLS-scoped client, and profiles
-- RLS only exposes your *own* row (or all rows to admins). So a parent can't
-- read the teacher's profile through the join (and vice-versa) — the name came
-- back null and the role defaulted to "parent" for everyone. We stamp the
-- author's name/role at insert time via a SECURITY DEFINER trigger so the
-- loader can read them straight off the message with no profiles join. Doing it
-- in a trigger (not the app) also means the role can't be spoofed by a crafted
-- insert — it's always taken from the real profiles row for author_id.

alter table public.lesson_report_messages
  add column if not exists author_name text,
  add column if not exists author_role text;

create or replace function public.lesson_report_messages_stamp_author()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  select p.full_name, p.role
    into new.author_name, new.author_role
  from public.profiles p
  where p.id = new.author_id;
  return new;
end;
$$;

drop trigger if exists lesson_report_messages_stamp_author_trg
  on public.lesson_report_messages;

create trigger lesson_report_messages_stamp_author_trg
  before insert on public.lesson_report_messages
  for each row execute function public.lesson_report_messages_stamp_author();

-- Backfill any messages created before this migration.
update public.lesson_report_messages m
set author_name = p.full_name,
    author_role = p.role
from public.profiles p
where p.id = m.author_id
  and (m.author_name is null or m.author_role is null);
