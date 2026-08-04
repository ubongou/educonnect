import { createServiceRoleClient } from "@/lib/supabase/server";
import { defaultGlobals } from "@/lib/marketing/defaults";
import { getAppUrl, getFromAddress, getReplyToAddress, getResend } from "./client";
import {
  renderPaymentReceiptEmail,
  renderPlanExhaustedEmail,
  renderRenewalReminderEmail,
  type PlanEmailBase,
} from "./templates/payments";

export type SendPaymentEmailResult =
  | { ok: true; recipients: string[]; skipped: false }
  | { ok: true; recipients: string[]; skipped: true; reason: string }
  | { ok: false; error: string };

type PlanWithStudent = {
  id: string;
  student_id: string;
  reference_code: string;
  sessions_total: number;
  rate_per_session: number;
  total_ngn: number;
  students: { full_name: string; preferred_name: string | null } | null;
  adjustments: Array<{ label: string; amount_ngn: number; sort_order: number }>;
};

/**
 * Loads everything the payment emails need for a plan. Service-role: the
 * reminder sweep is triggered by a teacher filing a report, and a teacher has
 * no business reading plan data — nothing here is returned to the caller, it
 * only shapes an email to the parent.
 */
async function loadPlan(
  supabase: ReturnType<typeof createServiceRoleClient>,
  planId: string,
): Promise<PlanWithStudent | null> {
  const { data } = await supabase
    .from("payment_plans")
    .select(
      `
      id, student_id, reference_code, sessions_total, rate_per_session, total_ngn,
      students ( full_name, preferred_name ),
      adjustments:payment_plan_adjustments ( label, amount_ngn, sort_order )
      `,
    )
    .eq("id", planId)
    .maybeSingle();

  return (data as unknown as PlanWithStudent) ?? null;
}

type Recipient = { email: string; fullName: string | null };

/** Every linked parent with an email on file. */
async function loadParents(
  supabase: ReturnType<typeof createServiceRoleClient>,
  studentId: string,
): Promise<Recipient[]> {
  const { data } = await supabase
    .from("parent_students")
    .select(
      `parent:profiles!parent_students_parent_id_fkey ( id, full_name, email )`,
    )
    .eq("student_id", studentId);

  type Row = {
    parent: { id: string; full_name: string | null; email: string | null } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((r) => r.parent)
    .filter((p): p is NonNullable<Row["parent"]> => Boolean(p?.email))
    .map((p) => ({ email: p.email!, fullName: p.full_name }));
}

function baseData(plan: PlanWithStudent, recipient: Recipient): PlanEmailBase {
  const studentName =
    plan.students?.preferred_name?.trim() ||
    plan.students?.full_name ||
    "your child";

  return {
    parentFirstName: recipient.fullName?.split(/\s+/)[0] ?? null,
    studentName,
    referenceCode: plan.reference_code,
    sessionsTotal: plan.sessions_total,
    ratePerSession: Number(plan.rate_per_session),
    lines: [...plan.adjustments]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((a) => ({ label: a.label, amount: Number(a.amount_ngn) })),
    total: Number(plan.total_ngn),
    dashboardUrl: `${getAppUrl().replace(/\/$/, "")}/dashboard`,
  };
}

type Kind = "receipt" | "renewal_due" | "plan_exhausted";

/**
 * Sends one of the payment emails to every linked parent, with the admin CC'd
 * on each so the team sees exactly what the parent saw.
 *
 * Sends are per-recipient (each parent gets their own first name), and a
 * partial failure is reported as success with the addresses that did go out —
 * one bad address must not suppress the rest.
 */
async function sendToParents(
  planId: string,
  kind: Kind,
  extra?: { sessionsDelivered: number; nextSessionDate: string | null },
): Promise<SendPaymentEmailResult> {
  const supabase = createServiceRoleClient();

  const plan = await loadPlan(supabase, planId);
  if (!plan) return { ok: false, error: "Plan not found" };

  const recipients = await loadParents(supabase, plan.student_id);
  if (recipients.length === 0) {
    return {
      ok: true,
      recipients: [],
      skipped: true,
      reason: "No parent emails on file for this student",
    };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: true,
      recipients: recipients.map((r) => r.email),
      skipped: true,
      reason: "RESEND_API_KEY not set",
    };
  }

  const adminEmail = defaultGlobals.adminEmail;
  let firstError: string | null = null;
  const sentTo: string[] = [];

  for (const r of recipients) {
    const base = baseData(plan, r);
    const rendered =
      kind === "receipt"
        ? renderPaymentReceiptEmail(base)
        : kind === "renewal_due"
          ? renderRenewalReminderEmail({
              ...base,
              sessionsDelivered: extra?.sessionsDelivered ?? 0,
              nextSessionDate: extra?.nextSessionDate ?? null,
            })
          : renderPlanExhaustedEmail(base);

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      replyTo: getReplyToAddress(),
      to: r.email,
      cc: adminEmail ? [adminEmail] : undefined,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (error) {
      firstError ??= error.message ?? "Resend send failed";
      continue;
    }
    sentTo.push(r.email);
  }

  if (sentTo.length === 0) {
    return { ok: false, error: firstError ?? "All sends failed" };
  }

  return { ok: true, recipients: sentTo, skipped: false };
}

/**
 * Receipt for a plan that was just marked paid. Idempotent on
 * `receipt_sent_at`, so a double-click on "Mark paid" can't send two receipts.
 */
export async function sendPaymentReceiptEmail(
  planId: string,
): Promise<SendPaymentEmailResult> {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("payment_plans")
    .select("receipt_sent_at")
    .eq("id", planId)
    .maybeSingle();

  if ((existing as { receipt_sent_at: string | null } | null)?.receipt_sent_at) {
    return { ok: true, recipients: [], skipped: true, reason: "Receipt already sent" };
  }

  const res = await sendToParents(planId, "receipt");
  if (res.ok && !res.skipped) {
    await supabase
      .from("payment_plans")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("id", planId);
  }
  return res;
}

/**
 * Renewal or exhausted nudge. Idempotency lives in `payment_reminders`, whose
 * unique (plan_id, kind) index means the row insert is what actually prevents a
 * repeat — the caller inserts it after a successful send.
 */
export async function sendPaymentReminderEmail(
  planId: string,
  kind: "renewal_due" | "plan_exhausted",
  extra?: { sessionsDelivered: number; nextSessionDate: string | null },
): Promise<SendPaymentEmailResult> {
  return sendToParents(planId, kind, extra);
}
