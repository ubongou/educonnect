export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          child_age: number
          child_grade: string
          child_name: string
          concerns: string | null
          created_at: string
          current_performance: string
          curriculum: string
          curriculum_other: string | null
          id: string
          learning_needs: string
          parent_email: string
          parent_name: string
          parent_phone: string
          source: string
          subject: string
        }
        Insert: {
          child_age: number
          child_grade: string
          child_name: string
          concerns?: string | null
          created_at?: string
          current_performance: string
          curriculum: string
          curriculum_other?: string | null
          id?: string
          learning_needs: string
          parent_email: string
          parent_name: string
          parent_phone: string
          source?: string
          subject: string
        }
        Update: {
          child_age?: number
          child_grade?: string
          child_name?: string
          concerns?: string | null
          created_at?: string
          current_performance?: string
          curriculum?: string
          curriculum_other?: string | null
          id?: string
          learning_needs?: string
          parent_email?: string
          parent_name?: string
          parent_phone?: string
          source?: string
          subject?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          requested_by: string
          status: string
          student_id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          requested_by: string
          status?: string
          student_id: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          requested_by?: string
          status?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_files: {
        Row: {
          id: string
          kind: string
          mime_type: string | null
          original_filename: string
          size_bytes: number | null
          status: string
          storage_key: string
          student_id: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          kind: string
          mime_type?: string | null
          original_filename: string
          size_bytes?: number | null
          status?: string
          storage_key: string
          student_id: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          kind?: string
          mime_type?: string | null
          original_filename?: string
          size_bytes?: number | null
          status?: string
          storage_key?: string
          student_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_report_skill_ratings: {
        Row: {
          lesson_report_id: string
          rating: number
          skill_id: string
        }
        Insert: {
          lesson_report_id: string
          rating: number
          skill_id: string
        }
        Update: {
          lesson_report_id?: string
          rating?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_report_skill_ratings_lesson_report_id_fkey"
            columns: ["lesson_report_id"]
            isOneToOne: false
            referencedRelation: "lesson_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_report_skill_ratings_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "subject_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reports: {
        Row: {
          confidence_level: number
          created_at: string
          deleted_at: string | null
          duration_minutes: number
          edited_at: string | null
          edited_by: string | null
          emailed_at: string | null
          focus_rating: number
          homework: number
          how_to_help_at_home: string | null
          id: string
          lesson_date: string
          lesson_focus: string
          lesson_highlights: string | null
          next_focus: string | null
          participation: number
          recording_url: string | null
          session_id: string | null
          student_id: string
          subject_id: string
          understanding_check: number
          uploaded_by: string
        }
        Insert: {
          confidence_level: number
          created_at?: string
          deleted_at?: string | null
          duration_minutes: number
          edited_at?: string | null
          edited_by?: string | null
          emailed_at?: string | null
          focus_rating: number
          homework: number
          how_to_help_at_home?: string | null
          id?: string
          lesson_date: string
          lesson_focus: string
          lesson_highlights?: string | null
          next_focus?: string | null
          participation: number
          recording_url?: string | null
          session_id?: string | null
          student_id: string
          subject_id: string
          understanding_check: number
          uploaded_by: string
        }
        Update: {
          confidence_level?: number
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          edited_at?: string | null
          edited_by?: string | null
          emailed_at?: string | null
          focus_rating?: number
          homework?: number
          how_to_help_at_home?: string | null
          id?: string
          lesson_date?: string
          lesson_focus?: string
          lesson_highlights?: string | null
          next_focus?: string | null
          participation?: number
          recording_url?: string | null
          session_id?: string | null
          student_id?: string
          subject_id?: string
          understanding_check?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reports_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_students: {
        Row: {
          created_at: string
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          renewal_at: string | null
          role: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          renewal_at?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          renewal_at?: string | null
          role?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          enrollment_id: string
          id: string
          lesson_report_id: string | null
          scheduled_at: string | null
          session_date: string
          status: string
          student_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          enrollment_id: string
          id?: string
          lesson_report_id?: string | null
          scheduled_at?: string | null
          session_date: string
          status?: string
          student_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          enrollment_id?: string
          id?: string
          lesson_report_id?: string | null
          scheduled_at?: string | null
          session_date?: string
          status?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_lesson_report_id_fkey"
            columns: ["lesson_report_id"]
            isOneToOne: false
            referencedRelation: "lesson_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          enrollment_id: string | null
          id: string
          kind: string
          mime_type: string | null
          original_filename: string
          size_bytes: number | null
          status: string
          storage_key: string
          student_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          enrollment_id?: string | null
          id?: string
          kind: string
          mime_type?: string | null
          original_filename: string
          size_bytes?: number | null
          status?: string
          storage_key: string
          student_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          enrollment_id?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          original_filename?: string
          size_bytes?: number | null
          status?: string
          storage_key?: string
          student_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          added_by: string | null
          age: number | null
          archived_at: string | null
          created_at: string
          current_school: string | null
          curriculum: string | null
          curriculum_other: string | null
          full_name: string
          gender: string | null
          id: string
          intake: Json
          intake_submitted_at: string | null
          preferred_name: string | null
          registration_number: string
        }
        Insert: {
          added_by?: string | null
          age?: number | null
          archived_at?: string | null
          created_at?: string
          current_school?: string | null
          curriculum?: string | null
          curriculum_other?: string | null
          full_name: string
          gender?: string | null
          id?: string
          intake?: Json
          intake_submitted_at?: string | null
          preferred_name?: string | null
          registration_number: string
        }
        Update: {
          added_by?: string | null
          age?: number | null
          archived_at?: string | null
          created_at?: string
          current_school?: string | null
          curriculum?: string | null
          curriculum_other?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          intake?: Json
          intake_submitted_at?: string | null
          preferred_name?: string | null
          registration_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_skills: {
        Row: {
          description: string | null
          id: string
          name: string
          sort_order: number
          subject_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          subject_id: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_skills_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      teacher_materials: {
        Row: {
          id: string
          kind: string
          mime_type: string | null
          original_filename: string
          size_bytes: number | null
          status: string
          storage_key: string
          student_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          id?: string
          kind: string
          mime_type?: string | null
          original_filename: string
          size_bytes?: number | null
          status?: string
          storage_key: string
          student_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          id?: string
          kind?: string
          mime_type?: string | null
          original_filename?: string
          size_bytes?: number | null
          status?: string
          storage_key?: string
          student_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_materials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_lesson_report: {
        Args: {
          p_confidence_level: number
          p_duration_minutes: number
          p_focus_rating: number
          p_homework: number
          p_how_to_help_at_home: string
          p_lesson_date: string
          p_lesson_focus: string
          p_lesson_highlights: string
          p_next_focus: string
          p_participation: number
          p_recording_url?: string
          p_session_id?: string
          p_skill_ratings: Json
          p_student_id: string
          p_subject_id: string
          p_understanding_check: number
        }
        Returns: {
          confidence_level: number
          created_at: string
          duration_minutes: number
          edited_at: string | null
          edited_by: string | null
          emailed_at: string | null
          focus_rating: number
          homework: number
          how_to_help_at_home: string | null
          id: string
          lesson_date: string
          lesson_focus: string
          lesson_highlights: string | null
          next_focus: string | null
          participation: number
          session_id: string | null
          student_id: string
          subject_id: string
          understanding_check: number
          uploaded_by: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_session_attendance: {
        Args: {
          p_session_id: string
          p_status: string
        }
        Returns: {
          created_at: string
          duration_minutes: number
          enrollment_id: string
          id: string
          lesson_report_id: string | null
          scheduled_at: string | null
          session_date: string
          status: string
          student_id: string
          subject_id: string
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_student: {
        Args: {
          p_age: number
          p_current_school: string
          p_curriculum: string
          p_curriculum_other: string
          p_full_name: string
          p_gender: string
          p_parent_id: string | null
          p_preferred_name: string
        }
        Returns: {
          added_by: string | null
          age: number | null
          archived_at: string | null
          created_at: string
          current_school: string | null
          curriculum: string | null
          curriculum_other: string | null
          full_name: string
          gender: string | null
          id: string
          intake: Json
          intake_submitted_at: string | null
          preferred_name: string | null
          registration_number: string
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_student_with_intake: {
        Args: {
          p_age: number
          p_current_school: string
          p_curriculum: string
          p_curriculum_other: string
          p_full_name: string
          p_gender: string
          p_intake: Json
          p_preferred_name: string
        }
        Returns: {
          added_by: string | null
          age: number | null
          created_at: string
          current_school: string | null
          curriculum: string | null
          curriculum_other: string | null
          full_name: string
          gender: string | null
          id: string
          intake: Json
          intake_submitted_at: string | null
          preferred_name: string | null
          registration_number: string
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      is_teacher: { Args: { uid: string }; Returns: boolean }
      next_registration_number: { Args: never; Returns: string }
      update_lesson_report: {
        Args: {
          p_confidence_level: number
          p_duration_minutes: number
          p_focus_rating: number
          p_homework: number
          p_how_to_help_at_home: string
          p_lesson_date: string
          p_lesson_focus: string
          p_lesson_highlights: string
          p_next_focus: string
          p_participation: number
          p_report_id: string
          p_skill_ratings: Json
          p_understanding_check: number
        }
        Returns: {
          confidence_level: number
          created_at: string
          duration_minutes: number
          edited_at: string | null
          edited_by: string | null
          emailed_at: string | null
          focus_rating: number
          homework: number
          how_to_help_at_home: string | null
          id: string
          lesson_date: string
          lesson_focus: string
          lesson_highlights: string | null
          next_focus: string | null
          participation: number
          session_id: string | null
          student_id: string
          subject_id: string
          understanding_check: number
          uploaded_by: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

