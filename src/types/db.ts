/**
 * Supabase `Database` type for EduConnect LMS.
 *
 * This file is hand-authored to mirror the schema defined in
 * `supabase/migrations/0001_init.sql` because Docker is not running locally
 * and we can't invoke `npm run db:types` against the Supabase CLI stack yet.
 *
 * When Docker is running (or a cloud project has been linked), regenerate
 * this file authoritatively with:
 *
 *     npm run db:types
 *
 * That command is defined in package.json as
 *     supabase gen types typescript --local > src/types/db.ts
 *
 * Until then, treat the types below as the canonical shape and keep them in
 * sync with migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
// Intake JSONB shape (validated at the app layer via zod in src/lib/validation)
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

// -----------------------------------------------------------------------------
// Database type (Supabase-client-compatible shape)
// -----------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: Role;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          registration_number: string;
          full_name: string;
          preferred_name: string | null;
          age: number | null;
          gender: Gender | null;
          current_school: string | null;
          curriculum: Curriculum | null;
          curriculum_other: string | null;
          intake: IntakeJson;
          intake_submitted_at: string | null;
          added_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_number: string;
          full_name: string;
          preferred_name?: string | null;
          age?: number | null;
          gender?: Gender | null;
          current_school?: string | null;
          curriculum?: Curriculum | null;
          curriculum_other?: string | null;
          intake?: IntakeJson;
          intake_submitted_at?: string | null;
          added_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      parent_students: {
        Row: {
          parent_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          parent_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parent_students"]["Insert"]>;
        Relationships: [];
      };
      intake_files: {
        Row: {
          id: string;
          student_id: string;
          kind: IntakeFileKind;
          original_filename: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          kind: IntakeFileKind;
          original_filename: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["intake_files"]["Insert"]>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Insert"]>;
        Relationships: [];
      };
      subject_skills: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["subject_skills"]["Insert"]>;
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          requested_by: string;
          status: EnrollmentStatus;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          requested_by: string;
          status?: EnrollmentStatus;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
        Relationships: [];
      };
      lesson_reports: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          lesson_date: string;
          duration_minutes: number;
          lesson_focus: string;
          understanding_check: number;
          confidence_level: number;
          lesson_highlights: string | null;
          participation: number;
          focus_rating: number;
          homework: number;
          next_focus: string | null;
          how_to_help_at_home: string | null;
          uploaded_by: string;
          emailed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          lesson_date: string;
          duration_minutes: number;
          lesson_focus: string;
          understanding_check: number;
          confidence_level: number;
          lesson_highlights?: string | null;
          participation: number;
          focus_rating: number;
          homework: number;
          next_focus?: string | null;
          how_to_help_at_home?: string | null;
          uploaded_by: string;
          emailed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_reports"]["Insert"]>;
        Relationships: [];
      };
      lesson_report_skill_ratings: {
        Row: {
          lesson_report_id: string;
          skill_id: string;
          rating: number;
        };
        Insert: {
          lesson_report_id: string;
          skill_id: string;
          rating: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["lesson_report_skill_ratings"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
      next_registration_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_student_with_intake: {
        Args: {
          p_full_name: string;
          p_preferred_name: string | null;
          p_age: number | null;
          p_gender: Gender | null;
          p_current_school: string | null;
          p_curriculum: Curriculum | null;
          p_curriculum_other: string | null;
          p_intake: IntakeJson;
        };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      create_lesson_report: {
        Args: {
          p_student_id: string;
          p_subject_id: string;
          p_lesson_date: string;
          p_duration_minutes: number;
          p_lesson_focus: string;
          p_understanding_check: number;
          p_confidence_level: number;
          p_lesson_highlights: string | null;
          p_participation: number;
          p_focus_rating: number;
          p_homework: number;
          p_next_focus: string | null;
          p_how_to_help_at_home: string | null;
          p_skill_ratings: Array<{ skill_id: string; rating: number }>;
        };
        Returns: Database["public"]["Tables"]["lesson_reports"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
