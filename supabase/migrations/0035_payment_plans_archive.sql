-- Let admins hide a mistaken payment plan from the payments list without
-- voiding it. Void is a financial state (the plan stops counting as paid
-- runway); archiving is purely cosmetic — a plan entered twice, or against
-- the wrong child, that should stop cluttering the list but keep its
-- reference code and history intact and reversible.
--
-- Idempotent throughout — migrations auto-apply to production on push.

alter table public.payment_plans
  add column if not exists archived_at timestamptz;
