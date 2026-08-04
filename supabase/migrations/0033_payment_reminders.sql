-- masani LMS — payment reminder ledger
--
-- Renewal nudges are event-driven: filing a lesson report (or marking a
-- no-show) is what consumes a paid session, so that's the moment a plan can
-- drop to its last lesson and the reminder fires. The same plan gets
-- re-evaluated on every subsequent report, and the admin can sweep everyone by
-- hand, so something has to stop that becoming repeat pestering. This table is
-- it: one row per (plan, kind), enforced by a unique index, so a plan can
-- physically only be nudged once per reason.
--
-- Two kinds, and no more — the cadence deliberately stops after the second:
--   • 'renewal_due'    — a paid plan has dropped to one session left to deliver
--                        (i.e. the second-to-last session was just delivered).
--   • 'plan_exhausted' — every session on the plan has been delivered and no
--                        new paid plan has replaced it.
--
-- Idempotent throughout — migrations auto-apply to production on push.

create table if not exists public.payment_reminders (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.payment_plans (id) on delete cascade,
  kind        text not null check (kind in ('renewal_due', 'plan_exhausted')),
  sent_at     timestamptz not null default now(),
  -- Who it actually reached, for support questions of the "we never got it"
  -- variety. Includes the admin copy.
  recipients  text[] not null default '{}'::text[]
);

-- The idempotency guarantee. Everything else here is bookkeeping.
create unique index if not exists payment_reminders_plan_kind_idx
  on public.payment_reminders (plan_id, kind);

-- -----------------------------------------------------------------------------
-- RLS — admin-only. Parents see the emails; they have no business reading the
-- send log. The sweep itself runs service-role, so it bypasses this entirely —
-- which matters because it's triggered by a teacher filing a report, and
-- teachers must not gain read access to payment data.
-- -----------------------------------------------------------------------------
alter table public.payment_reminders enable row level security;

drop policy if exists payment_reminders_admin_all on public.payment_reminders;
create policy payment_reminders_admin_all
  on public.payment_reminders for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
