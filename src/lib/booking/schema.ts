import { z } from "zod";

// -----------------------------------------------------------------------------
// Enum values + display labels. Snake-case in storage; human in UI/email.
// -----------------------------------------------------------------------------

export const curriculumValues = [
  "american",
  "british",
  "canadian",
  "nigerian",
  "other",
] as const;
export type Curriculum = (typeof curriculumValues)[number];

export const subjectValues = ["english", "mathematics", "science"] as const;
export type Subject = (typeof subjectValues)[number];

/** What the form offers: the standard subjects plus "Other" (free text). */
export const subjectChoiceValues = [...subjectValues, "other"] as const;
export type SubjectChoice = (typeof subjectChoiceValues)[number];

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

export const subjectChoiceLabel: Record<SubjectChoice, string> = {
  ...subjectLabel,
  other: "Other",
};

/**
 * The ticked subjects in words, with "Other" replaced by what the parent
 * typed: "Mathematics, Science and Yoruba".
 */
export function describeSubjects(
  subjects: readonly string[],
  other?: string,
): string {
  const names = subjects.flatMap((s) => {
    if (s === "other") return other?.trim() ? [other.trim()] : [];
    return s in subjectLabel ? [subjectLabel[s as Subject]] : [];
  });
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The single `subject` column: the first standard subject ticked, else "other". */
export function primarySubject(subjects: readonly string[]): SubjectChoice {
  const standard = subjects.find((s): s is Subject =>
    (subjectValues as readonly string[]).includes(s),
  );
  return standard ?? "other";
}

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
  "footer",
  "pricing-8",
  "pricing-24",
  "pricing-48",
  // /strategy-session ad landing page. Each on-page CTA passes its own
  // ss-* id so the admin email shows exactly which section drove the lead.
  "ss-hero",
  "ss-offer",
  "ss-testimonials",
  "ss-guarantee",
  "ss-final",
  "ss-sticky",
  // Home, hub and search landing pages. The *-any-subject / *-any-exam ids
  // are the "Don't see your child's subject?" tiles.
  "home-any-subject",
  "tutoring",
  "tutoring-any-subject",
  "exams",
  "exams-any-exam",
  "seo-subject",
  "seo-country",
  "about",
  "guide",
  "promise",
  "404",
  "direct",
] as const;
export type SourceId = (typeof sourceIds)[number];

const sourceLabels: Record<SourceId, string> = {
  hero: "Home page · Hero CTA",
  nav: "Top navigation",
  footer: "Footer",
  "pricing-8": "Pricing page · 8 sessions plan",
  "pricing-24": "Pricing page · 24 sessions plan",
  "pricing-48": "Pricing page · 48 sessions plan",
  "ss-hero": "Strategy session · Hero CTA",
  "ss-offer": "Strategy session · After the offer",
  "ss-testimonials": "Strategy session · After testimonials",
  "ss-guarantee": "Strategy session · After the guarantee",
  "ss-final": "Strategy session · Final CTA",
  "ss-sticky": "Strategy session · Sticky mobile bar",
  "home-any-subject": "Home page · Ask about a subject",
  tutoring: "Online tutoring page",
  "tutoring-any-subject": "Online tutoring page · Ask about a subject",
  exams: "Exams page",
  "exams-any-exam": "Exams page · Ask about an exam",
  "seo-subject": "Subject page (search)",
  "seo-country": "Country page (search)",
  about: "About page",
  guide: "Parent guide page",
  promise: "Our promise page",
  "404": "Page not found",
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
  // Each parent guide passes guide-<slug>; they all report as "guide".
  if (typeof raw === "string" && raw.startsWith("guide-")) return "guide";
  return "direct";
}

/** The plan size behind a pricing-page CTA, e.g. "pricing-24" → 24. */
export function pricingPlanFromSource(source: string): number | null {
  const m = /^pricing-(\d+)$/.exec(source);
  return m ? Number(m[1]) : null;
}

/** Pre-selects the trial subject from a ?subject= param; ignores anything unknown. */
export function normalizeSubject(raw: unknown): Subject | undefined {
  return typeof raw === "string" && (subjectValues as readonly string[]).includes(raw)
    ? (raw as Subject)
    : undefined;
}

// /tutoring/[slug] pages that map onto one of the form's subjects.
const subjectForSlug: Record<string, Subject> = {
  maths: "mathematics",
  english: "english",
  "reading-and-creative-writing": "english",
  science: "science",
  biology: "science",
  chemistry: "science",
  physics: "science",
};

/** /book href for a CTA, pre-selecting the subject when the page has one. */
export function bookHref(source: string, pageSlug?: string): string {
  const subject = pageSlug ? subjectForSlug[pageSlug] : undefined;
  return subject
    ? `/book?source=${source}&subject=${subject}`
    : `/book?source=${source}`;
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
    subjects: z
      .array(z.enum(subjectChoiceValues), { message: "Pick at least one subject" })
      .min(1, "Pick at least one subject"),
    subject_other: z.string().trim().max(120).default(""),
    // Optional since the form was shortened: one free-text box replaced the
    // separate learning-needs and concerns boxes. Stored as "" when skipped
    // (the column is NOT NULL).
    learning_needs: z.string().trim().max(1000).default(""),
    // No longer asked on the form (the tutor judges this on the call). The
    // column is NOT NULL with a check constraint, so it defaults to not_sure.
    current_performance: z.enum(performanceValues).default("not_sure"),
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
  )
  .refine(
    (data) => !data.subjects.includes("other") || data.subject_other.length > 0,
    { message: "Tell us which subject", path: ["subject_other"] },
  );

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
