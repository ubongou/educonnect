import { revalidatePath } from "next/cache";
import { after, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Json } from "@/types/db";
import { sendPaymentReceiptEmail } from "@/lib/email/sendPaymentEmails";
import { sendMonnifyAlertEmail } from "@/lib/email/sendMonnifyAlert";
import {
  getMonnifyConfig,
  isMonnifySandbox,
  toAmount,
  verifyMonnifySignature,
} from "@/lib/payments/monnify";
import { applyMonnifyTransaction, type ApplyOutcome } from "@/lib/payments/invoices";

/**
 * Monnify webhook — the endpoint that marks plans paid on its own.
 *
 * Configure in the Monnify dashboard (Developer → Webhook URLs → Transaction
 * completion) as `${APP_URL}/api/webhooks/monnify`.
 *
 * Trust model: the signature proves the notification came from Monnify, but
 * the handler still acts only on the transaction as re-read from Monnify's
 * API. Monnify's sandbox doesn't sign notifications at all, which is why an
 * unsigned request is tolerated there and rejected against production.
 *
 * Status codes matter: anything but 200 makes Monnify retry. So a transient
 * failure (Monnify API or database down) answers 500 on purpose, and
 * everything that's merely "not ours" or "needs a human" answers 200.
 */
export async function POST(req: NextRequest) {
  const config = getMonnifyConfig();
  if (!config) {
    return Response.json({ ok: false, error: "Monnify not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("monnify-signature");
  const signatureValid = verifyMonnifySignature(raw, signature, config.secretKey);

  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Logged below as unparseable.
  }

  const body = (payload ?? {}) as {
    eventType?: string;
    eventData?: { transactionReference?: string; amountPaid?: unknown };
  };
  const eventType = body.eventType ?? null;
  const transactionReference = body.eventData?.transactionReference ?? null;

  const log = async (outcome: string, detail?: string) => {
    try {
      await createServiceRoleClient()
        .from("monnify_events")
        .insert({
          event_type: eventType,
          transaction_reference: transactionReference,
          payload: (payload ?? { raw: raw.slice(0, 4000) }) as Json,
          signature_valid: signature ? signatureValid : null,
          outcome,
          detail: detail ?? null,
        });
    } catch {
      // The log is for support; never let it fail the webhook.
    }
  };

  // A signature that's present must be right; an absent one is only
  // acceptable against sandbox.
  if (signature ? !signatureValid : !isMonnifySandbox(config)) {
    await log("rejected_signature");
    return Response.json({ ok: false }, { status: 401 });
  }

  if (!payload) {
    await log("unparseable");
    return Response.json({ ok: false }, { status: 400 });
  }

  if (eventType !== "SUCCESSFUL_TRANSACTION" || !transactionReference) {
    await log("ignored");
    return Response.json({ ok: true });
  }

  let result;
  try {
    result = await applyMonnifyTransaction(transactionReference);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await log("error", message);
    return Response.json({ ok: false }, { status: 500 });
  }

  await log(result.outcome, result.detail);

  if (result.planId) {
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard");
    if (result.studentId) revalidatePath(`/admin/students/${result.studentId}`);
  }

  after(async () => {
    if (result.outcome === "confirmed" && result.planId) {
      // Idempotent on receipt_sent_at, so a retried webhook can't double-send.
      await sendPaymentReceiptEmail(result.planId).catch(() => {});
      return;
    }

    const alert = ALERTS[result.outcome];
    if (!alert) return;
    await sendMonnifyAlertEmail({
      subject: alert.subject,
      summary: alert.summary,
      fields: [
        ["What happened", result.detail],
        ["Amount paid", toAmount(result.transaction.amountPaid)],
        ["Payment status", result.transaction.paymentStatus],
        ["Method", result.transaction.paymentMethod],
        ["Paid on", result.transaction.paidOn],
        ["Monnify reference", result.transaction.transactionReference],
        ["Payment reference", result.transaction.paymentReference],
      ],
    });
  });

  return Response.json({ ok: true, outcome: result.outcome });
}

const ALERTS: Partial<Record<ApplyOutcome, { subject: string; summary: string }>> = {
  underpaid: {
    subject: "Monnify: short payment needs a look",
    summary:
      "A parent paid less than the invoice amount, so the plan was NOT marked paid. Check with the parent and mark it paid manually if you're accepting the amount.",
  },
  second_payment: {
    subject: "Monnify: invoice paid twice",
    summary:
      "A second payment landed on an invoice that was already paid. The parent may need a refund or a credit towards the next block.",
  },
  plan_not_unpaid: {
    subject: "Monnify: payment on a plan that wasn't awaiting payment",
    summary:
      "Money landed on an invoice whose plan was already paid or voided — possibly a double payment. Check the plan and refund or credit the parent.",
  },
  unmatched: {
    subject: "Monnify: payment didn't match any plan",
    summary:
      "Monnify received a payment that doesn't match any Masani invoice. Find the payer in the Monnify dashboard and mark the right plan paid by hand.",
  },
};
