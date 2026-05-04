import { z } from "zod";

// -----------------------------------------------------------------------------
// Enum values + display labels. Snake-case in storage; human in UI/email.
// -----------------------------------------------------------------------------

export const curriculumValues = [
  "nigerian",
  "british",
  "american",
  "canadian",
  "other",
] as const;
export type Curriculum = (typeof curriculumValues)[number];

export const subjectValues = ["english", "mathematics", "science"] as const;
export type Subject = (typeof subjectValues)[number];

export const performanceValues = [
  "excellent",
  "good",
  "average",
  "needs_improvement",
  "not_sure",
] as const;
export type Performance = (typeof performanceValues)[number];

export const curriculumLabel: Record<Curriculum, string> = {
  nigerian: "Nigerian",
  british: "British",
  american: "American",
  canadian: "Canadian",
  other: "Other",
};

export const subjectLabel: Record<Subject, string> = {
  english: "English",
  mathematics: "Mathematics",
  science: "Science",
};

export const performanceLabel: Record<Performance, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  needs_improvement: "Needs Improvement",
  not_sure: "Not Sure",
};

// -----------------------------------------------------------------------------
// Source-of-click. Each public CTA passes one of these as ?source=…; anything
// else (including a missing param) is normalised to "direct".
// -----------------------------------------------------------------------------

export const sourceIds = [
  "hero",
  "nav",
  "pricing-8",
  "pricing-24",
  "pricing-48",
  "direct",
] as const;
export type SourceId = (typeof sourceIds)[number];

const sourceLabels: Record<SourceId, string> = {
  hero: "Home page · Hero CTA",
  nav: "Top navigation",
  "pricing-8": "Pricing page · 8 sessions plan",
  "pricing-24": "Pricing page · 24 sessions plan",
  "pricing-48": "Pricing page · 48 sessions plan",
  direct: "Direct visit (no source)",
};

export function formatSource(source: string): string {
  if ((sourceIds as readonly string[]).includes(source)) {
    return sourceLabels[source as SourceId];
  }
  return sourceLabels.direct;
}

export function normalizeSource(raw: unknown): SourceId {
  if (typeof raw === "string" && (sourceIds as readonly string[]).includes(raw)) {
    return raw as SourceId;
  }
  return "direct";
}

// -----------------------------------------------------------------------------
// The form schema. Used both in the server action (validation gate) and in
// the client (types + enum lists for rendering).
// -----------------------------------------------------------------------------

export const bookingRequestSchema = z
  .object({
    child_name: z.string().trim().min(1, "Child's name is required").max(120),
    child_age: z.coerce
      .number({ message: "Age must be a number" })
      .int("Age must be a whole number")
      .min(3, "Age must be at least 3")
      .max(19, "Age must be 19 or under"),
    child_grade: z.string().trim().min(1, "Class / grade is required").max(80),
    curriculum: z.enum(curriculumValues, { message: "Pick a curriculum" }),
    curriculum_other: z.string().trim().max(120).default(""),
    subject: z.enum(subjectValues, { message: "Pick a subject" }),
    learning_needs: z
      .string()
      .trim()
      .min(5, "Tell us a little more (5+ characters)")
      .max(1000),
    current_performance: z.enum(performanceValues, {
      message: "Pick a performance level",
    }),
    concerns: z.string().trim().max(1000).default(""),
    parent_name: z.string().trim().min(1, "Parent's name is required").max(120),
    parent_phone: z
      .string()
      .trim()
      .min(6, "Phone number is required")
      .max(30, "Phone number is too long"),
    parent_email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(200),
    source: z.string().default("direct"),
  })
  .refine(
    (data) => data.curriculum !== "other" || data.curriculum_other.length > 0,
    { message: "Specify the curriculum", path: ["curriculum_other"] },
  );

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
