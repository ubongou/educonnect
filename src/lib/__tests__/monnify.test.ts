import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  formatMonnifyDate,
  parseMonnifyDate,
  toAmount,
  verifyMonnifySignature,
} from "@/lib/payments/monnify";
import { decideInvoicePayment, pickLiveInvoice } from "@/lib/payments/invoiceRules";

const SECRET = "91MUDL9N6U3BQRXBQ2PJ9M0PW4J22M1Y";
const BODY = '{"eventType":"SUCCESSFUL_TRANSACTION","eventData":{"amountPaid":78000}}';
const sign = (body: string) => createHmac("sha512", SECRET).update(body).digest("hex");

describe("verifyMonnifySignature", () => {
  it("accepts the HMAC-SHA512 of the exact raw body", () => {
    expect(verifyMonnifySignature(BODY, sign(BODY), SECRET)).toBe(true);
  });

  it("tolerates uppercase hex and surrounding whitespace", () => {
    expect(verifyMonnifySignature(BODY, ` ${sign(BODY).toUpperCase()} `, SECRET)).toBe(true);
  });

  it("rejects a tampered body, a wrong key, and a missing header", () => {
    expect(verifyMonnifySignature(BODY.replace("78000", "7800"), sign(BODY), SECRET)).toBe(false);
    expect(verifyMonnifySignature(BODY, sign(BODY), "other-secret")).toBe(false);
    expect(verifyMonnifySignature(BODY, null, SECRET)).toBe(false);
    expect(verifyMonnifySignature(BODY, "short", SECRET)).toBe(false);
  });
});

describe("Monnify dates (Lagos, UTC+1)", () => {
  it("formats expiry dates in Lagos wall-clock time", () => {
    expect(formatMonnifyDate(new Date("2026-09-30T23:30:00Z"))).toBe("2026-10-01 00:30:00");
  });

  it("parses the ISO-ish shape", () => {
    expect(parseMonnifyDate("2021-11-17 11:28:42.615")?.toISOString()).toBe(
      "2021-11-17T10:28:42.000Z",
    );
  });

  it("parses the day-first 12-hour shape", () => {
    expect(parseMonnifyDate("17/11/2021 3:48:10 PM")?.toISOString()).toBe(
      "2021-11-17T14:48:10.000Z",
    );
    expect(parseMonnifyDate("01/02/2024 12:05:00 AM")?.toISOString()).toBe(
      "2024-01-31T23:05:00.000Z",
    );
  });

  it("round-trips its own format", () => {
    const d = new Date("2026-03-04T05:06:07Z");
    expect(parseMonnifyDate(formatMonnifyDate(d))?.getTime()).toBe(d.getTime());
  });

  it("returns null for junk", () => {
    expect(parseMonnifyDate("yesterday")).toBeNull();
    expect(parseMonnifyDate(null)).toBeNull();
  });
});

describe("toAmount", () => {
  it("accepts numbers and numeric strings", () => {
    expect(toAmount(3000)).toBe(3000);
    expect(toAmount("2990.00")).toBe(2990);
    expect(toAmount("440,000.50")).toBe(440000.5);
    expect(toAmount("n/a")).toBeNull();
  });
});

describe("decideInvoicePayment", () => {
  const invoice = { amountNgn: 80000, status: "pending", transactionReference: null };
  const base = {
    paymentStatus: "PAID",
    transactionReference: "MNFY|1",
    amountPaid: 80000,
    invoice,
    planStatus: "unpaid",
  };

  it("confirms a full payment on an unpaid plan", () => {
    expect(decideInvoicePayment(base)).toEqual({ action: "confirm" });
  });

  it("treats an overpayment as paid", () => {
    expect(
      decideInvoicePayment({ ...base, paymentStatus: "OVERPAID", amountPaid: 90000 }),
    ).toEqual({ action: "confirm" });
  });

  it("ignores anything Monnify doesn't call paid", () => {
    expect(decideInvoicePayment({ ...base, paymentStatus: "PENDING" })).toMatchObject({
      action: "ignore",
      outcome: "not_paid",
    });
  });

  it("is idempotent for a replayed transaction", () => {
    expect(
      decideInvoicePayment({
        ...base,
        invoice: { ...invoice, status: "paid", transactionReference: "MNFY|1" },
        planStatus: "paid",
      }),
    ).toMatchObject({ action: "ignore", outcome: "duplicate" });
  });

  it("flags a second, different payment on a paid invoice", () => {
    expect(
      decideInvoicePayment({
        ...base,
        transactionReference: "MNFY|2",
        invoice: { ...invoice, status: "paid", transactionReference: "MNFY|1" },
        planStatus: "paid",
      }),
    ).toMatchObject({ action: "alert", outcome: "second_payment", recordOnInvoice: false });
  });

  it("flags a short payment without confirming", () => {
    expect(decideInvoicePayment({ ...base, amountPaid: 79000 })).toMatchObject({
      action: "alert",
      outcome: "underpaid",
    });
    // A rounding cent is not short.
    expect(decideInvoicePayment({ ...base, amountPaid: 79999.995 })).toEqual({
      action: "confirm",
    });
  });

  it("flags money landing on a plan already paid by hand or voided, and records it", () => {
    for (const planStatus of ["paid", "void"]) {
      expect(decideInvoicePayment({ ...base, planStatus })).toMatchObject({
        action: "alert",
        outcome: "plan_not_unpaid",
        recordOnInvoice: true,
      });
    }
  });

  it("flags a payment that matches no invoice", () => {
    expect(decideInvoicePayment({ ...base, invoice: null, planStatus: null })).toMatchObject({
      action: "alert",
      outcome: "unmatched",
    });
  });
});

describe("pickLiveInvoice", () => {
  const now = new Date("2026-09-23T12:00:00Z");
  const row = {
    status: "pending",
    amount_ngn: "80000.00",
    account_number: "5000123456",
    account_name: "Masani Tutors Ltd",
    bank_name: "Moniepoint MFB",
    checkout_url: "https://sandbox.sdk.monnify.com/checkout/x",
    expires_at: "2026-10-23T12:00:00Z",
  };

  it("returns a pending, unexpired invoice for the current total", () => {
    expect(pickLiveInvoice([row], 80000, now)).toMatchObject({
      accountNumber: "5000123456",
      checkoutUrl: row.checkout_url,
    });
  });

  it("skips expired, cancelled, account-less, and stale-price invoices", () => {
    expect(pickLiveInvoice([{ ...row, expires_at: "2026-09-01T00:00:00Z" }], 80000, now)).toBeNull();
    expect(pickLiveInvoice([{ ...row, status: "cancelled" }], 80000, now)).toBeNull();
    expect(pickLiveInvoice([{ ...row, account_number: null }], 80000, now)).toBeNull();
    expect(pickLiveInvoice([row], 72000, now)).toBeNull();
  });
});
