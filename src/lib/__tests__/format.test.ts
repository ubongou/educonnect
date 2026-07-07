import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatRegistrationNumber,
  formatDate,
  formatSkillRating,
} from "@/lib/format";

describe("formatDuration", () => {
  it("formats minutes only below an hour", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formats whole hours without trailing minutes", () => {
    expect(formatDuration(120)).toBe("2 hr");
  });

  it("formats hours plus minutes", () => {
    expect(formatDuration(75)).toBe("1 hr 15 min");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0 min");
  });
});

describe("formatRegistrationNumber", () => {
  it("passes through a valid registration number", () => {
    expect(formatRegistrationNumber("EC-2026-00042")).toBe("EC-2026-00042");
  });

  it("returns the raw value when the shape is wrong", () => {
    expect(formatRegistrationNumber("ec-2026-42")).toBe("ec-2026-42");
  });
});

describe("formatDate", () => {
  it("formats an ISO date to en-GB day/month/year", () => {
    expect(formatDate("2026-04-10")).toBe("10 Apr 2026");
  });

  it("keeps a date-only string on the same calendar day regardless of timezone", () => {
    // Parsed as UTC midnight; must not roll back to 30 Nov for viewers west of UTC.
    expect(formatDate("2026-12-01")).toBe("01 Dec 2026");
  });

  it("accepts a Date instance", () => {
    // Local-midnight Date so the assertion is timezone-independent.
    expect(formatDate(new Date(2026, 11, 1))).toBe("01 Dec 2026");
  });
});

describe("formatSkillRating", () => {
  it("renders integer ratings", () => {
    expect(formatSkillRating(3)).toBe("3/5");
  });

  it("rounds fractional ratings", () => {
    expect(formatSkillRating(3.6)).toBe("4/5");
  });

  it("clamps values above 5", () => {
    expect(formatSkillRating(12)).toBe("5/5");
  });

  it("clamps negative values", () => {
    expect(formatSkillRating(-2)).toBe("0/5");
  });

  it("returns em-dash for non-finite inputs", () => {
    expect(formatSkillRating(Number.NaN)).toBe("—");
  });
});
