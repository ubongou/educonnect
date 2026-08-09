-- masani LMS — payment plans (prepaid session blocks)
--
-- Teaching is prepaid: a parent buys a block of sessions by bank transfer to
-- the Nigerian account, and we schedule against what they've paid for. There
-- are no partial payments and no teaching on credit, so a plan is binary —
-- 'unpaid' until the transfer lands, then 'paid'. That's why there is no
-- separate payments ledger: one plan IS one payment.
--
-- Money is naira only. No currency column, deliberately: every transfer
-- settles in NGN regardless of what the parent sent from.
--
-- Two counters hang off `sessions.payment_plan_id`, doing different jobs:
--   • scheduled  — attached sessions that aren't cancelled. Governs "does this
--                  plan have room for another booking?". Cancelling frees the
--                  credit again, so a cancelled lesson is rescheduled, not
--                  burnt.
--   • delivered  — attached sessions marked completed (a no-show does not
--                  count). Governs the renewal reminder (fired at one session
--                  left to deliver).
-- Both are counted in application code from the attached rows; there's no
-- denormalised counter to drift.
--
-- Idempotent throughout — migrations auto-apply to production on push.

-- -----------------------------------------------------------------------------
-- payment_plans
-- -----------------------------------------------------------------------------
create table if not exists public.payment_plans (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.students (id) on delete cascade,
  -- Who paid. Nullable: plans are often entered by an admin before the parent
  -- account is linked, and the student is the thing being taught either way.
  payer_id           uuid references public.profiles (id) on delete set null,

  sessions_total     smallint not null check (sessions_total between 1 and 200),
  rate_per_session   numeric(14,2) not null check (rate_per_session >= 0),
  -- List price before discounts/add-ons. Generated, so it can never disagree
  -- with the two columns it's derived from.
  subtotal_ngn       numeric(14,2)
                       generated always as (sessions_total * rate_per_session) stored,
  -- subtotal + the sum of this plan's adjustments. Maintained by trigger below.
  total_ngn          numeric(14,2) not null default 0,

  reference_code     text not null unique,
  status             text not null default 'unpaid'
                       check (status in ('unpaid', 'paid', 'void')),
  paid_at            timestamptz,
  payment_reference  text,

  -- Parent-uploaded proof of transfer (R2 object key), pending admin review.
  proof_key          text,
  proof_uploaded_at  timestamptz,
  receipt_sent_at    timestamptz,

  notes              text,
  created_by         uuid references public.profiles (id) on delete set null,
  verified_by        uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now()
);

create index if not exists payment_plans_student_idx
  on public.payment_plans (student_id, created_at desc);
create index if not exists payment_plans_status_idx
  on public.payment_plans (status);

-- -----------------------------------------------------------------------------
-- payment_plan_adjustments — discounts and add-ons, one row per receipt line
-- -----------------------------------------------------------------------------
-- `amount_ngn` is signed: negative is a discount, positive an add-on. Labels
-- come from a fixed list in the app (lib/payments/adjustments.ts) rather than a
-- CHECK constraint, so adding a discount type is a deploy and not a migration.
create table if not exists public.payment_plan_adjustments (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.payment_plans (id) on delete cascade,
  label       text not null,
  amount_ngn  numeric(14,2) not null,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists payment_plan_adjustments_plan_idx
  on public.payment_plan_adjustments (plan_id, sort_order);

-- -----------------------------------------------------------------------------
-- total_ngn maintenance
-- -----------------------------------------------------------------------------
-- Kept exact by triggers rather than recomputed at read time, so every reader
-- (admin list, receipt email, parent card, CSV export) sees one number that
-- provably equals its line items.
--
-- The BEFORE trigger on payment_plans is scoped to the two columns the subtotal
-- derives from. Since the adjustments trigger only ever writes `total_ngn`, it
-- can't re-fire this one — no recursion.
create or replace function public.payment_plan_set_total()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.total_ngn := (new.sessions_total * new.rate_per_session)
    + coalesce(
        (select sum(a.amount_ngn)
           from public.payment_plan_adjustments a
          where a.plan_id = new.id),
        0
      );
  return new;
end;
$$;

drop trigger if exists payment_plans_set_total on public.payment_plans;
create trigger payment_plans_set_total
  before insert or update of sessions_total, rate_per_session
  on public.payment_plans
  for each row execute function public.payment_plan_set_total();

-- NEW is unassigned in a DELETE trigger and OLD is unassigned in an INSERT
-- trigger, so both are read only where they exist — touching the wrong one
-- raises "record is not assigned yet" rather than returning null. An UPDATE
-- that moves an adjustment between plans has to settle both sides, hence the
-- pair of ids rather than one.
create or replace function public.payment_plan_recalc_from_adjustment()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_new uuid;
  v_old uuid;
begin
  if (tg_op <> 'DELETE') then
    v_new := new.plan_id;
  end if;
  if (tg_op <> 'INSERT') then
    v_old := old.plan_id;
  end if;

  update public.payment_plans p
     set total_ngn = p.subtotal_ngn + coalesce(
           (select sum(a.amount_ngn)
              from public.payment_plan_adjustments a
             where a.plan_id = p.id),
           0
         )
   where p.id in (v_new, v_old);

  return null;
end;
$$;

drop trigger if exists payment_plan_adjustments_recalc
  on public.payment_plan_adjustments;
create trigger payment_plan_adjustments_recalc
  after insert or update or delete
  on public.payment_plan_adjustments
  for each row execute function public.payment_plan_recalc_from_adjustment();

-- -----------------------------------------------------------------------------
-- sessions → plan link
-- -----------------------------------------------------------------------------
-- Nullable, and ON DELETE SET NULL: voiding a plan must never cascade away the
-- teaching history it paid for. A null link means "unfunded" — legacy sessions
-- scheduled before plans existed, or a deliberate override (makeup lessons,
-- goodwill sessions), both of which the admin list surfaces.
alter table public.sessions
  add column if not exists payment_plan_id uuid
    references public.payment_plans (id) on delete set null;

create index if not exists sessions_payment_plan_idx
  on public.sessions (payment_plan_id);

-- -----------------------------------------------------------------------------
-- reference_code generator — 'MAS-00042-01'
-- -----------------------------------------------------------------------------
-- Parents quote this on the transfer, which is what makes reconciliation a
-- lookup instead of name-matching guesswork. Sequence is per student, so a
-- family's second plan reads -02.
create or replace function public.next_plan_reference(p_student_id uuid)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_reg  text;
  v_tail text;
  v_n    int;
  v_code text;
begin
  select registration_number into v_reg
    from public.students where id = p_student_id;
  if v_reg is null then
    raise exception 'student not found' using errcode = '23503';
  end if;

  -- 'EC-2026-00042' -> '00042'. Falls back to the whole value if the format
  -- ever changes, so this can't start emitting empty references.
  v_tail := coalesce(nullif(split_part(v_reg, '-', 3), ''), v_reg);

  select count(*) into v_n
    from public.payment_plans where student_id = p_student_id;

  -- Loop past collisions rather than trusting the count — a voided-and-replaced
  -- plan or a concurrent insert would otherwise trip the unique index.
  loop
    v_n := v_n + 1;
    v_code := format('MAS-%s-%s', v_tail, to_char(v_n, 'FM00'));
    exit when not exists (
      select 1 from public.payment_plans where reference_code = v_code
    );
  end loop;

  return v_code;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS
--   • payment_plans / adjustments: admin full control; a linked parent may read
--     their own child's plans (drives the parent payment card and receipt
--     breakdown) but never write — money state is admin-owned.
--   • Parents attach proof of payment through the RPC below, not a direct
--     UPDATE, so they can't touch status, amounts, or anyone else's plan.
-- -----------------------------------------------------------------------------
alter table public.payment_plans            enable row level security;
alter table public.payment_plan_adjustments enable row level security;

drop policy if exists payment_plans_read on public.payment_plans;
create policy payment_plans_read
  on public.payment_plans for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id = payment_plans.student_id
        and ps.parent_id = auth.uid()
    )
  );

drop policy if exists payment_plans_admin_write on public.payment_plans;
create policy payment_plans_admin_write
  on public.payment_plans for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists payment_plan_adjustments_read on public.payment_plan_adjustments;
create policy payment_plan_adjustments_read
  on public.payment_plan_adjustments for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
        from public.payment_plans p
        join public.parent_students ps on ps.student_id = p.student_id
       where p.id = payment_plan_adjustments.plan_id
         and ps.parent_id = auth.uid()
    )
  );

drop policy if exists payment_plan_adjustments_admin_write
  on public.payment_plan_adjustments;
create policy payment_plan_adjustments_admin_write
  on public.payment_plan_adjustments for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- attach_payment_proof — parent uploads their transfer receipt
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER with an explicit caller check, so proof upload doesn't
-- require opening payment_plans to parent writes. Writes only the proof
-- columns: marking a plan paid stays an admin decision after they've seen the
-- money land.
create or replace function public.attach_payment_proof(
  p_plan_id uuid,
  p_key     text
) returns public.payment_plans
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan public.payment_plans;
begin
  if not (
    public.is_admin(auth.uid())
    or exists (
      select 1
        from public.payment_plans p
        join public.parent_students ps on ps.student_id = p.student_id
       where p.id = p_plan_id and ps.parent_id = auth.uid()
    )
  ) then
    raise exception 'not authorized to update this plan' using errcode = '42501';
  end if;

  update public.payment_plans
     set proof_key = p_key,
         proof_uploaded_at = now()
   where id = p_plan_id
  returning * into v_plan;

  return v_plan;
end;
$$;

revoke all on function public.attach_payment_proof(uuid, text) from public;
grant execute on function public.attach_payment_proof(uuid, text) to authenticated;
