import { z } from "zod";

// -----------------------------------------------------------------------------
// Strategy-session landing-page lead form.
//
// This is deliberately SEPARATE from the shared /book questionnaire
// (src/lib/booking/schema.ts). The ad landing page asks a different set of
// questions and its submissions are exported to Google Sheets + Zoho CRM rather
// than persisted in Supabase. We reuse only the source-attribution helpers.
// -----------------------------------------------------------------------------

export {
  formatSource,
  normalizeSource,
  type SourceId,
} from "@/lib/booking/schema";

// --- Age range --------------------------------------------------------------
export const ageRangeValues = [
  "under_5",
  "5_7",
  "8_10",
  "11_13",
  "14_16",
  "17_plus",
] as const;
export type AgeRange = (typeof ageRangeValues)[number];

export const ageRangeLabel: Record<AgeRange, string> = {
  under_5: "Under 5",
  "5_7": "5–7 years",
  "8_10": "8–10 years",
  "11_13": "11–13 years",
  "14_16": "14–16 years",
  "17_plus": "17+ years",
};

// --- School level -----------------------------------------------------------
export const schoolLevelValues = [
  "preschool",
  "primary",
  "middle",
  "high",
  "college",
] as const;
export type SchoolLevel = (typeof schoolLevelValues)[number];

export const schoolLevelLabel: Record<SchoolLevel, string> = {
  preschool: "Preschool / Kindergarten",
  primary: "Primary School",
  middle: "Middle School",
  high: "High School",
  college: "College / University",
};

// --- Tutoring history -------------------------------------------------------
export const tutoredBeforeValues = ["yes", "no"] as const;
export type TutoredBefore = (typeof tutoredBeforeValues)[number];

export const tutoredBeforeLabel: Record<TutoredBefore, string> = {
  yes: "Yes",
  no: "No",
};

// --- Timeline ---------------------------------------------------------------
export const timelineValues = [
  "immediately",
  "within_30_days",
  "1_3_months",
  "just_exploring",
] as const;
export type Timeline = (typeof timelineValues)[number];

export const timelineLabel: Record<Timeline, string> = {
  immediately: "Immediately",
  within_30_days: "Within 30 Days",
  "1_3_months": "1–3 Months",
  just_exploring: "Just exploring",
};

// --- Subjects (multi-select) ------------------------------------------------
export const strategySubjectValues = [
  "mathematics",
  "english",
  "science",
  "other",
] as const;
export type StrategySubject = (typeof strategySubjectValues)[number];

export const strategySubjectLabel: Record<StrategySubject, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
  other: "Other",
};

// -----------------------------------------------------------------------------
// Schema. Used as the server-action validation gate and to type the client.
// -----------------------------------------------------------------------------

export const strategyLeadSchema = z
  .object({
    child_age_range: z.enum(ageRangeValues, {
      message: "Select an age range",
    }),
    school_level: z.enum(schoolLevelValues, {
      message: "Select a school level",
    }),
    parent_name: z.string().trim().min(1, "Full name is required").max(120),
    tutored_before: z.enum(tutoredBeforeValues, {
      message: "Let us know if your child has been tutored before",
    }),
    timeline: z.enum(timelineValues, { message: "Pick a timeframe" }),
    country: z.string().trim().min(1, "Select your country").max(80),
    parent_phone: z
      .string()
      .trim()
      .min(6, "Phone number is required")
      .max(30, "Phone number is too long"),
    subjects: z
      .array(z.enum(strategySubjectValues))
      .min(1, "Pick at least one subject"),
    subject_other: z.string().trim().max(120).default(""),
    parent_email: z.string().trim().email("Enter a valid email address").max(200),
    source: z.string().default("direct"),
  })
  .refine(
    (data) => !data.subjects.includes("other") || data.subject_other.length > 0,
    { message: "Please specify the other subject", path: ["subject_other"] },
  );

export type StrategyLeadInput = z.infer<typeof strategyLeadSchema>;

// Human-readable subjects string for emails / Sheets / Zoho.
export function formatSubjects(input: StrategyLeadInput): string {
  return input.subjects
    .map((s) =>
      s === "other" && input.subject_other
        ? `Other — ${input.subject_other}`
        : strategySubjectLabel[s],
    )
    .join(", ");
}
