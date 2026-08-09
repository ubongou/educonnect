import type { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import {
  studentPaymentStatus,
  tallyPlanUsage,
  type PlanRow,
  type StudentPaymentStatus,
} from "@/lib/payments/plans";

type Client = Awaited<ReturnType<typeof createClient>>;

export type AttentionStudent = {
  id: string;
  name: string;
  status: StudentPaymentStatus;
};

export type PaymentOverview = {
  counts: Record<StudentPaymentStatus, number>;
  receivedThisMonth: number;
  /** Unpaid students first, then expiring — capped, for a dashboard tile. */
  attention: AttentionStudent[];
  attentionTotal: number;
};

/**
 * The same student-payment-status aggregation the payments page runs, shared
 * with the admin overview so "who needs chasing" is one number computed one
 * way, not two dashboards that can quietly disagree.
 *
 * Archived (hidden) plans are excluded — a mistaken entry taken off the
 * payments list must not still count as runway just because it's out of
 * sight. Mirrors the same exclusion on the payments page itself.
 */
export async function loadPaymentOverview(supabase: Client): Promise<PaymentOverview> {
  const [{ data: planRows }, sessionResult, { data: studentRows }] = await Promise.all([
    supabase
      .from("payment_plans")
      .select("id, student_id, sessions_total, status, paid_at, total_ngn")
      .is("archived_at", null),
    // Aggregated counters need every row, past PostgREST's max-rows cap.
    fetchAllRows<{ payment_plan_id: string | null; status: string }>((from, to) =>
      supabase
        .from("sessions")
        .select("payment_plan_id, status")
        .order("id")
        .range(from, to),
    ),
    supabase
      .from("students")
      .select("id, full_name, preferred_name")
      .is("archived_at", null)
      .eq("is_test", false)
      .order("full_name"),
  ]);

  const plans = (planRows ?? []) as unknown as Array<
    PlanRow & { paid_at: string | null; total_ngn: number }
  >;
  const usage = tallyPlanUsage(sessionResult.rows);

  const plansByStudent = new Map<string, PlanRow[]>();
  for (const p of plans) {
    const list = plansByStudent.get(p.student_id) ?? [];
    list.push(p);
    plansByStudent.set(p.student_id, list);
  }

  const students = (studentRows ?? []) as Array<{
    id: string;
    full_name: string;
    preferred_name: string | null;
  }>;

  const counts: Record<StudentPaymentStatus, number> = { paid: 0, expiring: 0, unpaid: 0 };
  const attention: AttentionStudent[] = [];

  for (const s of students) {
    const status = studentPaymentStatus(plansByStudent.get(s.id) ?? [], usage);
    counts[status] += 1;
    if (status !== "paid") {
      attention.push({ id: s.id, name: s.preferred_name ?? s.full_name, status });
    }
  }

  // Unpaid (no runway at all) reads as more urgent than merely expiring.
  attention.sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === "unpaid" ? -1 : 1;
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const receivedThisMonth = plans
    .filter((p) => p.status === "paid" && p.paid_at && p.paid_at.slice(0, 7) === thisMonth)
    .reduce((sum, p) => sum + Number(p.total_ngn), 0);

  return {
    counts,
    receivedThisMonth,
    attention: attention.slice(0, 8),
    attentionTotal: attention.length,
  };
}
