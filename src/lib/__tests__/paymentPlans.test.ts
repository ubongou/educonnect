import { describe, expect, it } from "vitest";
import {
  formatNaira,
  isExhausted,
  needsRenewalReminder,
  planToChargeFor,
  planTotal,
  remainingToDeliver,
  remainingToSchedule,
  studentPaymentStatus,
  tallyPlanUsage,
  usageFor,
  type PlanRow,
} from "@/lib/payments/plans";
import {
  ADJUSTMENT_OPTIONS,
  adjustmentOption,
  resolveAdjustmentAmount,
} from "@/lib/payments/adjustments";

function plan(over: Partial<PlanRow> = {}): PlanRow {
  return {
    id: "plan-1",
    student_id: "stu-1",
    sessions_total: 8,
    status: "paid",
    ...over,
  };
}

const sessions = (planId: string | null, statuses: string[]) =>
  statuses.map((status) => ({ payment_plan_id: planId, status }));

describe("tallyPlanUsage", () => {
  it("counts non-cancelled as scheduled, but only completed as delivered", () => {
    const usage = tallyPlanUsage(
      sessions("plan-1", ["completed", "completed", "no_show", "scheduled", "cancelled"]),
    );
    expect(usage.get("plan-1")).toEqual({ scheduled: 4, delivered: 2 });
  });

  it("ignores unfunded sessions entirely", () => {
    const usage = tallyPlanUsage(sessions(null, ["completed", "scheduled"]));
    expect(usage.size).toBe(0);
  });

  it("keeps separate plans apart", () => {
    const usage = tallyPlanUsage([
      ...sessions("plan-1", ["completed"]),
      ...sessions("plan-2", ["completed", "scheduled"]),
    ]);
    expect(usage.get("plan-1")).toEqual({ scheduled: 1, delivered: 1 });
    expect(usage.get("plan-2")).toEqual({ scheduled: 2, delivered: 1 });
  });

  it("reports zeroes for a plan with no sessions yet", () => {
    expect(usageFor("plan-9", new Map())).toEqual({ scheduled: 0, delivered: 0 });
  });
});

describe("remaining counters", () => {
  it("frees a credit when a session is cancelled", () => {
    const usage = tallyPlanUsage(
      sessions("plan-1", ["scheduled", "scheduled", "cancelled"]),
    );
    expect(remainingToSchedule(plan(), usageFor("plan-1", usage))).toBe(6);
  });

  it("counts delivery separately from booking", () => {
    // All 8 booked, 6 taught: nothing left to schedule, 2 left to deliver.
    const usage = tallyPlanUsage(
      sessions("plan-1", [
        "completed", "completed", "completed", "completed",
        "completed", "completed", "scheduled", "scheduled",
      ]),
    );
    const u = usageFor("plan-1", usage);
    expect(remainingToSchedule(plan(), u)).toBe(0);
    expect(remainingToDeliver(plan(), u)).toBe(2);
  });

  it("never goes negative when a plan was overbooked by override", () => {
    const usage = tallyPlanUsage(sessions("plan-1", Array(11).fill("completed")));
    const u = usageFor("plan-1", usage);
    expect(remainingToSchedule(plan(), u)).toBe(0);
    expect(remainingToDeliver(plan(), u)).toBe(0);
  });
});

describe("studentPaymentStatus", () => {
  const usageOf = (statuses: string[]) => tallyPlanUsage(sessions("plan-1", statuses));

  it("is unpaid with no plans at all", () => {
    expect(studentPaymentStatus([], new Map())).toBe("unpaid");
  });

  it("is unpaid while the transfer hasn't landed", () => {
    expect(studentPaymentStatus([plan({ status: "unpaid" })], new Map())).toBe("unpaid");
  });

  it("ignores void plans", () => {
    expect(studentPaymentStatus([plan({ status: "void" })], new Map())).toBe("unpaid");
  });

  it("is paid with runway to spare", () => {
    expect(studentPaymentStatus([plan()], usageOf(["completed", "completed"]))).toBe(
      "paid",
    );
  });

  it("flips to expiring after the second-to-last session is delivered", () => {
    const sixDelivered = usageOf(Array(6).fill("completed"));
    expect(studentPaymentStatus([plan()], sixDelivered)).toBe("paid");

    const sevenDelivered = usageOf(Array(7).fill("completed"));
    expect(studentPaymentStatus([plan()], sevenDelivered)).toBe("expiring");
  });

  it("falls back to unpaid once the block is fully delivered", () => {
    expect(studentPaymentStatus([plan()], usageOf(Array(8).fill("completed")))).toBe(
      "unpaid",
    );
  });

  it("aggregates runway across plans so a top-up clears the warning", () => {
    const nearlyDone = plan({ id: "plan-1", sessions_total: 8 });
    const topUp = plan({ id: "plan-2", sessions_total: 8 });
    const usage = tallyPlanUsage([
      ...sessions("plan-1", Array(7).fill("completed")),
      ...sessions("plan-2", []),
    ]);
    // plan-1 alone would read "expiring"; with the top-up there are 9 left.
    expect(studentPaymentStatus([nearlyDone], usage)).toBe("expiring");
    expect(studentPaymentStatus([nearlyDone, topUp], usage)).toBe("paid");
  });

  it("does not count an unpaid top-up as runway", () => {
    const nearlyDone = plan({ id: "plan-1" });
    const unpaidTopUp = plan({ id: "plan-2", status: "unpaid" });
    const usage = tallyPlanUsage(sessions("plan-1", Array(7).fill("completed")));
    expect(studentPaymentStatus([nearlyDone, unpaidTopUp], usage)).toBe("expiring");
  });
});

describe("reminder triggers", () => {
  it("fires renewal at exactly one session left, not before", () => {
    const six = tallyPlanUsage(sessions("plan-1", Array(6).fill("completed")));
    const seven = tallyPlanUsage(sessions("plan-1", Array(7).fill("completed")));
    expect(needsRenewalReminder(plan(), usageFor("plan-1", six))).toBe(false);
    expect(needsRenewalReminder(plan(), usageFor("plan-1", seven))).toBe(true);
  });

  it("stops firing renewal once the plan is exhausted", () => {
    const eight = usageFor(
      "plan-1",
      tallyPlanUsage(sessions("plan-1", Array(8).fill("completed"))),
    );
    expect(needsRenewalReminder(plan(), eight)).toBe(false);
    expect(isExhausted(plan(), eight)).toBe(true);
  });

  it("never fires on an unpaid plan", () => {
    const seven = usageFor(
      "plan-1",
      tallyPlanUsage(sessions("plan-1", Array(7).fill("completed"))),
    );
    expect(needsRenewalReminder(plan({ status: "unpaid" }), seven)).toBe(false);
  });

  it("does not count a no-show as delivered — only a taught lesson does", () => {
    const usage = usageFor(
      "plan-1",
      tallyPlanUsage(
        sessions("plan-1", [...Array(6).fill("completed"), "no_show"]),
      ),
    );
    // 6 delivered of 8, still 2 to go — not at the renewal threshold yet.
    expect(needsRenewalReminder(plan(), usage)).toBe(false);
  });
});

describe("the second-to-last report trigger", () => {
  // Walks an 8-session plan one filed report at a time — the sequence the
  // event-driven reminder actually sees, since filing a report is what marks a
  // session delivered.
  it("fires exactly once, on the 7th of 8 reports", () => {
    const p = plan({ sessions_total: 8 });
    const fired: number[] = [];

    for (let filed = 0; filed <= 8; filed++) {
      const usage = usageFor(
        "plan-1",
        tallyPlanUsage(sessions("plan-1", Array(filed).fill("completed"))),
      );
      if (needsRenewalReminder(p, usage)) fired.push(filed);
    }

    expect(fired).toEqual([7]);
  });

  it("hands over to the exhausted nudge on the last report", () => {
    const p = plan({ sessions_total: 8 });
    const after8 = usageFor(
      "plan-1",
      tallyPlanUsage(sessions("plan-1", Array(8).fill("completed"))),
    );
    expect(needsRenewalReminder(p, after8)).toBe(false);
    expect(isExhausted(p, after8)).toBe(true);
  });

  it("fires on the 23rd report of a 24-session plan", () => {
    const p = plan({ sessions_total: 24 });
    const at22 = usageFor(
      "plan-1",
      tallyPlanUsage(sessions("plan-1", Array(22).fill("completed"))),
    );
    const at23 = usageFor(
      "plan-1",
      tallyPlanUsage(sessions("plan-1", Array(23).fill("completed"))),
    );
    expect(needsRenewalReminder(p, at22)).toBe(false);
    expect(needsRenewalReminder(p, at23)).toBe(true);
  });

  it("is unaffected by sessions merely booked but not yet taught", () => {
    // All 8 on the calendar, only 6 taught: no nudge yet.
    const p = plan({ sessions_total: 8 });
    const usage = usageFor(
      "plan-1",
      tallyPlanUsage(
        sessions("plan-1", [...Array(6).fill("completed"), "scheduled", "scheduled"]),
      ),
    );
    expect(needsRenewalReminder(p, usage)).toBe(false);
  });
});

describe("planToChargeFor", () => {
  const created = new Map([
    ["plan-old", "2026-01-01T00:00:00Z"],
    ["plan-new", "2026-06-01T00:00:00Z"],
  ]);

  it("consumes the oldest paid plan with a credit free", () => {
    const plans = [
      plan({ id: "plan-new" }),
      plan({ id: "plan-old" }),
    ];
    expect(planToChargeFor(plans, new Map(), created)?.id).toBe("plan-old");
  });

  it("skips a plan whose credits are all committed", () => {
    const usage = tallyPlanUsage(sessions("plan-old", Array(8).fill("scheduled")));
    const plans = [plan({ id: "plan-old" }), plan({ id: "plan-new" })];
    expect(planToChargeFor(plans, usage, created)?.id).toBe("plan-new");
  });

  it("returns null when nothing is payable, leaving the session unfunded", () => {
    expect(planToChargeFor([plan({ status: "unpaid" })], new Map(), created)).toBeNull();
    expect(planToChargeFor([], new Map(), created)).toBeNull();
  });
});

describe("planTotal", () => {
  it("sums sessions × rate with no adjustments", () => {
    expect(planTotal(24, 18333, [])).toBe(439992);
  });

  it("applies discounts and add-ons together", () => {
    expect(
      planTotal(24, 18333, [{ amount_ngn: -40000 }, { amount_ngn: 5000 }]),
    ).toBe(404992);
  });
});

describe("resolveAdjustmentAmount", () => {
  it("stores discounts negative and add-ons positive", () => {
    expect(
      resolveAdjustmentAmount({
        kind: "discount",
        mode: "naira",
        value: 40000,
        subtotalNgn: 440000,
      }),
    ).toBe(-40000);
    expect(
      resolveAdjustmentAmount({
        kind: "addon",
        mode: "naira",
        value: 5000,
        subtotalNgn: 440000,
      }),
    ).toBe(5000);
  });

  it("takes percentages against the subtotal", () => {
    expect(
      resolveAdjustmentAmount({
        kind: "discount",
        mode: "percent",
        value: 10,
        subtotalNgn: 440000,
      }),
    ).toBe(-44000);
  });

  it("ignores a stray minus sign rather than flipping the sign", () => {
    expect(
      resolveAdjustmentAmount({
        kind: "discount",
        mode: "naira",
        value: -40000,
        subtotalNgn: 440000,
      }),
    ).toBe(-40000);
  });

  it("rounds to the kobo, matching numeric(12,2)", () => {
    expect(
      resolveAdjustmentAmount({
        kind: "discount",
        mode: "percent",
        value: 7.5,
        subtotalNgn: 439992,
      }),
    ).toBe(-32999.4);
  });
});

describe("adjustment options", () => {
  it("resolves known ids and rejects unknown ones", () => {
    expect(adjustmentOption("sibling")?.label).toBe("Sibling discount");
    expect(adjustmentOption("nope")).toBeUndefined();
  });

  it("gives every option a unique id", () => {
    const ids = ADJUSTMENT_OPTIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("formatNaira", () => {
  it("drops decimals on whole amounts", () => {
    expect(formatNaira(440000)).toBe("₦440,000");
  });

  it("keeps kobo when there is any", () => {
    expect(formatNaira(404992.5)).toBe("₦404,992.50");
  });

  it("renders negative adjustments", () => {
    expect(formatNaira(-40000)).toBe("-₦40,000");
  });
});
