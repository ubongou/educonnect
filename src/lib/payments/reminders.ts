import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { sendPaymentReminderEmail } from "@/lib/email/sendPaymentEmails";
import {
  isExhausted,
  needsRenewalReminder,
  tallyPlanUsage,
  usageFor,
  type PlanRow,
} from "@/lib/payments/plans";

export type ReminderKind = "renewal_due" | "plan_exhausted";

export type ReminderOutcome = {
  planId: string;
  referenceCode: string;
  kind: ReminderKind;
  sent: boolean;
  reason?: string;
};

export type SweepResult = {
  considered: number;
  sent: ReminderOutcome[];
};

type PlanRecord = PlanRow & { reference_code: string };

/**
 * Decides which plans are due a nudge and sends them.
 *
 * Reminders are event-driven: this runs immediately after a lesson report is
 * filed (see `submitLessonReport`), because filing the report is what marks a
 * session delivered and can therefore drop a plan to its last session. Scoping
 * to `studentId` keeps that call cheap — only the child whose report just
 * landed is re-evaluated. Called with no scope it sweeps everyone, which is
 * what the admin's "Send reminders now" button does as a safety net.
 *
 * Idempotency is owned by `payment_reminders`: a unique (plan_id, kind) index
 * means a plan can only ever be nudged once per reason, however many times it
 * is re-evaluated. The row is inserted *after* a successful send, so a Resend
 * outage leaves the nudge pending rather than silently marking it delivered.
 *
 * The cadence deliberately stops at 'plan_exhausted' — two emails, then we
 * leave the parent alone.
 */
export async function runReminderSweep(
  opts: { studentId?: string } = {},
): Promise<SweepResult> {
  const supabase = createServiceRoleClient();
  const { studentId } = opts;

  // Every read here feeds a counter, so all three page past PostgREST's
  // max-rows cap — a sweep that silently saw only the first 1000 sessions would
  // nudge the wrong parents.
  const [planResult, sessionResult, sentResult] = await Promise.all([
    fetchAllRows<{
      id: string;
      student_id: string;
      sessions_total: number;
      status: string;
      reference_code: string;
    }>((from, to) => {
      let q = supabase
        .from("payment_plans")
        .select("id, student_id, sessions_total, status, reference_code")
        .eq("status", "paid");
      if (studentId) q = q.eq("student_id", studentId);
      return q.order("id").range(from, to);
    }),
    fetchAllRows<{
      payment_plan_id: string | null;
      status: string;
      session_date: string;
    }>((from, to) => {
      let q = supabase
        .from("sessions")
        .select("payment_plan_id, status, session_date")
        .not("payment_plan_id", "is", null);
      if (studentId) q = q.eq("student_id", studentId);
      return q.order("id").range(from, to);
    }),
    fetchAllRows<{ plan_id: string; kind: string }>((from, to) =>
      supabase.from("payment_reminders").select("plan_id, kind").order("id").range(from, to),
    ),
  ]);

  // `status` comes back as plain text from the generated types; the CHECK
  // constraint plus the .eq('paid') filter above guarantee the narrower union.
  const plans = planResult.rows as unknown as PlanRecord[];
  const sessions = sessionResult.rows;

  const usage = tallyPlanUsage(sessions);

  // If the sent-log read failed we can't tell what's already gone out, so bail
  // rather than risk re-nudging every parent on the platform.
  if (sentResult.error) {
    throw new Error(`Couldn't read the reminder log: ${sentResult.error}`);
  }
  const alreadySent = new Set(
    sentResult.rows.map((r) => `${r.plan_id}:${r.kind}`),
  );

  // The last session still owed on each plan, for the reminder's "final session
  // is on…" line.
  const today = new Date().toISOString().slice(0, 10);
  const nextByPlan = new Map<string, string>();
  for (const s of sessions) {
    if (!s.payment_plan_id) continue;
    if (s.status !== "scheduled" || s.session_date < today) continue;
    const current = nextByPlan.get(s.payment_plan_id);
    if (!current || s.session_date < current) {
      nextByPlan.set(s.payment_plan_id, s.session_date);
    }
  }

  const sent: ReminderOutcome[] = [];

  for (const plan of plans) {
    const u = usageFor(plan.id, usage);

    const kind: ReminderKind | null = needsRenewalReminder(plan, u)
      ? "renewal_due"
      : isExhausted(plan, u)
        ? "plan_exhausted"
        : null;

    if (!kind) continue;
    if (alreadySent.has(`${plan.id}:${kind}`)) continue;

    const res = await sendPaymentReminderEmail(plan.id, kind, {
      sessionsDelivered: u.delivered,
      nextSessionDate: nextByPlan.get(plan.id) ?? null,
    });

    if (!res.ok) {
      sent.push({
        planId: plan.id,
        referenceCode: plan.reference_code,
        kind,
        sent: false,
        reason: res.error,
      });
      continue;
    }

    if (res.skipped) {
      // Nothing went out (no parent email, or Resend unconfigured). Don't
      // record it — otherwise the nudge is lost forever once the gap is fixed.
      sent.push({
        planId: plan.id,
        referenceCode: plan.reference_code,
        kind,
        sent: false,
        reason: res.reason,
      });
      continue;
    }

    const { error: logErr } = await supabase.from("payment_reminders").insert({
      plan_id: plan.id,
      kind,
      recipients: res.recipients,
    });

    sent.push({
      planId: plan.id,
      referenceCode: plan.reference_code,
      kind,
      sent: true,
      reason: logErr ? `sent, but logging failed: ${logErr.message}` : undefined,
    });
  }

  return { considered: plans.length, sent };
}
