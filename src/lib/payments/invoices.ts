import { createServiceRoleClient } from "@/lib/supabase/server";
import { defaultGlobals } from "@/lib/marketing/defaults";
import { getAppUrl } from "@/lib/email/client";
import {
  cancelMonnifyInvoice,
  createMonnifyInvoice,
  getMonnifyConfig,
  getMonnifyTransaction,
  parseMonnifyDate,
  toAmount,
  type MonnifyConfig,
  type MonnifyTransaction,
} from "@/lib/payments/monnify";
import { decideInvoicePayment, type PaymentDecision } from "@/lib/payments/invoiceRules";

/**
 * Monnify invoices for payment plans: issuing one when a plan is created,
 * retiring it when the plan changes, and settling a plan when its invoice is
 * paid.
 *
 * All service-role. The webhook has no session at all, and the admin actions
 * that call in here have already passed requireAdmin.
 */

/**
 * How long an invoice's account number stays payable. Long enough to cover a
 * parent who pays at the end of the month; after that the card falls back to
 * the static Moniepoint account and the admin can issue a fresh one.
 */
export const INVOICE_VALID_DAYS = 30;

/** Monnify rejects invoices of ₦20 or less. */
export const MIN_INVOICE_NGN = 20;

type Supabase = ReturnType<typeof createServiceRoleClient>;

export type IssueInvoiceResult =
  | { ok: true; accountNumber: string | null; expiresAt: string }
  | { ok: false; error: string };

/**
 * Issues a fresh invoice for an unpaid plan, cancelling any live one first so
 * the parent only ever sees one account number.
 */
export async function issueInvoiceForPlan(planId: string): Promise<IssueInvoiceResult> {
  const config = getMonnifyConfig();
  if (!config) return { ok: false, error: "Monnify isn't configured." };

  const supabase = createServiceRoleClient();
  const { data: plan, error } = await supabase
    .from("payment_plans")
    .select(
      `id, student_id, status, reference_code, sessions_total, total_ngn, payer_id,
       students ( full_name, preferred_name )`,
    )
    .eq("id", planId)
    .maybeSingle();

  if (error || !plan) return { ok: false, error: error?.message ?? "Plan not found." };
  if (plan.status !== "unpaid") {
    return { ok: false, error: "Only unpaid plans can be invoiced." };
  }

  const amount = Number(plan.total_ngn);
  if (!(amount > MIN_INVOICE_NGN)) {
    return { ok: false, error: `Monnify needs an amount above ₦${MIN_INVOICE_NGN}.` };
  }

  await cancelPendingInvoices(planId, { supabase, config });

  const student = plan.students as unknown as {
    full_name: string;
    preferred_name: string | null;
  } | null;
  const studentName = student?.preferred_name?.trim() || student?.full_name || "Student";
  const customer = await invoiceCustomer(supabase, plan.student_id, plan.payer_id);

  const invoiceReference = `${plan.reference_code}-${Date.now().toString(36).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + INVOICE_VALID_DAYS * 24 * 60 * 60 * 1000);

  let invoice;
  try {
    invoice = await createMonnifyInvoice(config, {
      invoiceReference,
      amount,
      description: `${plan.sessions_total} sessions for ${studentName} (${plan.reference_code})`,
      customerName: customer.name ?? studentName,
      customerEmail: customer.email,
      expiresAt,
      redirectUrl: `${getAppUrl().replace(/\/$/, "")}/dashboard`,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Monnify invoice failed.",
    };
  }

  const { error: insertErr } = await supabase.from("payment_plan_invoices").insert({
    plan_id: planId,
    invoice_reference: invoiceReference,
    amount_ngn: amount,
    account_number: invoice.accountNumber ?? null,
    account_name: invoice.accountName ?? null,
    bank_name: invoice.bankName ?? null,
    checkout_url: invoice.checkoutUrl ?? null,
    expires_at: (parseMonnifyDate(invoice.expiryDate) ?? expiresAt).toISOString(),
  });

  if (insertErr) {
    // An invoice we can't match a payment back to is worse than none: pull it.
    await cancelMonnifyInvoice(config, invoiceReference).catch(() => {});
    return { ok: false, error: insertErr.message };
  }

  return {
    ok: true,
    accountNumber: invoice.accountNumber ?? null,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Retires a plan's live invoice — on void, manual "Mark paid", a price edit,
 * or before issuing a replacement. A failed remote cancel is tolerated: if the
 * parent somehow still pays into it, the webhook finds the plan by reference
 * and flags the payment to the admin rather than losing it.
 */
export async function cancelPendingInvoices(
  planId: string,
  deps?: { supabase?: Supabase; config?: MonnifyConfig | null },
): Promise<void> {
  const supabase = deps?.supabase ?? createServiceRoleClient();
  const config = deps?.config === undefined ? getMonnifyConfig() : deps.config;

  const { data: pending } = await supabase
    .from("payment_plan_invoices")
    .select("id, invoice_reference")
    .eq("plan_id", planId)
    .eq("status", "pending");

  for (const inv of pending ?? []) {
    if (config) {
      await cancelMonnifyInvoice(config, inv.invoice_reference).catch(() => {});
    }
    await supabase
      .from("payment_plan_invoices")
      .update({ status: "cancelled" })
      .eq("id", inv.id)
      .eq("status", "pending");
  }
}

/**
 * Who the invoice is addressed to. Monnify requires an email; the first linked
 * parent is the natural choice, then the plan's payer, then our own inbox so an
 * invoice can still be issued before a parent account exists.
 */
async function invoiceCustomer(
  supabase: Supabase,
  studentId: string,
  payerId: string | null,
): Promise<{ name: string | null; email: string }> {
  const { data } = await supabase
    .from("parent_students")
    .select(`parent:profiles!parent_students_parent_id_fkey ( full_name, email )`)
    .eq("student_id", studentId);

  type Row = { parent: { full_name: string | null; email: string | null } | null };
  const parent = ((data ?? []) as unknown as Row[])
    .map((r) => r.parent)
    .find((p) => p?.email);
  if (parent?.email) return { name: parent.full_name, email: parent.email };

  if (payerId) {
    const { data: payer } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", payerId)
      .maybeSingle();
    if (payer?.email) return { name: payer.full_name, email: payer.email };
  }

  return { name: null, email: defaultGlobals.adminEmail };
}

// -----------------------------------------------------------------------------
// Settling a payment
// -----------------------------------------------------------------------------

export type ApplyOutcome =
  | "confirmed"
  | Extract<PaymentDecision, { outcome: string }>["outcome"];

export type ApplyResult = {
  outcome: ApplyOutcome;
  planId: string | null;
  studentId: string | null;
  detail: string;
  transaction: MonnifyTransaction;
};

/**
 * Settles one Monnify transaction against our invoices. Re-reads the
 * transaction from Monnify first — the notification body is never trusted for
 * money state. Idempotent: replaying the same transaction is a no-op.
 *
 * Throws on transient failures (Monnify or database unreachable) so the
 * webhook can answer non-200 and let Monnify retry.
 */
export async function applyMonnifyTransaction(
  transactionReference: string,
): Promise<ApplyResult> {
  const config = getMonnifyConfig();
  if (!config) throw new Error("Monnify isn't configured.");

  const txn = await getMonnifyTransaction(config, transactionReference);
  const supabase = createServiceRoleClient();

  // For invoice payments the product reference is our invoiceReference; the
  // payment reference is checked too in case Monnify reports it there instead.
  const candidates = [txn.product?.reference, txn.paymentReference].filter(
    (r): r is string => Boolean(r),
  );

  const { data: invoiceRows, error: invErr } = candidates.length
    ? await supabase
        .from("payment_plan_invoices")
        .select(
          `id, plan_id, amount_ngn, status, transaction_reference, invoice_reference,
           plan:payment_plans ( id, student_id, status, reference_code )`,
        )
        .in("invoice_reference", candidates)
        .limit(1)
    : { data: [], error: null };
  if (invErr) throw new Error(invErr.message);

  type InvoiceRow = {
    id: string;
    plan_id: string;
    amount_ngn: number;
    status: string;
    transaction_reference: string | null;
    invoice_reference: string;
    plan: { id: string; student_id: string; status: string; reference_code: string } | null;
  };
  const invoice = ((invoiceRows ?? []) as unknown as InvoiceRow[])[0] ?? null;

  const amountPaid = toAmount(txn.amountPaid);
  const paidAt = (parseMonnifyDate(txn.paidOn) ?? new Date()).toISOString();

  const decision = decideInvoicePayment({
    paymentStatus: txn.paymentStatus,
    transactionReference: txn.transactionReference,
    amountPaid,
    invoice: invoice
      ? {
          amountNgn: Number(invoice.amount_ngn),
          status: invoice.status,
          transactionReference: invoice.transaction_reference,
        }
      : null,
    planStatus: invoice?.plan?.status ?? null,
  });

  const base = {
    planId: invoice?.plan_id ?? null,
    studentId: invoice?.plan?.student_id ?? null,
    transaction: txn,
  };

  const recordOnInvoice = async () => {
    if (!invoice) return;
    const { error } = await supabase
      .from("payment_plan_invoices")
      .update({
        status: "paid",
        transaction_reference: txn.transactionReference,
        amount_paid_ngn: amountPaid,
        settlement_amount_ngn: toAmount(txn.settlementAmount),
        paid_at: paidAt,
      })
      .eq("id", invoice.id)
      .is("transaction_reference", null);
    if (error) throw new Error(error.message);
  };

  if (decision.action === "ignore") {
    return { ...base, outcome: decision.outcome, detail: `Status ${txn.paymentStatus}` };
  }

  if (decision.action === "alert") {
    if (decision.recordOnInvoice) await recordOnInvoice();
    return {
      ...base,
      outcome: decision.outcome,
      detail: invoice
        ? `Invoice ${invoice.invoice_reference} (₦${invoice.amount_ngn}); plan ${invoice.plan?.reference_code ?? "?"} is ${invoice.plan?.status ?? "missing"}`
        : `No invoice matches ${candidates.join(" / ") || "this transaction"}`,
    };
  }

  // confirm
  await recordOnInvoice();

  // Conditional on still being unpaid, so a concurrent manual "Mark paid" (or
  // a racing duplicate notification) can't be overwritten.
  const { data: updated, error: planErr } = await supabase
    .from("payment_plans")
    .update({
      status: "paid",
      paid_at: paidAt,
      payment_reference: txn.transactionReference,
      paid_via: "monnify",
      verified_by: null,
    })
    .eq("id", invoice!.plan_id)
    .eq("status", "unpaid")
    .select("id");
  if (planErr) throw new Error(planErr.message);

  if (!updated || updated.length === 0) {
    return {
      ...base,
      outcome: "plan_not_unpaid",
      detail: `Plan ${invoice!.plan?.reference_code ?? invoice!.plan_id} was no longer unpaid when the payment landed`,
    };
  }

  return {
    ...base,
    outcome: "confirmed",
    detail: `Plan ${invoice!.plan?.reference_code ?? invoice!.plan_id} marked paid`,
  };
}
