import { describe, expect, it } from "vitest";
import {
  ALMOST_OUT_THRESHOLD,
  canConfirm,
  compareByUrgency,
  confirmNeedsNote,
  enrollmentsWithoutPackage,
  reviewFlags,
  runwayFor,
  tallyPackage,
  type PackageSession,
} from "@/lib/packages/progress";

const s = (status: string, i = 0): PackageSession => ({
  id: `s${i}-${status}`,
  status,
  session_date: `2026-10-${String(10 + i).padStart(2, "0")}`,
});

describe("tallyPackage", () => {
  it("counts taught and no-show as done, scheduled as booked, cancelled apart", () => {
    const t = tallyPackage(8, [
      s("completed", 1),
      s("no_show", 2),
      s("scheduled", 3),
      s("scheduled", 4),
      s("cancelled", 5),
    ]);
    expect(t).toEqual({
      size: 8,
      done: 2,
      booked: 2,
      cancelled: 1,
      toBook: 4,
      remaining: 6,
    });
  });

  it("never reports negative room", () => {
    const t = tallyPackage(2, [s("completed", 1), s("completed", 2), s("scheduled", 3)]);
    expect(t.toBook).toBe(0);
    expect(t.remaining).toBe(0);
  });
});

describe("runwayFor", () => {
  it("is almost out at the threshold, not above it", () => {
    const size = 8;
    const doneUntil = (n: number) =>
      tallyPackage(size, Array.from({ length: n }, (_, i) => s("completed", i)));
    expect(runwayFor(doneUntil(size - ALMOST_OUT_THRESHOLD - 1))).toBe("running");
    expect(runwayFor(doneUntil(size - ALMOST_OUT_THRESHOLD))).toBe("almost_out");
    expect(runwayFor(doneUntil(size - 1))).toBe("almost_out");
    expect(runwayFor(doneUntil(size))).toBe("out");
  });

  it("treats a small package as almost out from the start", () => {
    expect(runwayFor(tallyPackage(2, []))).toBe("almost_out");
  });
});

describe("confirming", () => {
  it("needs at least one lesson to have happened", () => {
    expect(canConfirm(tallyPackage(4, [s("scheduled")]))).toBe(false);
    expect(canConfirm(tallyPackage(4, [s("no_show")]))).toBe(true);
  });

  it("needs a note when ending early or with lessons still upcoming", () => {
    const full = Array.from({ length: 4 }, (_, i) => s("completed", i));
    expect(confirmNeedsNote(tallyPackage(4, full))).toBe(false);
    expect(confirmNeedsNote(tallyPackage(5, full))).toBe(true);
    expect(confirmNeedsNote(tallyPackage(4, [...full.slice(0, 3), s("scheduled", 9)]))).toBe(
      true,
    );
  });
});

describe("reviewFlags", () => {
  it("flags a confirmed package whose lesson was reset", () => {
    expect(reviewFlags("complete", [s("completed"), s("scheduled", 1)])).toHaveLength(1);
    expect(reviewFlags("complete", [s("completed"), s("no_show", 1)])).toEqual([]);
  });

  it("only applies to packages waiting for review", () => {
    expect(reviewFlags("open", [s("scheduled")])).toEqual([]);
  });
});

describe("enrollmentsWithoutPackage", () => {
  it("lists enrollments with upcoming unpackaged lessons and no open package", () => {
    const out = enrollmentsWithoutPackage({
      openPackageEnrollmentIds: ["e1"],
      upcomingUnpackagedSessions: [
        { enrollment_id: "e1" },
        { enrollment_id: "e2" },
        { enrollment_id: "e2" },
      ],
    });
    expect([...out]).toEqual(["e2"]);
  });
});

describe("compareByUrgency", () => {
  it("orders out, then almost out, then fewest left", () => {
    const running = tallyPackage(8, []);
    const almost = tallyPackage(8, Array.from({ length: 6 }, (_, i) => s("completed", i)));
    const out = tallyPackage(4, Array.from({ length: 4 }, (_, i) => s("completed", i)));
    expect([running, almost, out].sort(compareByUrgency)).toEqual([out, almost, running]);
  });
});
