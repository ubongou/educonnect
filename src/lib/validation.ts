import { z } from "zod";

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  phone: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

// -----------------------------------------------------------------------------
// Admin creates a teacher account (service-role path)
// -----------------------------------------------------------------------------

export const teacherCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1),
  phone: z.string().optional().default(""),
});

export type TeacherCreateInput = z.infer<typeof teacherCreateSchema>;

// -----------------------------------------------------------------------------
// Admin edits an existing parent or teacher profile (name / phone / email)
// -----------------------------------------------------------------------------

export const adminProfileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: z.string().trim().email("Enter a valid email"),
});

export type AdminProfileUpdateInput = z.infer<typeof adminProfileUpdateSchema>;

// -----------------------------------------------------------------------------
// Admin schedules a one-off session for an approved enrollment
// -----------------------------------------------------------------------------

export const sessionCreateSchema = z.object({
  enrollment_id: z.string().uuid(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  duration_minutes: z.coerce.number().int().min(15).max(240),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;

// Admin creates several future sessions for one approved enrollment at once.
export const sessionBulkCreateSchema = z.object({
  enrollment_id: z.string().uuid(),
  rows: z
    .array(
      z.object({
        session_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
        duration_minutes: z.coerce.number().int().min(15).max(240),
      }),
    )
    .min(1, "Add at least one session row."),
});

export type SessionBulkCreateInput = z.infer<typeof sessionBulkCreateSchema>;

// -----------------------------------------------------------------------------
// Admin creates an enrollment on a parent's behalf (auto-approved)
// -----------------------------------------------------------------------------

export const adminEnrollmentCreateSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  teacher_id: z.string().uuid().nullable().optional(),
});

export type AdminEnrollmentCreateInput = z.infer<typeof adminEnrollmentCreateSchema>;

// -----------------------------------------------------------------------------
// Intake — mirrors IntakeJson in src/types/domain.ts
// -----------------------------------------------------------------------------

const yesNo = z.enum(["yes", "no"]);

const learningBackgroundSchema = z.object({
  prior_tutoring: yesNo.optional(),
  prior_tutoring_notes: z.string().optional(),
  recent_changes: z.string().optional(),
});

const strengthsSchema = z.object({
  enjoys_or_excels_at: z.string().optional(),
  confident_situations: z.string().optional(),
  interests: z
    .array(
      z.enum([
        "reading",
        "writing",
        "music",
        "sports",
        "art",
        "games",
        "technology",
      ]),
    )
    .optional(),
});

const challengesSchema = z.object({
  challenging_areas: z.string().optional(),
  struggling_subjects: z.string().optional(),
  response_when_difficult: z
    .enum([
      "tries_again",
      "asks_for_help",
      "gets_frustrated",
      "withdraws",
      "it_depends",
    ])
    .optional(),
  main_concerns: z.string().optional(),
});

const motivationSchema = z.object({
  motivators: z
    .array(
      z.enum([
        "praise",
        "rewards",
        "challenge",
        "independence",
        "competition",
        "structured_guidance",
        "not_sure",
      ]),
    )
    .optional(),
  demotivators: z.string().optional(),
});

const behaviourSchema = z.object({
  attention_span: z
    .enum([
      "very_focused",
      "short_bursts",
      "easily_distracted",
      "needs_supervision",
      "varies",
    ])
    .optional(),
  work_preference: z.enum(["alone", "with_guidance", "mix"]).optional(),
  how_communicates_confusion: z.string().optional(),
  helpful_routines: z.string().optional(),
});

const personalitySchema = z.object({
  description: z.string().optional(),
  traits: z
    .array(
      z.enum([
        "quiet",
        "talkative",
        "curious",
        "shy",
        "confident",
        "careful",
        "perfectionist",
        "easily_distracted",
        "reflective",
        "independent",
      ]),
    )
    .optional(),
  verbal_expression_comfort: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .optional(),
});

const goalsSchema = z.object({
  improvement_8_12_weeks: z.string().optional(),
  breakthrough_priority: z.string().optional(),
});

export const intakeSchema = z.object({
  learning_background: learningBackgroundSchema.optional(),
  strengths: strengthsSchema.optional(),
  challenges: challengesSchema.optional(),
  motivation: motivationSchema.optional(),
  behaviour: behaviourSchema.optional(),
  personality: personalitySchema.optional(),
  goals: goalsSchema.optional(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

// -----------------------------------------------------------------------------
// Onboarding (child details + intake) — mirrors public.students CHECK clauses
// and the create_student_with_intake RPC signature.
// -----------------------------------------------------------------------------

export const childInfoSchema = z.object({
  full_name: z.string().trim().min(1, "Child's full name is required"),
  preferred_name: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  age: z.coerce.number().int().nonnegative(),
  gender: z.enum(["male", "female", "prefer_not_to_say"]),
  current_school: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  curriculum: z.enum(["british", "nigerian", "american", "not_sure", "other"]),
  curriculum_other: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type ChildInfoInput = z.infer<typeof childInfoSchema>;

// Admin creates a student directly (optionally linked to an existing parent).
// Reuses the child-info fields; intake starts empty and is filled later.
export const adminStudentCreateSchema = childInfoSchema.extend({
  parent_id: z.string().uuid().nullable().optional(),
});

export type AdminStudentCreateInput = z.infer<typeof adminStudentCreateSchema>;

export const onboardingSchema = intakeSchema.extend({
  childInfo: childInfoSchema,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// -----------------------------------------------------------------------------
// Enrollment request
// -----------------------------------------------------------------------------

export const enrollmentRequestSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
});

export type EnrollmentRequestInput = z.infer<typeof enrollmentRequestSchema>;

// -----------------------------------------------------------------------------
// Parent document upload — input to requestStudentDocumentUpload action.
// Lives here (not in actions/documents.ts) because "use server" modules can
// only export async functions; a Zod schema is an object and would break at
// runtime.
// -----------------------------------------------------------------------------

const studentDocumentKinds = [
  "test_paper",
  "school_report",
  "exam_result",
  "other",
] as const;

export const studentDocumentUploadSchema = z.object({
  studentId: z.string().uuid("Invalid student id"),
  enrollmentId: z.string().uuid("Pick a subject"),
  kind: z.enum(studentDocumentKinds, { message: "Pick a valid kind" }),
  mimeType: z.string().min(1, "Missing MIME type"),
  sizeBytes: z.number().int().positive(),
  originalFilename: z.string().min(1).max(255),
});

export type StudentDocumentUploadInput = z.infer<
  typeof studentDocumentUploadSchema
>;

// -----------------------------------------------------------------------------
// Lesson report — mirrors public.lesson_reports CHECK constraints
// -----------------------------------------------------------------------------

// Understanding + confidence use 1..10 and map to six named levels via
// src/lib/scales.ts. Behaviours and per-skill trackers use 0..10 (client
// decision: scale change from 0..5 after the inspiration was reviewed).
const rating1to10 = z.number().int().min(1).max(10);
const rating0to10 = z.number().int().min(0).max(10);

// External class-recording link (Zoom / Meet / Loom / unlisted YouTube …).
// Optional, and an empty string is treated as "no link" so the form can send
// a blank field without tripping URL validation.
const recordingUrl = z
  .string()
  .trim()
  .url("Enter a valid link")
  .startsWith("https://", "Link must start with https://")
  .max(2048, "Link is too long")
  .optional()
  .or(z.literal(""));

export const lessonReportSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  duration_minutes: z.number().int().min(1).max(600),
  lesson_focus: z.string().min(1),
  understanding_check: rating1to10,
  confidence_level: rating1to10,
  lesson_highlights: z.string().optional(),
  participation: rating0to10,
  focus_rating: rating0to10,
  homework: rating0to10,
  next_focus: z.string().optional(),
  how_to_help_at_home: z.string().optional(),
  recording_url: recordingUrl,
  skill_ratings: z
    .array(
      z.object({
        skill_id: z.string().uuid(),
        rating: rating0to10,
      }),
    )
    .default([]),
});

export type LessonReportInput = z.infer<typeof lessonReportSchema>;

// -----------------------------------------------------------------------------
// Admin bulk-imports past sessions, each with a full lesson report.
// One enrollment is chosen above the paste; each row is a completed lesson.
// Numbers are coerced so a pasted (string) table parses without pre-casting.
// duration_minutes is capped at the sessions table's 15..240 range (these
// rows become sessions). Per-skill ratings are intentionally omitted — they
// can be added later via the admin report edit screen.
// -----------------------------------------------------------------------------

const importRating1to10 = z.coerce.number().int().min(1).max(10);
const importRating0to10 = z.coerce.number().int().min(0).max(10);

export const importedSessionRowSchema = z.object({
  lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  duration_minutes: z.coerce.number().int().min(15).max(240),
  lesson_focus: z.string().min(1, "lesson_focus is required"),
  understanding_check: importRating1to10,
  confidence_level: importRating1to10,
  participation: importRating0to10,
  focus_rating: importRating0to10,
  homework: importRating0to10,
  lesson_highlights: z.string().optional(),
  next_focus: z.string().optional(),
  how_to_help_at_home: z.string().optional(),
});

export type ImportedSessionRow = z.infer<typeof importedSessionRowSchema>;

export const sessionImportSchema = z.object({
  enrollment_id: z.string().uuid(),
  rows: z.array(importedSessionRowSchema).min(1, "Paste at least one row."),
});

export type SessionImportInput = z.infer<typeof sessionImportSchema>;

// Edit payload — same shape minus student/subject (those are immutable for
// an existing report; the update RPC patches the row in place by id).
export const lessonReportEditSchema = z.object({
  lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  duration_minutes: z.number().int().min(1).max(600),
  lesson_focus: z.string().min(1),
  understanding_check: rating1to10,
  confidence_level: rating1to10,
  lesson_highlights: z.string().optional(),
  participation: rating0to10,
  focus_rating: rating0to10,
  homework: rating0to10,
  next_focus: z.string().optional(),
  how_to_help_at_home: z.string().optional(),
  recording_url: recordingUrl,
  skill_ratings: z
    .array(
      z.object({
        skill_id: z.string().uuid(),
        rating: rating0to10,
      }),
    )
    .default([]),
});

export type LessonReportEditInput = z.infer<typeof lessonReportEditSchema>;
