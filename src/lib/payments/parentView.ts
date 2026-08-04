import type { createClient } from "@/lib/supabase/server";
import type { ParentPlanView } from "@/components/dashboard/PaymentCard";
import {
  remainingToDeliver,
  tallyPlanUsage,
  usageFor,
  type PlanRow,
} from "@/lib/payments/plans";

type Client = Awaited<ReturnType<typeof createClient>>;

type PlanRecord = PlanRow & {
  reference_code: string;
  rate_per_session: number;
  total_ngn: number;
  proof_key: string | null;
  created_at: string;
  adjustments: Array<{ label: string; amount_ngn: number; sort_order: number }>;
};

/**
 * The one plan worth showing a parent for a child, plus its progress.
 *
 * Preference order, and why:
 *   1. a paid plan with sessions still to deliver — the block they're on;
 *   2. otherwise the newest unpaid plan — the thing they owe us;
 *   3. otherwise nothing.
 * A parent with a finished block and a fresh invoice should see the invoice,
 * not a completed plan telling them everything's fine.
 *
 * Reads through the caller's client, so RLS scopes it to their own children.
 */
export async function loadParentPlanView(
  supabase: Client,
  studentId: string,
): Promise<ParentPlanView | null> {
  const [{ data: planRows }, { data: sessionRows }] = await Promise.all([
    supabase
      .from("payment_plans")
      .select(
        `
        id, student_id, sessions_total, status, reference_code, rate_per_session,
        total_ngn, proof_key, created_at,
        adjustments:payment_plan_adjustments ( label, amount_ngn, sort_order )
        `,
      )
      .eq("student_id", studentId)
      .neq("status", "void")
      .order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("payment_plan_id, status")
      .eq("student_id", studentId)
      .not("payment_plan_id", "is", null),
  ]);

  const plans = (planRows ?? []) as unknown as PlanRecord[];
  if (plans.length === 0) return null;

  const usage = tallyPlanUsage(
    (sessionRows ?? []) as Array<{ payment_plan_id: string | null; status: string }>,
  );

  // `plans` is newest-first, so the oldest still-running paid block is the last
  // match — that's the one being taught right now.
  const activePaid = plans
    .filter(
      (p) => p.status === "paid" && remainingToDeliver(p, usageFor(p.id, usage)) > 0,
    )
    .at(-1);

  const chosen = activePaid ?? plans.find((p) => p.status === "unpaid") ?? null;
  if (!chosen) return null;

  const u = usageFor(chosen.id, usage);

  return {
    id: chosen.id,
    referenceCode: chosen.reference_code,
    status: chosen.status as ParentPlanView["status"],
    sessionsTotal: chosen.sessions_total,
    sessionsDelivered: u.delivered,
    ratePerSession: Number(chosen.rate_per_session),
    total: Number(chosen.total_ngn),
    lines: [...chosen.adjustments]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((a) => ({ label: a.label, amount: Number(a.amount_ngn) })),
    hasProof: chosen.proof_key !== null,
  };
}
