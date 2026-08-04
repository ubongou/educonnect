import { describe, expect, it } from "vitest";
import {
  renderPaymentReceiptEmail,
  renderPlanExhaustedEmail,
  renderRenewalReminderEmail,
  type PlanEmailBase,
} from "@/lib/email/templates/payments";
import { renderLessonReportEmail } from "@/lib/email/templates/lessonReport";
import { BANK_DETAILS } from "@/lib/payments/bankDetails";
import {
  REFERRAL_OFFER,
  shouldShowReferral,
  whatsappDisplayNumber,
  whatsappReferralUrl,
} from "@/lib/payments/referral";
import { defaultGlobals } from "@/lib/marketing/defaults";
import { fetchAllRows } from "@/lib/supabase/fetchAll";

const base: PlanEmailBase = {
  parentFirstName: "Ada",
  studentName: "Zara",
  referenceCode: "MAS-00042-02",
  sessionsTotal: 24,
  ratePerSession: 18333,
  lines: [
    { label: "Sibling discount", amount: -40000 },
    { label: "Materials fee", amount: 5000 },
  ],
  total: 404992,
  dashboardUrl: "https://example.test/dashboard",
};

describe("renderPaymentReceiptEmail", () => {
  const mail = renderPaymentReceiptEmail(base);

  it("names the reference in the subject so it threads sensibly", () => {
    expect(mail.subject).toContain("MAS-00042-02");
    expect(mail.subject).toContain("Zara");
  });

  it("shows every line item and the total in both html and text", () => {
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain("Sibling discount");
      expect(body).toContain("Materials fee");
      expect(body).toContain("₦404,992");
    }
  });

  it("marks a discount as negative and an add-on as positive", () => {
    expect(mail.text).toContain("-₦40,000");
    expect(mail.text).toContain("+₦5,000");
  });

  it("greets by first name, and degrades gracefully without one", () => {
    expect(mail.text.startsWith("Hi Ada,")).toBe(true);
    const anon = renderPaymentReceiptEmail({ ...base, parentFirstName: null });
    expect(anon.text.startsWith("Hi there,")).toBe(true);
  });
});

describe("renderRenewalReminderEmail", () => {
  const mail = renderRenewalReminderEmail({
    ...base,
    sessionsDelivered: 23,
    nextSessionDate: "2026-08-20",
  });

  it("leads with the one-session-left message", () => {
    expect(mail.subject).toContain("1 session left");
    expect(mail.text).toContain("23 of 24");
  });

  it("carries the bank details and the reference to quote", () => {
    expect(mail.html).toContain(BANK_DETAILS.accountNumber);
    expect(mail.html).toContain(BANK_DETAILS.accountName);
    expect(mail.html).toContain("MAS-00042-02");
    expect(mail.text).toContain(BANK_DETAILS.accountNumber);
  });

  it("handles a plan whose last session isn't on the calendar yet", () => {
    const unscheduled = renderRenewalReminderEmail({
      ...base,
      sessionsDelivered: 23,
      nextSessionDate: null,
    });
    expect(unscheduled.text).toContain("still to be scheduled");
  });

  it("formats the final session date in UTC so the day never shifts", () => {
    // A diaspora parent west of UTC must not see the 19th.
    expect(mail.html).toContain("20 Aug 2026");
  });
});

describe("renderPlanExhaustedEmail", () => {
  it("is the last nudge and still carries payment details", () => {
    const mail = renderPlanExhaustedEmail(base);
    expect(mail.subject).toContain("finished");
    expect(mail.html).toContain(BANK_DETAILS.accountNumber);
    expect(mail.text).toContain("MAS-00042-02");
  });
});

describe("escaping", () => {
  it("escapes html in names rather than emitting raw markup", () => {
    const mail = renderPaymentReceiptEmail({
      ...base,
      studentName: '<script>alert("x")</script>',
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("referral offer cadence", () => {
  it("skips the first report, then shows every fourth", () => {
    const shown = Array.from({ length: 13 }, (_, i) => i + 1).filter(
      shouldShowReferral,
    );
    expect(shown).toEqual([4, 8, 12]);
  });

  it("never shows against a zero count", () => {
    expect(shouldShowReferral(0)).toBe(false);
  });
});

describe("renderLessonReportEmail referral block", () => {
  const reportData = {
    parentFirstName: "Ada",
    studentName: "Zara",
    subjectName: "Mathematics",
    teacherName: "Mr Emeka Obi",
    lessonDate: "2026-08-03",
    lessonFocus: "Fractions",
    lessonHighlights: null,
    understanding: 8,
    confidence: 7,
    participation: 9,
    focus: 7,
    homework: 8,
    nextFocus: null,
    howToHelpAtHome: null,
    recordingUrl: null,
    reportUrl: "https://example.test/r",
  };

  it("is absent unless the caller asks for it", () => {
    const mail = renderLessonReportEmail(reportData);
    expect(mail.html).not.toContain("refer a friend");
    expect(mail.html.toLowerCase()).not.toContain("50% off");
    expect(mail.text.toLowerCase()).not.toContain("50% off");
  });

  it("renders the offer with a wa.me link when asked", () => {
    const mail = renderLessonReportEmail({ ...reportData, showReferral: true });
    expect(mail.html).toContain(REFERRAL_OFFER.headline);
    expect(mail.html).toContain(REFERRAL_OFFER.cta);
    expect(mail.html).toContain(`https://wa.me/${defaultGlobals.whatsappNumber}`);
    expect(mail.text).toContain("50% off");
  });

  it("offers messaging as an alternative, so the button isn't the only route", () => {
    const mail = renderLessonReportEmail({ ...reportData, showReferral: true });
    // The apostrophe in the copy is entity-escaped in the HTML, so match on an
    // apostrophe-free fragment here and on the raw string in the text part.
    expect(mail.html).toContain("Or message us any time");
    expect(mail.html).toContain(whatsappDisplayNumber());
    expect(mail.text).toContain(REFERRAL_OFFER.fallback);
    expect(mail.text).toContain(whatsappDisplayNumber());
  });
});

describe("whatsapp link", () => {
  it("uses digits only — wa.me rejects a + or spaces", () => {
    expect(defaultGlobals.whatsappNumber).toMatch(/^\d+$/);
    expect(whatsappReferralUrl()).toContain(
      `https://wa.me/${defaultGlobals.whatsappNumber}?text=`,
    );
  });

  it("prefills a fill-in-the-blanks message, encoded", () => {
    const url = whatsappReferralUrl();
    const text = decodeURIComponent(url.split("?text=")[1]);
    expect(text).toContain("I'd like to refer a parent");
    expect(text).toContain("Their name:");
    expect(text).toContain("Their phone or email:");
    // Newlines must survive encoding or the template arrives as one long line.
    expect(url).toContain("%0A");
  });

  it("formats the number for humans without breaking the link", () => {
    expect(whatsappDisplayNumber()).toBe("+234 901 724 6528");
  });

  it("keeps the offer vague on mechanics — no session counts in the copy", () => {
    // The real terms are 50% off the next 8 sessions; the email deliberately
    // doesn't say so, and shouldn't start to by accident.
    expect(REFERRAL_OFFER.body).not.toMatch(/\b8\b|sessions\b/);
  });
});

describe("fetchAllRows", () => {
  const page = <T,>(rows: T[], from: number, to: number) => ({
    data: rows.slice(from, to + 1),
    error: null,
  });

  it("keeps requesting until a short page arrives", async () => {
    const all = Array.from({ length: 25 }, (_, i) => ({ i }));
    const calls: Array<[number, number]> = [];

    const res = await fetchAllRows<{ i: number }>((from, to) => {
      calls.push([from, to]);
      return Promise.resolve(page(all, from, to));
    }, 10);

    expect(res.error).toBeNull();
    expect(res.rows).toHaveLength(25);
    expect(calls).toEqual([
      [0, 9],
      [10, 19],
      [20, 29],
    ]);
  });

  it("goes round once more after an exactly-full final page", async () => {
    const all = Array.from({ length: 20 }, (_, i) => ({ i }));
    let calls = 0;

    const res = await fetchAllRows<{ i: number }>((from, to) => {
      calls++;
      return Promise.resolve(page(all, from, to));
    }, 10);

    expect(res.rows).toHaveLength(20);
    expect(calls).toBe(3); // two full pages, then an empty one to confirm
  });

  it("stops at the first page for an empty table", async () => {
    const res = await fetchAllRows<{ i: number }>(() =>
      Promise.resolve({ data: [], error: null }),
    );
    expect(res.rows).toEqual([]);
    expect(res.error).toBeNull();
  });

  it("surfaces an error and returns what it managed to read", async () => {
    const all = Array.from({ length: 30 }, (_, i) => ({ i }));
    let calls = 0;

    const res = await fetchAllRows<{ i: number }>((from, to) => {
      calls++;
      if (calls === 2) {
        return Promise.resolve({ data: null, error: { message: "boom" } });
      }
      return Promise.resolve(page(all, from, to));
    }, 10);

    expect(res.error).toBe("boom");
    expect(res.rows).toHaveLength(10);
  });

  it("bails out rather than looping forever if the server ignores the range", async () => {
    const res = await fetchAllRows<{ i: number }>(
      () => Promise.resolve({ data: [{ i: 1 }, { i: 2 }], error: null }),
      2,
    );
    expect(res.error).toBeNull();
    expect(res.rows.length).toBe(204); // 102 capped iterations × 2 rows
  });
});
