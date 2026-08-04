import type { createClient } from "@/lib/supabase/server";
import {
  planToChargeFor,
  remainingToSchedule,
  tallyPlanUsage,
  usageFor,
  type PlanRow,
} from "@/lib/payments/plans";

type Client = Awaited<ReturnType<typeof createClient>>;

export type ChargeableePlan = {
  id: string;
  referenceCode: string;
  /** Credits still free on this plan, before the booking being made. */
  remaining: number;
};

/**
 * Finds the plan a new session for `studentId` should be charged to: the oldest
 * paid plan with a credit still free.
 *
 * Returns null when the student has no payable runway — no plan, an unpaid one,
 * or every credit already committed. Callers treat that as a warning rather
 * than a hard stop: the session is still created, just unfunded, so backfill,
 * makeup lessons and goodwill sessions stay possible. The admin sees the
 * warning and the session shows as unfunded until a plan is attached.
 */
export async function resolveChargeablePlan(
  supabase: Client,
  studentId: string,
): Promise<ChargeableePlan | null> {
  const [{ data: planRows }, { data: sessionRows }] = await Promise.all([
    supabase
      .from("payment_plans")
      .select("id, student_id, sessions_total, status, reference_code, created_at")
      .eq("student_id", studentId)
      .eq("status", "paid"),
    supabase
      .from("sessions")
      .select("payment_plan_id, status")
      .eq("student_id", studentId)
      .not("payment_plan_id", "is", null),
  ]);

  const plans = (planRows ?? []) as unknown as Array<
    PlanRow & { reference_code: string; created_at: string }
  >;
  if (plans.length === 0) return null;

  const usage = tallyPlanUsage(
    (sessionRows ?? []) as Array<{ payment_plan_id: string | null; status: string }>,
  );
  const createdAt = new Map(plans.map((p) => [p.id, p.created_at]));

  const chosen = planToChargeFor(plans, usage, createdAt);
  if (!chosen) return null;

  const match = plans.find((p) => p.id === chosen.id)!;
  return {
    id: chosen.id,
    referenceCode: match.reference_code,
    remaining: remainingToSchedule(chosen, usageFor(chosen.id, usage)),
  };
}
