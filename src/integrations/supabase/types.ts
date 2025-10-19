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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cases: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          next_action_at: string | null
          owner_user_id: string | null
          playbook: string | null
          state: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          next_action_at?: string | null
          owner_user_id?: string | null
          playbook?: string | null
          state?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          next_action_at?: string | null
          owner_user_id?: string | null
          playbook?: string | null
          state?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          alert_type: string
          created_at: string
          employee_id: string
          id: string
          is_resolved: boolean | null
          location_data: Json | null
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          alert_type?: string
          created_at?: string
          employee_id: string
          id?: string
          is_resolved?: boolean | null
          location_data?: Json | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_resolved?: boolean | null
          location_data?: Json | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "emergency_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employee_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          employee_id: string
          id: string
          refugi_lead_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          employee_id: string
          id?: string
          refugi_lead_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          employee_id?: string
          id?: string
          refugi_lead_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_status: {
        Row: {
          created_at: string
          emergency_alert: boolean | null
          employee_id: string
          id: string
          is_online: boolean | null
          last_check_in: string | null
          mood_level: number | null
          therapy_progress: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_alert?: boolean | null
          employee_id: string
          id?: string
          is_online?: boolean | null
          last_check_in?: string | null
          mood_level?: number | null
          therapy_progress?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_alert?: boolean | null
          employee_id?: string
          id?: string
          is_online?: boolean | null
          last_check_in?: string | null
          mood_level?: number | null
          therapy_progress?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_status_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hris_employees_sync: {
        Row: {
          created_at: string | null
          department: string | null
          employee_id: string | null
          external_id: string | null
          id: string
          location: string | null
          shift: string | null
          status: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          employee_id?: string | null
          external_id?: string | null
          id?: string
          location?: string | null
          shift?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          employee_id?: string | null
          external_id?: string | null
          id?: string
          location?: string | null
          shift?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          closed_at: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          opened_at: string | null
          sla_breached_bool: boolean | null
          sla_target_mins: number | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          opened_at?: string | null
          sla_breached_bool?: boolean | null
          sla_target_mins?: number | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          opened_at?: string | null
          sla_breached_bool?: boolean | null
          sla_target_mins?: number | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          recipient_id: string
          related_alert_id: string | null
          related_case_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          recipient_id: string
          related_alert_id?: string | null
          related_case_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          recipient_id?: string
          related_alert_id?: string | null
          related_case_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_related_alert_id_fkey"
            columns: ["related_alert_id"]
            isOneToOne: false
            referencedRelation: "emergency_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_settings: {
        Row: {
          audio_alerts_enabled: boolean | null
          auto_refresh_interval: number | null
          created_at: string | null
          default_report_format: string | null
          email_notifications_enabled: boolean | null
          id: string
          push_notifications_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          risk_threshold_high: number | null
          risk_threshold_medium: number | null
          show_attention_queue: boolean | null
          show_kpis_section: boolean | null
          show_reports_section: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
          welcome_message_template: string | null
        }
        Insert: {
          audio_alerts_enabled?: boolean | null
          auto_refresh_interval?: number | null
          created_at?: string | null
          default_report_format?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          push_notifications_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          risk_threshold_high?: number | null
          risk_threshold_medium?: number | null
          show_attention_queue?: boolean | null
          show_kpis_section?: boolean | null
          show_reports_section?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          welcome_message_template?: string | null
        }
        Update: {
          audio_alerts_enabled?: boolean | null
          auto_refresh_interval?: number | null
          created_at?: string | null
          default_report_format?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          push_notifications_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          risk_threshold_high?: number | null
          risk_threshold_medium?: number | null
          show_attention_queue?: boolean | null
          show_kpis_section?: boolean | null
          show_reports_section?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          welcome_message_template?: string | null
        }
        Relationships: []
      }
      mood_check_ins: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          is_anonymous_bool: boolean | null
          location_data: Json | null
          mood_level: number
          notes: string | null
          status: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          is_anonymous_bool?: boolean | null
          location_data?: Json | null
          mood_level: number
          notes?: string | null
          status: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          is_anonymous_bool?: boolean | null
          location_data?: Json | null
          mood_level?: number
          notes?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          company_role: string | null
          company_website: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_1_name: string | null
          emergency_contact_1_phone: string | null
          emergency_contact_2_name: string | null
          emergency_contact_2_phone: string | null
          full_name: string
          id: string
          managed_by_lead: boolean | null
          phone: string | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["app_role"]
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_role?: string | null
          company_website?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          full_name: string
          id?: string
          managed_by_lead?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_role?: string | null
          company_website?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          full_name?: string
          id?: string
          managed_by_lead?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psych_referrals: {
        Row: {
          appointment_at: string | null
          case_id: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          provider_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_at?: string | null
          case_id?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          provider_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_at?: string | null
          case_id?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          provider_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psych_referrals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          file_url: string | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          scope: Json | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          scope?: Json | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          scope?: Json | null
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          calculated_at: string | null
          created_at: string | null
          employee_id: string
          explain_chips: string[] | null
          id: string
          score_int: number | null
          trend_30d: number | null
          trend_7d: number | null
        }
        Insert: {
          calculated_at?: string | null
          created_at?: string | null
          employee_id: string
          explain_chips?: string[] | null
          id?: string
          score_int?: number | null
          trend_30d?: number | null
          trend_7d?: number | null
        }
        Update: {
          calculated_at?: string | null
          created_at?: string | null
          employee_id?: string
          explain_chips?: string[] | null
          id?: string
          score_int?: number | null
          trend_30d?: number | null
          trend_7d?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          employee_limit: number
          id: string
          price_id: string
          product_id: string
          refugi_lead_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          employee_limit: number
          id?: string
          price_id: string
          product_id: string
          refugi_lead_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          employee_limit?: number
          id?: string
          price_id?: string
          product_id?: string
          refugi_lead_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_refugi_lead_id_fkey"
            columns: ["refugi_lead_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      training_completions: {
        Row: {
          completed_at: string | null
          course_code: string
          created_at: string | null
          employee_id: string
          expires_at: string | null
          id: string
        }
        Insert: {
          completed_at?: string | null
          course_code: string
          created_at?: string | null
          employee_id: string
          expires_at?: string | null
          id?: string
        }
        Update: {
          completed_at?: string | null
          course_code?: string
          created_at?: string | null
          employee_id?: string
          expires_at?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_risk_score: {
        Args: { emp_id: string }
        Returns: {
          chips: string[]
          score: number
          trend_30d: number
          trend_7d: number
        }[]
      }
      can_send_message: {
        Args: { recipient_id_param: string; sender_id_param: string }
        Returns: boolean
      }
      get_assigned_refugi_lead: {
        Args: { emp_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          phone: string
          user_id: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_kpis: {
        Args: { scope_filter?: Json }
        Returns: Json
      }
      get_employee_average_mood_24h: {
        Args: { emp_id: string }
        Returns: number
      }
      get_employee_data_with_profiles: {
        Args: { employee_ids: string[] }
        Returns: {
          created_at: string
          email: string
          emergency_alert: boolean
          employee_id: string
          full_name: string
          id: string
          is_online: boolean
          last_check_in: string
          mood_level: number
          phone: string
          therapy_progress: number
          updated_at: string
        }[]
      }
      has_active_subscription: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "employee" | "refugi_lead"
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
      app_role: ["employee", "refugi_lead"],
    },
  },
} as const
