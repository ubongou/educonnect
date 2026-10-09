import { describe, expect, it } from "vitest";
import {
  bookHref,
  bookingRequestSchema,
  describeSubjects,
  formatSource,
  normalizeSource,
  normalizeSubject,
  pricingPlanFromSource,
  primarySubject,
} from "@/lib/booking/schema";

const valid = {
  child_name: "Ada",
  child_age: 9,
  child_grade: "Year 4",
  curriculum: "british",
  curriculum_other: "",
  subjects: ["mathematics"],
  subject_other: "",
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

  it("accepts an empty learning_needs (now optional)", () => {
    const r = bookingRequestSchema.safeParse({ ...valid, learning_needs: "" });
    expect(r.success).toBe(true);
  });

  it("defaults current_performance to not_sure when not asked", () => {
    const rest: Partial<typeof valid> = { ...valid };
    delete rest.current_performance;
    const r = bookingRequestSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.current_performance).toBe("not_sure");
  });

  it("accepts several subjects", () => {
    const r = bookingRequestSchema.safeParse({
      ...valid,
      subjects: ["mathematics", "science"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects no subjects", () => {
    const r = bookingRequestSchema.safeParse({ ...valid, subjects: [] });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "subjects")).toBe(true);
    }
  });

  it("requires subject_other when Other is ticked", () => {
    const missing = bookingRequestSchema.safeParse({
      ...valid,
      subjects: ["other"],
      subject_other: "",
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.issues.some((i) => i.path[0] === "subject_other")).toBe(true);
    }
    expect(
      bookingRequestSchema.safeParse({
        ...valid,
        subjects: ["other"],
        subject_other: "Yoruba",
      }).success,
    ).toBe(true);
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
    expect(formatSource("footer")).toBe("Footer");
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

  it("groups every guide-<slug> under 'guide'", () => {
    expect(normalizeSource("guide-how-much-does-a-tutor-cost")).toBe("guide");
    expect(normalizeSource("404")).toBe("404");
  });
});

describe("booking sources", () => {
  // Every ?source= a public CTA sends. Anything that normalises to "direct"
  // here is a lead the admin email would mis-attribute.
  const ctaSources = [
    "hero",
    "nav",
    "footer",
    "pricing-8",
    "pricing-24",
    "pricing-48",
    "home-any-subject",
    "tutoring",
    "tutoring-any-subject",
    "exams",
    "exams-any-exam",
    "seo-subject",
    "seo-country",
    "about",
    "guide",
    "guide-some-slug",
    "promise",
    "404",
  ];

  it.each(ctaSources)("attributes %s", (src) => {
    expect(normalizeSource(src)).not.toBe("direct");
    expect(formatSource(normalizeSource(src))).not.toBe(formatSource("direct"));
  });

  it("falls back to direct for unknown or missing sources", () => {
    expect(normalizeSource("nope")).toBe("direct");
    expect(normalizeSource(null)).toBe("direct");
  });

  it("reads the plan size from pricing sources only", () => {
    expect(pricingPlanFromSource("pricing-24")).toBe(24);
    expect(pricingPlanFromSource("hero")).toBeNull();
  });
});

describe("subject pre-selection", () => {
  it("accepts only known subjects", () => {
    expect(normalizeSubject("mathematics")).toBe("mathematics");
    expect(normalizeSubject("history")).toBeUndefined();
    expect(normalizeSubject(null)).toBeUndefined();
  });

  it("adds the subject to /book links from mapped subject pages", () => {
    expect(bookHref("seo-subject", "maths")).toBe(
      "/book?source=seo-subject&subject=mathematics",
    );
    expect(bookHref("seo-subject", "physics")).toBe(
      "/book?source=seo-subject&subject=science",
    );
    expect(bookHref("seo-subject", "11-plus")).toBe("/book?source=seo-subject");
    expect(bookHref("seo-country")).toBe("/book?source=seo-country");
  });
});

describe("subject helpers", () => {
  it("describes the ticked subjects in words", () => {
    expect(describeSubjects(["mathematics"])).toBe("Mathematics");
    expect(describeSubjects(["english", "science"])).toBe("English and Science");
    expect(describeSubjects(["mathematics", "science", "other"], "Yoruba")).toBe(
      "Mathematics, Science and Yoruba",
    );
    expect(describeSubjects(["other"], "  ")).toBe("");
  });

  it("picks the first standard subject for the single subject column", () => {
    expect(primarySubject(["other", "science", "english"])).toBe("science");
    expect(primarySubject(["other"])).toBe("other");
  });
});
