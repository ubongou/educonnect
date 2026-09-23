/**
 * The rules around Monnify invoices, free of Supabase and network calls so
 * they can be tested directly. The I/O lives in lib/payments/invoices.ts.
 */

export type InvoiceSnapshot = {
  amountNgn: number;
  status: string;
  transactionReference: string | null;
};

export type PaymentDecision =
  /** Mark the plan paid. */
  | { action: "confirm" }
  /** Nothing to do. */
  | { action: "ignore"; outcome: "not_paid" | "duplicate" }
  /** Money arrived but needs a human. `recordOnInvoice` = log it against the invoice. */
  | {
      action: "alert";
      outcome: "unmatched" | "underpaid" | "second_payment" | "plan_not_unpaid";
      recordOnInvoice: boolean;
    };

/**
 * What to do with a transaction Monnify says is complete. Pure, so every branch
 * is tested; the webhook only executes the answer.
 */
export function decideInvoicePayment(input: {
  paymentStatus: string;
  transactionReference: string;
  amountPaid: number | null;
  invoice: InvoiceSnapshot | null;
  planStatus: string | null;
}): PaymentDecision {
  const { paymentStatus, transactionReference, amountPaid, invoice, planStatus } = input;

  // OVERPAID still means the full amount arrived.
  if (paymentStatus !== "PAID" && paymentStatus !== "OVERPAID") {
    return { action: "ignore", outcome: "not_paid" };
  }
  if (!invoice) return { action: "alert", outcome: "unmatched", recordOnInvoice: false };

  if (invoice.transactionReference === transactionReference) {
    return { action: "ignore", outcome: "duplicate" };
  }
  if (invoice.status === "paid") {
    return { action: "alert", outcome: "second_payment", recordOnInvoice: false };
  }
  // A cent of rounding is not a short payment.
  if (amountPaid === null || amountPaid + 0.01 < invoice.amountNgn) {
    return { action: "alert", outcome: "underpaid", recordOnInvoice: false };
  }
  if (planStatus !== "unpaid") {
    return { action: "alert", outcome: "plan_not_unpaid", recordOnInvoice: true };
  }
  return { action: "confirm" };
}

export type LiveInvoice = {
  accountNumber: string;
  accountName: string | null;
  bankName: string | null;
  checkoutUrl: string | null;
  expiresAt: string;
};

/**
 * The invoice a parent should be shown for a plan, if any: pending, not yet
 * expired, and still for the plan's current total. Anything else and the card
 * falls back to the static Moniepoint account.
 */
export function pickLiveInvoice(
  invoices: ReadonlyArray<{
    status: string;
    amount_ngn: number | string;
    account_number: string | null;
    account_name: string | null;
    bank_name: string | null;
    checkout_url: string | null;
    expires_at: string;
  }>,
  planTotal: number,
  now: Date = new Date(),
): LiveInvoice | null {
  const live = invoices.find(
    (i) =>
      i.status === "pending" &&
      i.account_number &&
      new Date(i.expires_at).getTime() > now.getTime() &&
      Math.abs(Number(i.amount_ngn) - planTotal) < 0.01,
  );
  if (!live) return null;
  return {
    accountNumber: live.account_number!,
    accountName: live.account_name,
    bankName: live.bank_name,
    checkoutUrl: live.checkout_url,
    expiresAt: live.expires_at,
  };
}
