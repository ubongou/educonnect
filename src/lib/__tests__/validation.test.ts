import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  intakeSchema,
  enrollmentRequestSchema,
  lessonReportSchema,
} from "@/lib/validation";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_C = "33333333-3333-4333-8333-333333333333";

describe("signupSchema", () => {
  it("rejects empty email", () => {
    const r = signupSchema.safeParse({
      email: "",
      password: "pass1234",
      full_name: "A",
      phone: "1",
    });
    expect(r.success).toBe(false);
  });

  it("rejects short password", () => {
    const r = signupSchema.safeParse({
      email: "a@b.co",
      password: "short",
      full_name: "A",
      phone: "1",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a valid payload", () => {
    const r = signupSchema.safeParse({
      email: "a@b.co",
      password: "pass1234",
      full_name: "A",
      phone: "+234123",
    });
    expect(r.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects malformed email", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "x" }).success,
    ).toBe(false);
  });

  it("accepts a valid payload", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x" }).success,
    ).toBe(true);
  });
});

describe("intakeSchema", () => {
  it("accepts an empty object", () => {
    expect(intakeSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a partial intake with enum values", () => {
    const r = intakeSchema.safeParse({
      strengths: { interests: ["reading", "music"] },
      behaviour: { attention_span: "short_bursts", work_preference: "mix" },
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown enum in interests", () => {
    const r = intakeSchema.safeParse({
      strengths: { interests: ["something-else"] },
    });
    expect(r.success).toBe(false);
  });

  it("rejects verbal_expression_comfort outside 1..5", () => {
    const r = intakeSchema.safeParse({
      personality: { verbal_expression_comfort: 7 },
    });
    expect(r.success).toBe(false);
  });
});

describe("enrollmentRequestSchema", () => {
  it("rejects non-uuid ids", () => {
    expect(
      enrollmentRequestSchema.safeParse({
        student_id: "abc",
        subject_id: "def",
      }).success,
    ).toBe(false);
  });

  it("accepts uuid ids", () => {
    expect(
      enrollmentRequestSchema.safeParse({
        student_id: UUID_A,
        subject_id: UUID_B,
      }).success,
    ).toBe(true);
  });
});

describe("lessonReportSchema", () => {
  const valid = {
    student_id: UUID_A,
    subject_id: UUID_B,
    lesson_date: "2026-04-10",
    duration_minutes: 60,
    lesson_focus: "Fractions",
    understanding_check: 3,
    confidence_level: 3,
    participation: 3,
    focus_rating: 3,
    homework: 3,
    skill_ratings: [{ skill_id: UUID_C, rating: 4 }],
  };

  it("accepts a valid report", () => {
    expect(lessonReportSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects behaviour rating > 10", () => {
    const r = lessonReportSchema.safeParse({ ...valid, participation: 11 });
    expect(r.success).toBe(false);
  });

  it("accepts understanding_check = 10 (top of 1–10 scale)", () => {
    const r = lessonReportSchema.safeParse({ ...valid, understanding_check: 10 });
    expect(r.success).toBe(true);
  });

  it("rejects understanding_check = 0 (scale starts at 1)", () => {
    const r = lessonReportSchema.safeParse({ ...valid, understanding_check: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects duration_minutes > 600", () => {
    const r = lessonReportSchema.safeParse({ ...valid, duration_minutes: 601 });
    expect(r.success).toBe(false);
  });

  it("rejects malformed lesson_date", () => {
    const r = lessonReportSchema.safeParse({ ...valid, lesson_date: "10/04/2026" });
    expect(r.success).toBe(false);
  });

  it("rejects skill ratings > 10", () => {
    const r = lessonReportSchema.safeParse({
      ...valid,
      skill_ratings: [{ skill_id: UUID_C, rating: 11 }],
    });
    expect(r.success).toBe(false);
  });

  it("defaults skill_ratings to empty array when omitted", () => {
    const r = lessonReportSchema.safeParse({
      student_id: valid.student_id,
      subject_id: valid.subject_id,
      lesson_date: valid.lesson_date,
      duration_minutes: valid.duration_minutes,
      lesson_focus: valid.lesson_focus,
      understanding_check: valid.understanding_check,
      confidence_level: valid.confidence_level,
      participation: valid.participation,
      focus_rating: valid.focus_rating,
      homework: valid.homework,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.skill_ratings).toEqual([]);
  });
});
