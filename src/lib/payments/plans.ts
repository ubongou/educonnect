/**
 * Plan arithmetic and status derivation.
 *
 * Nothing here touches Supabase or React — the payments admin page can't be
 * exercised locally (no Supabase credentials), so the rules that actually
 * matter live in pure functions with tests around them.
 */

/** Sessions still to deliver at which we ask the parent to renew. */
export const RENEWAL_THRESHOLD = 1;

export type PlanStatus = "unpaid" | "paid" | "void";

/** The three-way state shown against a student on the payments list. */
export type StudentPaymentStatus = "paid" | "expiring" | "unpaid";

export type PlanRow = {
  id: string;
  student_id: string;
  sessions_total: number;
  status: PlanStatus;
};

/** Only the session fields the counters care about. */
export type AttachedSession = {
  payment_plan_id: string | null;
  status: string;
};

export type PlanUsage = {
  /**
   * Attached sessions that aren't cancelled — what the plan's credits are
   * currently committed to. Cancelling releases a credit, so a cancelled lesson
   * can be rebooked rather than lost.
   */
  scheduled: number;
  /** Attached sessions actually taught — a no-show does not count. */
  delivered: number;
};

const DELIVERED_STATUSES = new Set(["completed"]);

/** Tallies usage per plan id from a flat list of sessions. */
export function tallyPlanUsage(
  sessions: readonly AttachedSession[],
): Map<string, PlanUsage> {
  const out = new Map<string, PlanUsage>();
  for (const s of sessions) {
    if (!s.payment_plan_id) continue;
    const u = out.get(s.payment_plan_id) ?? { scheduled: 0, delivered: 0 };
    if (s.status !== "cancelled") u.scheduled += 1;
    if (DELIVERED_STATUSES.has(s.status)) u.delivered += 1;
    out.set(s.payment_plan_id, u);
  }
  return out;
}

export function usageFor(
  planId: string,
  usage: Map<string, PlanUsage>,
): PlanUsage {
  return usage.get(planId) ?? { scheduled: 0, delivered: 0 };
}

/**
 * Credits left to book against. Never negative — an admin who overrode the
 * warning and overbooked a plan should read 0 remaining, not -2.
 */
export function remainingToSchedule(plan: PlanRow, usage: PlanUsage): number {
  return Math.max(0, plan.sessions_total - usage.scheduled);
}

/** Sessions left to teach. Drives the renewal reminder. */
export function remainingToDeliver(plan: PlanRow, usage: PlanUsage): number {
  return Math.max(0, plan.sessions_total - usage.delivered);
}

/** A paid plan with teaching still owed on it. */
export function isActivePlan(plan: PlanRow, usage: PlanUsage): boolean {
  return plan.status === "paid" && remainingToDeliver(plan, usage) > 0;
}

/**
 * A student's payment status, aggregated across every live plan they hold.
 *
 * Aggregating matters when a parent tops up before the current block runs out:
 * two paid plans with one session left each is four sessions of runway, not an
 * "expiring" panic. Void plans are ignored entirely; unpaid ones don't count as
 * runway, because we don't teach ahead of payment.
 *
 *   paid      — a paid plan with 2+ sessions still to deliver
 *   expiring  — paid, but only RENEWAL_THRESHOLD sessions left: renew now
 *   unpaid    — no paid plan with anything left. Covers the student who has no
 *               plan at all, one whose transfer hasn't landed, and one whose
 *               block is fully delivered. All three mean "don't schedule".
 */
export function studentPaymentStatus(
  plans: readonly PlanRow[],
  usage: Map<string, PlanUsage>,
): StudentPaymentStatus {
  let remaining = 0;
  let hasActive = false;

  for (const p of plans) {
    if (p.status !== "paid") continue;
    const left = remainingToDeliver(p, usageFor(p.id, usage));
    if (left > 0) {
      hasActive = true;
      remaining += left;
    }
  }

  if (!hasActive) return "unpaid";
  return remaining <= RENEWAL_THRESHOLD ? "expiring" : "paid";
}

/**
 * Whether a plan has just crossed into renewal territory — a paid plan with
 * exactly the threshold left to deliver. This is the moment right after the
 * second-to-last session is marked completed or no-show.
 */
export function needsRenewalReminder(plan: PlanRow, usage: PlanUsage): boolean {
  if (plan.status !== "paid") return false;
  const left = remainingToDeliver(plan, usage);
  return left > 0 && left <= RENEWAL_THRESHOLD;
}

/** A paid plan with every session delivered — the follow-up nudge case. */
export function isExhausted(plan: PlanRow, usage: PlanUsage): boolean {
  return plan.status === "paid" && remainingToDeliver(plan, usage) === 0;
}

/**
 * The plan a newly scheduled session should attach to: the oldest paid plan
 * that still has a credit free. Oldest-first so a family's blocks are consumed
 * in the order they were bought.
 *
 * Returns null when nothing is payable — the caller warns and lets the admin
 * override, leaving the session unfunded rather than silently overbooking a
 * plan the parent hasn't paid for.
 */
export function planToChargeFor(
  plans: readonly PlanRow[],
  usage: Map<string, PlanUsage>,
  createdAtById: Map<string, string>,
): PlanRow | null {
  const candidates = plans
    .filter(
      (p) => p.status === "paid" && remainingToSchedule(p, usageFor(p.id, usage)) > 0,
    )
    .sort((a, b) =>
      (createdAtById.get(a.id) ?? "").localeCompare(createdAtById.get(b.id) ?? ""),
    );
  return candidates[0] ?? null;
}

/**
 * Plan total from its parts. The database keeps `total_ngn` in step via
 * trigger; this mirrors the same sum for previews in the new-plan form, before
 * anything is written.
 */
export function planTotal(
  sessionsTotal: number,
  ratePerSession: number,
  adjustments: readonly { amount_ngn: number }[],
): number {
  const subtotal = sessionsTotal * ratePerSession;
  const adjusted = adjustments.reduce((sum, a) => sum + a.amount_ngn, 0);
  return Math.round((subtotal + adjusted) * 100) / 100;
}

/**
 * Naira for display. Whole amounts drop the decimals — plan prices are round
 * numbers, and "₦440,000.00" is just noise on a receipt.
 */
export function formatNaira(amount: number): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}
