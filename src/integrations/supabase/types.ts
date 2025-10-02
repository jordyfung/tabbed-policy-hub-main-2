export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          subtab_id: string
          tab_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          subtab_id: string
          tab_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          subtab_id?: string
          tab_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          bundle_id: string | null
          completion_count: number
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          is_due_soon: boolean
          is_mandatory: boolean | null
          last_completed_at: string | null
          next_due_date: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          bundle_id?: string | null
          completion_count?: number
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_due_soon?: boolean
          is_mandatory?: boolean | null
          last_completed_at?: string | null
          next_due_date?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          bundle_id?: string | null
          completion_count?: number
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_due_soon?: boolean
          is_mandatory?: boolean | null
          last_completed_at?: string | null
          next_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_assignments_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundle_items: {
        Row: {
          bundle_id: string
          course_id: string
          created_at: string
          id: string
          order_index: number
        }
        Insert: {
          bundle_id: string
          course_id: string
          created_at?: string
          id?: string
          order_index?: number
        }
        Update: {
          bundle_id?: string
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bundle_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundles: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_completions: {
        Row: {
          assignment_id: string
          completed_at: string
          completed_by: string
          id: string
          notes: string | null
          score: number | null
          streak_bonus: number
          xp_earned: number
        }
        Insert: {
          assignment_id: string
          completed_at?: string
          completed_by: string
          id?: string
          notes?: string | null
          score?: number | null
          streak_bonus?: number
          xp_earned?: number
        }
        Update: {
          assignment_id?: string
          completed_at?: string
          completed_by?: string
          id?: string
          notes?: string | null
          score?: number | null
          streak_bonus?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_frequencies: {
        Row: {
          course_id: string
          created_at: string
          frequency_months: number
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          course_id: string
          created_at?: string
          frequency_months: number
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          course_id?: string
          created_at?: string
          frequency_months?: number
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "course_frequencies_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          content: string | null
          course_type: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_mandatory: boolean | null
          scorm_entry_point: string | null
          scorm_manifest_data: Json | null
          scorm_package_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          course_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          scorm_entry_point?: string | null
          scorm_manifest_data?: Json | null
          scorm_package_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          course_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          scorm_entry_point?: string | null
          scorm_manifest_data?: Json | null
          scorm_package_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      improvement_ideas: {
        Row: {
          category: string | null
          created_at: string
          description: string
          id: string
          implementation_notes: string | null
          priority: string | null
          reviewed_by: string | null
          status: string | null
          submitted_by: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          id?: string
          implementation_notes?: string | null
          priority?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          implementation_notes?: string | null
          priority?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_ideas_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "improvement_ideas_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          reported_by: string
          severity: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          reported_by: string
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          reported_by?: string
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      policy_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: number
          policy_name: string | null
          status: string
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: number
          policy_name?: string | null
          status?: string
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: number
          policy_name?: string | null
          status?: string
          submitted_by?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          author_role: string
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          author_type: string
          category: string | null
          content: string
          created_at: string
          id: string
          priority: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          author_role: string
          author_type: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          priority?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          author_type?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          priority?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      remedial_actions: {
        Row: {
          action_description: string
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          due_date: string | null
          id: string
          incident_id: string
          status: string | null
        }
        Insert: {
          action_description: string
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          incident_id: string
          status?: string | null
        }
        Update: {
          action_description?: string
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          incident_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remedial_actions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "remedial_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "remedial_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      scorm_sessions: {
        Row: {
          cmi_data: Json | null
          completion_status: string | null
          course_id: string
          created_at: string
          id: string
          lesson_location: string | null
          lesson_status: string | null
          score_max: number | null
          score_min: number | null
          score_raw: number | null
          session_id: string
          session_time: string | null
          success_status: string | null
          total_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cmi_data?: Json | null
          completion_status?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_location?: string | null
          lesson_status?: string | null
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          session_id: string
          session_time?: string | null
          success_status?: string | null
          total_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cmi_data?: Json | null
          completion_status?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_location?: string | null
          lesson_status?: string | null
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          session_id?: string
          session_time?: string | null
          success_status?: string | null
          total_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_notifications: {
        Row: {
          assignment_id: string
          id: string
          is_read: boolean
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          id?: string
          is_read?: boolean
          notification_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_notifications_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_streaks: {
        Row: {
          current_streak: number
          id: string
          last_completion_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_completion_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invitation_expires_at: string
          invitation_token: string
          invited_by: string
          is_accepted: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invitation_expires_at?: string
          invitation_token: string
          invited_by: string
          is_accepted?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invitation_expires_at?: string
          invitation_token?: string
          invited_by?: string
          is_accepted?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_due_date: {
        Args: { assignment_id_param: string }
        Returns: string
      }
      check_and_award_achievements: {
        Args: { completion_id_param: string; user_id_param: string }
        Returns: undefined
      }
      check_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_enabled_subtabs: {
        Args: { tab_name: string }
        Returns: {
          subtab_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_due_soon_flags: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "staff" | "super-admin"
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
  public: {
    Enums: {
      user_role: ["admin", "staff", "super-admin"],
    },
  },
} as const

// Training Profile Redesign Types
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export type Assignment = {
  id: string;
  title: string;
  dueDate?: string; // ISO
  isMandatory: boolean;
  progressPercent: number; // 0..100
  lastLaunchedAt?: string; // ISO
  estimatedMinutes?: number;
  status: AssignmentStatus;
  courseId: string;
  standards?: string[];
};

export type AssignmentGroup = {
  title: string;
  assignments: Assignment[];
  emptyMessage: string;
};

export type ComplianceSummary = {
  mandatoryCoverage: number; // percentage
  overdueCount: number;
  dueSoonCount: number;
};

export type NextUpAssignment = Assignment | null;
