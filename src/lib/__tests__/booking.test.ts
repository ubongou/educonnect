import { describe, expect, it } from "vitest";
import {
  bookingRequestSchema,
  formatSource,
  normalizeSource,
} from "@/lib/booking/schema";

const valid = {
  child_name: "Ada",
  child_age: 9,
  child_grade: "Year 4",
  curriculum: "british",
  curriculum_other: "",
  subject: "mathematics",
  learning_needs: "Help with fractions and decimals.",
  current_performance: "average",
  concerns: "",
  parent_name: "Adaeze Obi",
  parent_phone: "+234 801 234 5678",
  parent_email: "ada@example.com",
  source: "pricing-24",
};

describe("bookingRequestSchema", () => {
  it("parses a valid full submission", () => {
    expect(bookingRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an out-of-range age", () => {
    expect(bookingRequestSchema.safeParse({ ...valid, child_age: 2 }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...valid, child_age: 25 }).success).toBe(false);
  });

  it("coerces child_age from a numeric string (FormData input)", () => {
    expect(bookingRequestSchema.safeParse({ ...valid, child_age: "9" }).success).toBe(true);
  });

  it("rejects curriculum=other without curriculum_other", () => {
    const r = bookingRequestSchema.safeParse({
      ...valid,
      curriculum: "other",
      curriculum_other: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path[0] === "curriculum_other");
      expect(issue).toBeDefined();
    }
  });

  it("accepts curriculum=other when curriculum_other is provided", () => {
    const r = bookingRequestSchema.safeParse({
      ...valid,
      curriculum: "other",
      curriculum_other: "Cambridge IGCSE",
    });
    expect(r.success).toBe(true);
  });

  it("ignores curriculum_other when curriculum != other", () => {
    const r = bookingRequestSchema.safeParse({
      ...valid,
      curriculum: "british",
      curriculum_other: "ignored",
    });
    expect(r.success).toBe(true);
  });

  it("rejects too-short learning_needs", () => {
    expect(
      bookingRequestSchema.safeParse({ ...valid, learning_needs: "hi" }).success,
    ).toBe(false);
  });

  it("rejects bad email", () => {
    expect(
      bookingRequestSchema.safeParse({ ...valid, parent_email: "not-an-email" }).success,
    ).toBe(false);
  });
});

describe("formatSource", () => {
  it("maps known IDs to human labels", () => {
    expect(formatSource("hero")).toBe("Home page · Hero CTA");
    expect(formatSource("nav")).toBe("Top navigation");
    expect(formatSource("pricing-24")).toBe("Pricing page · 24 sessions plan");
  });

  it("falls back to the direct label for unknown values", () => {
    expect(formatSource("random-string")).toBe("Direct visit (no source)");
    expect(formatSource("")).toBe("Direct visit (no source)");
  });
});

describe("normalizeSource", () => {
  it("preserves known IDs", () => {
    expect(normalizeSource("nav")).toBe("nav");
    expect(normalizeSource("pricing-8")).toBe("pricing-8");
  });

  it("coerces unknown / null / undefined to 'direct'", () => {
    expect(normalizeSource("garbage")).toBe("direct");
    expect(normalizeSource(undefined)).toBe("direct");
    expect(normalizeSource(null)).toBe("direct");
  });
});
