-- masani LMS — Monnify invoices (auto-confirmed payments)
--
-- Each unpaid plan can carry a Monnify "dynamic invoice": a one-off virtual
-- account number for exactly the plan's total, which Monnify settles into the
-- Moniepoint business account. When the parent transfers into it, Monnify
-- calls our webhook (/api/webhooks/monnify) and the plan flips to 'paid' with
-- no admin in the loop — the invoice reference is the match, so the parent
-- doesn't have to remember to quote anything.
--
-- The static Moniepoint account and the manual "Mark paid" flow stay as the
-- fallback: a plan with no live invoice (Monnify not configured, invoice
-- expired, or the call failed) shows the static account exactly as before.
--
-- Invoices get their own table rather than columns on payment_plans because a
-- plan can be re-invoiced (price edited, invoice expired). A payment that lands
-- on an older invoice still has to find its plan, so every invoice a plan ever
-- had stays resolvable by its reference.
--
-- Idempotent throughout — migrations auto-apply to production on push.

-- -----------------------------------------------------------------------------
-- payment_plans.paid_via — how a paid plan was confirmed
-- -----------------------------------------------------------------------------
-- Null on plans paid before this migration (all of which were manual).
alter table public.payment_plans
  add column if not exists paid_via text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payment_plans_paid_via_check'
  ) then
    alter table public.payment_plans
      add constraint payment_plans_paid_via_check
      check (paid_via is null or paid_via in ('manual', 'monnify'));
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- payment_plan_invoices
-- -----------------------------------------------------------------------------
create table if not exists public.payment_plan_invoices (
  id                     uuid primary key default gen_random_uuid(),
  plan_id                uuid not null references public.payment_plans (id) on delete cascade,
  -- Ours, sent to Monnify as `invoiceReference`. Monnify rejects a reused
  -- reference, so it's the plan's reference code plus a suffix per issue.
  invoice_reference      text not null unique,
  -- What the invoice asks for. Snapshotted: if the plan's price is edited the
  -- invoice is reissued, and this is how we tell a stale one apart.
  amount_ngn             numeric(14,2) not null check (amount_ngn > 0),

  account_number         text,
  account_name           text,
  bank_name              text,
  checkout_url           text,
  expires_at             timestamptz not null,

  status                 text not null default 'pending'
                           check (status in ('pending', 'paid', 'cancelled')),

  -- Filled from Monnify's transaction record when the payment lands.
  transaction_reference  text unique,
  amount_paid_ngn        numeric(14,2),
  settlement_amount_ngn  numeric(14,2),
  paid_at                timestamptz,

  created_at             timestamptz not null default now()
);

create index if not exists payment_plan_invoices_plan_idx
  on public.payment_plan_invoices (plan_id, created_at desc);

-- At most one live invoice per plan, so a parent is never shown two different
-- account numbers for the same block.
create unique index if not exists payment_plan_invoices_one_pending_idx
  on public.payment_plan_invoices (plan_id)
  where status = 'pending';

-- -----------------------------------------------------------------------------
-- monnify_events — raw webhook log
-- -----------------------------------------------------------------------------
-- Every notification Monnify sends, with what we did about it. Not the source
-- of truth for anything (the webhook re-reads the transaction from Monnify's
-- API before acting); it's here for "did Monnify ever tell us?" support
-- questions and for spotting unmatched or short payments.
create table if not exists public.monnify_events (
  id                     uuid primary key default gen_random_uuid(),
  event_type             text,
  transaction_reference  text,
  payload                jsonb not null,
  signature_valid        boolean,
  outcome                text,
  detail                 text,
  received_at            timestamptz not null default now()
);

create index if not exists monnify_events_txn_idx
  on public.monnify_events (transaction_reference);
create index if not exists monnify_events_received_idx
  on public.monnify_events (received_at desc);

-- -----------------------------------------------------------------------------
-- RLS
--   • invoices: admin full control; a linked parent may read their own child's
--     invoices (the payment card shows the account number). Writes happen
--     service-role from the webhook and the admin actions.
--   • events: admin-only. The webhook writes service-role.
-- -----------------------------------------------------------------------------
alter table public.payment_plan_invoices enable row level security;
alter table public.monnify_events        enable row level security;

drop policy if exists payment_plan_invoices_read on public.payment_plan_invoices;
create policy payment_plan_invoices_read
  on public.payment_plan_invoices for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
        from public.payment_plans p
        join public.parent_students ps on ps.student_id = p.student_id
       where p.id = payment_plan_invoices.plan_id
         and ps.parent_id = auth.uid()
    )
  );

drop policy if exists payment_plan_invoices_admin_write on public.payment_plan_invoices;
create policy payment_plan_invoices_admin_write
  on public.payment_plan_invoices for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists monnify_events_admin_all on public.monnify_events;
create policy monnify_events_admin_all
  on public.monnify_events for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
