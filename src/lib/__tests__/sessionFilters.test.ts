import { describe, expect, it } from "vitest";
import {
  ascendingFor,
  dateRangeFor,
  isDeletableSession,
  pageRange,
  parseSessionFilters,
  sessionFiltersToQuery,
  totalPages,
} from "@/lib/sessions/filters";

// A Wednesday, mid-month, so week/month boundaries are both non-trivial.
const TODAY = "2026-08-05";

describe("dateRangeFor", () => {
  it("treats today as upcoming, not past", () => {
    expect(dateRangeFor("upcoming", TODAY)).toEqual({ from: "2026-08-05" });
    expect(dateRangeFor("past", TODAY)).toEqual({ to: "2026-08-04" });
  });

  it("anchors the week to Monday", () => {
    expect(dateRangeFor("week", TODAY)).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
  });

  it("anchors the week to Monday when today is a Sunday", () => {
    expect(dateRangeFor("week", "2026-08-09")).toEqual({
      from: "2026-08-03",
      to: "2026-08-09",
    });
  });

  it("covers the whole calendar month", () => {
    expect(dateRangeFor("month", TODAY)).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("handles short months and leap years", () => {
    expect(dateRangeFor("month", "2026-02-10").to).toBe("2026-02-28");
    expect(dateRangeFor("month", "2028-02-10").to).toBe("2028-02-29");
  });

  it("crosses month and year boundaries when shifting back 30 days", () => {
    expect(dateRangeFor("last30", "2026-01-15")).toEqual({
      from: "2025-12-16",
      to: "2026-01-15",
    });
  });

  it("leaves 'all' unbounded so nothing is hidden", () => {
    expect(dateRangeFor("all", TODAY)).toEqual({});
  });
});

describe("ascendingFor", () => {
  it("reads forward-looking views soonest-first", () => {
    expect(ascendingFor("upcoming")).toBe(true);
    expect(ascendingFor("week")).toBe(true);
  });

  it("reads historical views newest-first", () => {
    expect(ascendingFor("past")).toBe(false);
    expect(ascendingFor("last30")).toBe(false);
    expect(ascendingFor("all")).toBe(false);
  });
});

describe("parseSessionFilters", () => {
  it("defaults to the upcoming view, page 1, no filters", () => {
    expect(parseSessionFilters({})).toEqual({
      student: null,
      teacher: null,
      subject: null,
      status: null,
      range: "upcoming",
      page: 1,
    });
  });

  it("rejects unknown presets and statuses rather than querying on them", () => {
    const s = parseSessionFilters({ range: "nonsense", status: "bogus" });
    expect(s.range).toBe("upcoming");
    expect(s.status).toBeNull();
  });

  it("clamps malformed page numbers to 1", () => {
    expect(parseSessionFilters({ page: "0" }).page).toBe(1);
    expect(parseSessionFilters({ page: "-3" }).page).toBe(1);
    expect(parseSessionFilters({ page: "abc" }).page).toBe(1);
    expect(parseSessionFilters({ page: "2.5" }).page).toBe(1);
  });

  it("keeps valid values", () => {
    const s = parseSessionFilters({
      student: "stu-1",
      teacher: "tea-1",
      subject: "sub-1",
      status: "cancelled",
      range: "past",
      page: "3",
    });
    expect(s).toEqual({
      student: "stu-1",
      teacher: "tea-1",
      subject: "sub-1",
      status: "cancelled",
      range: "past",
      page: 3,
    });
  });
});

describe("sessionFiltersToQuery", () => {
  it("omits defaults so the canonical view has a clean URL", () => {
    expect(sessionFiltersToQuery({ range: "upcoming", page: 1 })).toBe("");
    expect(sessionFiltersToQuery({})).toBe("");
  });

  it("round-trips through parseSessionFilters", () => {
    const state = {
      student: "stu-1",
      teacher: "tea-1",
      subject: "sub-1",
      status: "no_show",
      range: "past" as const,
      page: 4,
    };
    const query = sessionFiltersToQuery(state);
    const parsed = parseSessionFilters(
      Object.fromEntries(new URLSearchParams(query.slice(1))),
    );
    expect(parsed).toEqual(state);
  });
});

describe("pagination", () => {
  it("produces inclusive zero-based ranges", () => {
    expect(pageRange(1)).toEqual([0, 49]);
    expect(pageRange(2)).toEqual([50, 99]);
    expect(pageRange(3, 10)).toEqual([20, 29]);
  });

  it("always reports at least one page, even when empty", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(1)).toBe(1);
    expect(totalPages(50)).toBe(1);
    expect(totalPages(51)).toBe(2);
    expect(totalPages(137)).toBe(3);
  });
});

describe("isDeletableSession", () => {
  it("allows scheduled, cancelled and no-show rows without a report", () => {
    expect(isDeletableSession({ status: "scheduled", lesson_report_id: null })).toBe(true);
    expect(isDeletableSession({ status: "cancelled", lesson_report_id: null })).toBe(true);
    expect(isDeletableSession({ status: "no_show", lesson_report_id: null })).toBe(true);
  });

  it("refuses anything completed, or anything carrying a report", () => {
    expect(isDeletableSession({ status: "completed", lesson_report_id: null })).toBe(false);
    expect(isDeletableSession({ status: "scheduled", lesson_report_id: "rep-1" })).toBe(false);
    expect(isDeletableSession({ status: "completed", lesson_report_id: "rep-1" })).toBe(false);
  });
});
