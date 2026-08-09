"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import {
  sendPaymentReceiptEmail,
  sendPaymentReminderEmail,
} from "@/lib/email/sendPaymentEmails";
import { runReminderSweep } from "@/lib/payments/reminders";
import {
  ADJUSTMENT_OPTIONS,
  adjustmentOption,
  resolveAdjustmentAmount,
  type AdjustmentMode,
} from "@/lib/payments/adjustments";
import {
  remainingToDeliver,
  tallyPlanUsage,
  usageFor,
  type PlanRow,
} from "@/lib/payments/plans";

export type PaymentResult = { ok: true } | { ok: false; error: string };
export type PlanCreateResult =
  | { ok: true; planId: string; referenceCode: string; attached: number }
  | { ok: false; error: string };

const adjustmentInput = z.object({
  option_id: z.string().refine((v) => ADJUSTMENT_OPTIONS.some((o) => o.id === v), {
    message: "Unknown adjustment type.",
  }),
  mode: z.enum(["naira", "percent"]),
  value: z.coerce.number().min(0, "Adjustment can't be negative."),
});

const planCreateSchema = z.object({
  student_id: z.string().uuid(),
  payer_id: z.string().uuid().nullable().optional(),
  sessions_total: z.coerce.number().int().min(1).max(200),
  // Ceiling chosen so the worst case (200 × rate) stays well inside the
  // numeric(14,2) columns rather than failing at insert time.
  rate_per_session: z.coerce.number().min(0).max(10_000_000),
  notes: z.string().max(2000).optional(),
  adjustments: z.array(adjustmentInput).max(20).optional(),
  /**
   * Sweep this student's existing unfunded sessions onto the new plan. This is
   * how legacy students get onto plans — the same form future parents use, with
   * one box ticked.
   */
  attach_existing: z.boolean().optional(),
});

function revalidatePayments(studentId?: string) {
  revalidatePath("/admin/payments");
  revalidatePath("/admin/sessions");
  revalidatePath("/dashboard");
  if (studentId) revalidatePath(`/admin/students/${studentId}`);
}

/**
 * Admin issues a plan. Created 'unpaid' — it becomes payable runway only once
 * the transfer lands and an admin marks it paid, because we don't teach ahead
 * of payment.
 *
 * The reference code is generated database-side (`next_plan_reference`), which
 * owns the per-student sequence and the collision loop.
 */
export async function createPaymentPlan(input: unknown): Promise<PlanCreateResult> {
  await requireAdmin();

  const parsed = planCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { data: reference, error: refErr } = await supabase.rpc(
    "next_plan_reference",
    { p_student_id: data.student_id },
  );
  if (refErr || !reference) {
    return { ok: false, error: refErr?.message ?? "Couldn't generate a reference code." };
  }

  const { data: plan, error: planErr } = await supabase
    .from("payment_plans")
    .insert({
      student_id: data.student_id,
      payer_id: data.payer_id ?? null,
      sessions_total: data.sessions_total,
      rate_per_session: data.rate_per_session,
      reference_code: reference as string,
      notes: data.notes?.trim() || null,
    })
    .select("id, reference_code, subtotal_ngn")
    .single();

  if (planErr || !plan) {
    return { ok: false, error: planErr?.message ?? "Couldn't create the plan." };
  }

  // Percentages resolve against the subtotal the database just computed, so
  // the stored amounts always agree with the row they hang off.
  const subtotal = Number(plan.subtotal_ngn);
  const rows = (data.adjustments ?? []).flatMap((a, i) => {
    const option = adjustmentOption(a.option_id);
    if (!option) return [];
    return [
      {
        plan_id: plan.id,
        label: option.label,
        amount_ngn: resolveAdjustmentAmount({
          kind: option.kind,
          mode: a.mode as AdjustmentMode,
          value: a.value,
          subtotalNgn: subtotal,
        }),
        sort_order: i,
      },
    ];
  });

  if (rows.length > 0) {
    const { error: adjErr } = await supabase
      .from("payment_plan_adjustments")
      .insert(rows);
    if (adjErr) {
      // Don't leave a plan priced at list when the admin asked for a discount.
      await supabase.from("payment_plans").delete().eq("id", plan.id);
      return { ok: false, error: adjErr.message };
    }
  }

  let attached = 0;
  if (data.attach_existing) {
    const res = await attachUnfundedSessions(data.student_id, plan.id, data.sessions_total);
    if (!res.ok) return res;
    attached = res.attached;
  }

  revalidatePayments(data.student_id);
  return {
    ok: true,
    planId: plan.id,
    referenceCode: plan.reference_code,
    attached,
  };
}

/**
 * Links a student's plan-less sessions to a plan, nearest-to-today first, up
 * to the plan's capacity. Used by the "attach existing sessions" box on plan
 * creation and by the manual attach action.
 *
 * Deliberately not oldest-first: a plan created today for a student who has
 * been on the platform for months has a backlog of ancient unfunded sessions
 * — ones nobody intends to retroactively bill for. Oldest-first would spend
 * the whole capacity on that backlog and leave the session actually due
 * tomorrow still unfunded. Nearest-to-today (recent unfunded lessons and the
 * immediate upcoming ones) is what "this plan covers what's currently
 * running" actually means; ancient history only gets swept up if capacity is
 * left over after everything closer to now is covered.
 */
async function attachUnfundedSessions(
  studentId: string,
  planId: string,
  capacity: number,
): Promise<{ ok: true; attached: number } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: loose, error } = await supabase
    .from("sessions")
    .select("id, session_date")
    .eq("student_id", studentId)
    .is("payment_plan_id", null)
    .neq("status", "cancelled");

  if (error) return { ok: false, error: error.message };

  const today = Date.now();
  const ids = [...(loose ?? [])]
    .sort(
      (a, b) =>
        Math.abs(new Date(a.session_date).getTime() - today) -
        Math.abs(new Date(b.session_date).getTime() - today),
    )
    .slice(0, capacity)
    .map((s) => s.id);
  if (ids.length === 0) return { ok: true, attached: 0 };

  const { error: linkErr } = await supabase
    .from("sessions")
    .update({ payment_plan_id: planId })
    .in("id", ids);

  if (linkErr) return { ok: false, error: linkErr.message };
  return { ok: true, attached: ids.length };
}

export type AttachResult =
  | { ok: true; attached: number }
  | { ok: false; error: string };

/** Admin action: sweep a student's unfunded sessions onto an existing plan. */
export async function attachSessionsToPlan(
  studentId: string,
  planId: string,
): Promise<AttachResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("payment_plans")
    .select("id, sessions_total, student_id")
    .eq("id", planId)
    .maybeSingle();

  if (error || !plan) return { ok: false, error: error?.message ?? "Plan not found." };
  if (plan.student_id !== studentId) {
    return { ok: false, error: "That plan belongs to a different student." };
  }

  const { count } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("payment_plan_id", planId)
    .neq("status", "cancelled");

  const room = Math.max(0, plan.sessions_total - (count ?? 0));
  if (room === 0) {
    return { ok: false, error: "That plan has no credits left to attach to." };
  }

  const res = await attachUnfundedSessions(studentId, planId, room);
  if (!res.ok) return res;

  revalidatePayments(studentId);
  return res;
}

export type RenewOverrides = { sessions_total?: number; rate_per_session?: number };

/**
 * Duplicates a plan's terms into a brand-new one, instead of the admin
 * re-typing the New Plan form for a routine renewal. Copies student, payer,
 * notes, and adjustments verbatim; sessions_total and rate_per_session copy
 * across too unless the caller overrides them (the confirm dialog pre-fills
 * both from the source plan, editable in case a price or block size changed).
 * The new plan still starts 'unpaid' — renewing doesn't skip confirming the
 * transfer landed, it just skips re-entering numbers that haven't changed.
 *
 * Sweeps the student's unfunded sessions onto it immediately, same as ticking
 * "attach existing" on a fresh plan — the whole point of renewing is picking
 * up where the old block left off.
 */
export async function renewPaymentPlan(
  planId: string,
  overrides: RenewOverrides = {},
): Promise<PlanCreateResult> {
  await requireAdmin();

  if (overrides.sessions_total !== undefined) {
    if (
      !Number.isInteger(overrides.sessions_total) ||
      overrides.sessions_total < 1 ||
      overrides.sessions_total > 200
    ) {
      return { ok: false, error: "Sessions must be a whole number between 1 and 200." };
    }
  }
  if (overrides.rate_per_session !== undefined) {
    if (
      !Number.isFinite(overrides.rate_per_session) ||
      overrides.rate_per_session < 0 ||
      overrides.rate_per_session > 10_000_000
    ) {
      return { ok: false, error: "Rate must be between ₦0 and ₦10,000,000." };
    }
  }

  const supabase = await createClient();
  const { data: source, error: srcErr } = await supabase
    .from("payment_plans")
    .select(
      `
      student_id, payer_id, sessions_total, rate_per_session, notes,
      adjustments:payment_plan_adjustments ( label, amount_ngn, sort_order )
      `,
    )
    .eq("id", planId)
    .maybeSingle();

  if (srcErr || !source) return { ok: false, error: srcErr?.message ?? "Plan not found." };

  const sessionsTotal = overrides.sessions_total ?? source.sessions_total;
  const ratePerSession = overrides.rate_per_session ?? source.rate_per_session;

  const { data: reference, error: refErr } = await supabase.rpc(
    "next_plan_reference",
    { p_student_id: source.student_id },
  );
  if (refErr || !reference) {
    return { ok: false, error: refErr?.message ?? "Couldn't generate a reference code." };
  }

  const { data: plan, error: planErr } = await supabase
    .from("payment_plans")
    .insert({
      student_id: source.student_id,
      payer_id: source.payer_id,
      sessions_total: sessionsTotal,
      rate_per_session: ratePerSession,
      reference_code: reference as string,
      notes: source.notes,
    })
    .select("id, reference_code")
    .single();

  if (planErr || !plan) {
    return { ok: false, error: planErr?.message ?? "Couldn't create the plan." };
  }

  const adjustments = (source.adjustments ?? []) as Array<{
    label: string;
    amount_ngn: number;
    sort_order: number;
  }>;
  if (adjustments.length > 0) {
    const { error: adjErr } = await supabase.from("payment_plan_adjustments").insert(
      adjustments.map((a) => ({
        plan_id: plan.id,
        label: a.label,
        amount_ngn: a.amount_ngn,
        sort_order: a.sort_order,
      })),
    );
    if (adjErr) {
      await supabase.from("payment_plans").delete().eq("id", plan.id);
      return { ok: false, error: adjErr.message };
    }
  }

  const attachRes = await attachUnfundedSessions(source.student_id, plan.id, sessionsTotal);
  const attached = attachRes.ok ? attachRes.attached : 0;

  revalidatePayments(source.student_id);
  return { ok: true, planId: plan.id, referenceCode: plan.reference_code, attached };
}

const markPaidSchema = z.object({
  plan_id: z.string().uuid(),
  payment_reference: z.string().max(200).optional(),
  paid_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date")
    .optional(),
  // Defaults on: a real payment landing should tell the parent. Off is for
  // backfilling old, already-taught sessions onto a plan after the fact —
  // bookkeeping the admin is doing, not news the parent needs.
  send_receipt: z.boolean().optional(),
});

/**
 * Admin confirms the transfer landed. This is the moment the plan becomes
 * schedulable runway, so it's deliberately a separate, explicit action rather
 * than something a parent can trigger by uploading a screenshot.
 *
 * The receipt email is sent by the caller (the server action wrapper in slice
 * 5) once this returns — a failed send must not roll back a real payment.
 */
export async function markPlanPaid(input: unknown): Promise<PaymentResult> {
  const admin = await requireAdmin();

  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { plan_id, payment_reference, paid_on, send_receipt } = parsed.data;

  const supabase = await createClient();
  const { data: plan, error: readErr } = await supabase
    .from("payment_plans")
    .select("id, status, student_id")
    .eq("id", plan_id)
    .maybeSingle();

  if (readErr || !plan) return { ok: false, error: readErr?.message ?? "Plan not found." };
  if (plan.status === "paid") return { ok: false, error: "That plan is already paid." };
  if (plan.status === "void") return { ok: false, error: "That plan was voided." };

  const { error } = await supabase
    .from("payment_plans")
    .update({
      status: "paid",
      // A date-only input means the transfer's value date; noon UTC keeps the
      // stored timestamp on that calendar day for readers either side of UTC.
      paid_at: paid_on ? `${paid_on}T12:00:00Z` : new Date().toISOString(),
      payment_reference: payment_reference?.trim() || null,
      verified_by: admin.id,
    })
    .eq("id", plan_id);

  if (error) return { ok: false, error: error.message };

  // Receipt is best-effort and deliberately after the write: neither a Resend
  // outage nor a missing service-role key may roll back a payment that
  // genuinely landed. Idempotent on receipt_sent_at, so a plan whose receipt
  // failed can be retried without double-sending. Skippable for backfill —
  // marking an old, already-delivered batch paid shouldn't email the parent.
  if (send_receipt !== false) {
    try {
      await sendPaymentReceiptEmail(plan_id);
    } catch {
      // Swallowed on purpose — the money is recorded, which is what matters.
    }
  }

  revalidatePayments(plan.student_id);
  return { ok: true };
}

export type ReminderRunResult =
  | { ok: true; sent: number; skipped: string[] }
  | { ok: false; error: string };

/**
 * Admin-triggered version of the nightly sweep. Same code path and the same
 * idempotency, so pressing it is safe: plans already nudged for a reason are
 * skipped rather than emailed twice.
 */
export async function runPaymentRemindersNow(): Promise<ReminderRunResult> {
  await requireAdmin();

  try {
    const result = await runReminderSweep();
    revalidatePayments();
    return {
      ok: true,
      sent: result.sent.filter((s) => s.sent).length,
      skipped: result.sent
        .filter((s) => !s.sent)
        .map((s) => `${s.referenceCode}: ${s.reason ?? "not sent"}`),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reminder sweep failed",
    };
  }
}

export type ManualReminderResult =
  | { ok: true; recipients: string[] }
  | { ok: false; error: string };

/**
 * Admin fires a reminder for one plan on demand — the payments-page
 * equivalent of resending a session email. Deliberately bypasses the
 * `payment_reminders` idempotency log the automatic sweep uses: that log
 * exists to stop the sweep re-pestering a parent for the same reason, not to
 * stop an admin who's looking at this specific plan and wants to nudge again.
 * Nothing is written back to the log, so it can't suppress a later automatic
 * send either.
 */
export async function sendPaymentReminderNow(planId: string): Promise<ManualReminderResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("payment_plans")
    .select("id, student_id, sessions_total, status")
    .eq("id", planId)
    .maybeSingle();
  if (error || !plan) return { ok: false, error: error?.message ?? "Plan not found." };

  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("status, session_date")
    .eq("payment_plan_id", planId);

  const sessions = sessionRows ?? [];
  const usage = tallyPlanUsage(
    sessions.map((s) => ({ payment_plan_id: planId, status: s.status })),
  );
  const remaining = remainingToDeliver(plan as unknown as PlanRow, usageFor(planId, usage));
  const kind = remaining <= 0 ? "plan_exhausted" : "renewal_due";

  const today = new Date().toISOString().slice(0, 10);
  const nextSessionDate =
    sessions
      .filter((s) => s.status === "scheduled" && s.session_date >= today)
      .map((s) => s.session_date)
      .sort()[0] ?? null;

  const res = await sendPaymentReminderEmail(planId, kind, {
    sessionsDelivered: usageFor(planId, usage).delivered,
    nextSessionDate,
  });

  if (!res.ok) return { ok: false, error: res.error };
  if (res.skipped) return { ok: false, error: res.reason };

  return { ok: true, recipients: res.recipients };
}

/**
 * Voids a plan — kept rather than deleted so the reference code stays
 * reserved and the history of a mistaken or refunded plan is auditable.
 *
 * Also frees every session it funded (back to unfunded) and hides the plan
 * from the payments list, in one action: a voided plan is, by definition,
 * not paying for anything, so its sessions shouldn't stay stranded on it —
 * releasing them lets a replacement plan pick them up via Attach — and it
 * shouldn't keep cluttering the list either. Reversible: unhide it from the
 * "show hidden plans" view any time, sessions just won't come back with it.
 */
export async function voidPaymentPlan(planId: string): Promise<PaymentResult> {
  await requireAdmin();

  const supabase = await createClient();

  const { error: unlinkErr } = await supabase
    .from("sessions")
    .update({ payment_plan_id: null })
    .eq("payment_plan_id", planId);
  if (unlinkErr) return { ok: false, error: unlinkErr.message };

  const { data, error } = await supabase
    .from("payment_plans")
    .update({ status: "void", archived_at: new Date().toISOString() })
    .eq("id", planId)
    .select("student_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  revalidatePayments((data as { student_id: string } | null)?.student_id);
  return { ok: true };
}

/** Restores a hidden (or voided) plan back onto the payments list. Doesn't
 *  change its status — a restored void plan is still void, just visible. */
export async function unarchivePaymentPlan(planId: string): Promise<PaymentResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_plans")
    .update({ archived_at: null })
    .eq("id", planId)
    .select("student_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  revalidatePayments((data as { student_id: string } | null)?.student_id);
  return { ok: true };
}

/** Admin edits a plan's price or size. The total_ngn trigger keeps up. */
export async function updatePaymentPlan(
  planId: string,
  patch: { sessions_total?: number; rate_per_session?: number; notes?: string },
): Promise<PaymentResult> {
  await requireAdmin();

  const update: {
    sessions_total?: number;
    rate_per_session?: number;
    notes?: string | null;
  } = {};

  if (patch.sessions_total !== undefined) {
    if (!Number.isInteger(patch.sessions_total) || patch.sessions_total < 1 || patch.sessions_total > 200) {
      return { ok: false, error: "Sessions must be a whole number between 1 and 200." };
    }
    update.sessions_total = patch.sessions_total;
  }
  if (patch.rate_per_session !== undefined) {
    if (
      !Number.isFinite(patch.rate_per_session) ||
      patch.rate_per_session < 0 ||
      patch.rate_per_session > 10_000_000
    ) {
      return { ok: false, error: "Rate must be between ₦0 and ₦10,000,000." };
    }
    update.rate_per_session = patch.rate_per_session;
  }
  if (patch.notes !== undefined) update.notes = patch.notes.trim() || null;

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_plans")
    .update(update)
    .eq("id", planId)
    .select("student_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  revalidatePayments((data as { student_id: string } | null)?.student_id);
  return { ok: true };
}
