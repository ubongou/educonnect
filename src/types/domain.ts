/**
 * Narrow domain types — complement the auto-generated `Database` type in
 * `src/types/db.ts`.
 *
 * Supabase's type generator widens CHECK-constrained columns (role, status,
 * gender, etc.) to plain `string`, and JSONB columns to generic `Json`.
 * These aliases re-narrow those columns at the app layer. Use them for
 * switch-exhaustiveness, form enums, and RPC arg types.
 *
 * Kept in sync with the CHECK clauses in
 * `supabase/migrations/0001_init.sql`.
 */

export type Role = "parent" | "admin";

export type Gender = "male" | "female" | "prefer_not_to_say";

export type Curriculum =
  | "british"
  | "nigerian"
  | "american"
  | "not_sure"
  | "other";

export type IntakeFileKind = "curriculum" | "school_report" | "class_notes";

export type EnrollmentStatus = "pending" | "approved" | "rejected";

// -----------------------------------------------------------------------------
// Intake JSONB (validated at the app layer via zod in src/lib/validation)
// -----------------------------------------------------------------------------

export type IntakeJson = {
  learning_background?: {
    prior_tutoring?: "yes" | "no";
    prior_tutoring_notes?: string;
    recent_changes?: string;
  };
  strengths?: {
    enjoys_or_excels_at?: string;
    confident_situations?: string;
    interests?: Array<
      "reading" | "writing" | "music" | "sports" | "art" | "games" | "technology"
    >;
  };
  challenges?: {
    challenging_areas?: string;
    struggling_subjects?: string;
    response_when_difficult?:
      | "tries_again"
      | "asks_for_help"
      | "gets_frustrated"
      | "withdraws"
      | "it_depends";
    main_concerns?: string;
  };
  motivation?: {
    motivators?: Array<
      | "praise"
      | "rewards"
      | "challenge"
      | "independence"
      | "competition"
      | "structured_guidance"
      | "not_sure"
    >;
    demotivators?: string;
  };
  behaviour?: {
    attention_span?:
      | "very_focused"
      | "short_bursts"
      | "easily_distracted"
      | "needs_supervision"
      | "varies";
    work_preference?: "alone" | "with_guidance" | "mix";
    how_communicates_confusion?: string;
    helpful_routines?: string;
  };
  personality?: {
    description?: string;
    traits?: Array<
      | "quiet"
      | "talkative"
      | "curious"
      | "shy"
      | "confident"
      | "careful"
      | "perfectionist"
      | "easily_distracted"
      | "reflective"
      | "independent"
    >;
    verbal_expression_comfort?: 1 | 2 | 3 | 4 | 5;
  };
  goals?: {
    improvement_8_12_weeks?: string;
    breakthrough_priority?: string;
  };
};
