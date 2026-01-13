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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_history: {
        Row: {
          created_at: string
          device_types: string[]
          id: string
          issues_found: Json | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          device_types?: string[]
          id?: string
          issues_found?: Json | null
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          device_types?: string[]
          id?: string
          issues_found?: Json | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          completed_at: string
          has_pending_update: boolean | null
          id: string
          recommendations: Json | null
          score: number | null
          sees_annoying_popups: boolean | null
          storage_free_gb: number | null
          unsure_about_messages: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          has_pending_update?: boolean | null
          id?: string
          recommendations?: Json | null
          score?: number | null
          sees_annoying_popups?: boolean | null
          storage_free_gb?: number | null
          unsure_about_messages?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string
          has_pending_update?: boolean | null
          id?: string
          recommendations?: Json | null
          score?: number | null
          sees_annoying_popups?: boolean | null
          storage_free_gb?: number | null
          unsure_about_messages?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          category: string | null
          created_at: string | null
          definition: string
          example: string | null
          id: string
          related_guide_id: string | null
          term: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          definition: string
          example?: string | null
          id?: string
          related_guide_id?: string | null
          term: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          definition?: string
          example?: string | null
          id?: string
          related_guide_id?: string | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_terms_related_guide_id_fkey"
            columns: ["related_guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_steps: {
        Row: {
          animated_gif_url: string | null
          created_at: string
          device_type: string[] | null
          guide_id: string
          id: string
          image_url: string | null
          instruction: string
          step_number: number
          tip_text: string | null
          title: string
          video_url: string | null
          warning_text: string | null
        }
        Insert: {
          animated_gif_url?: string | null
          created_at?: string
          device_type?: string[] | null
          guide_id: string
          id?: string
          image_url?: string | null
          instruction: string
          step_number: number
          tip_text?: string | null
          title: string
          video_url?: string | null
          warning_text?: string | null
        }
        Update: {
          animated_gif_url?: string | null
          created_at?: string
          device_type?: string[] | null
          guide_id?: string
          id?: string
          image_url?: string | null
          instruction?: string
          step_number?: number
          tip_text?: string | null
          title?: string
          video_url?: string | null
          warning_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_steps_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          min_plan: Database["public"]["Enums"]["plan_tier"] | null
          slug: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          min_plan?: Database["public"]["Enums"]["plan_tier"] | null
          slug?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          min_plan?: Database["public"]["Enums"]["plan_tier"] | null
          slug?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hardware_issues: {
        Row: {
          category: string | null
          created_at: string | null
          device_type: string
          id: string
          problem_description: string | null
          problem_title: string
          related_guide_id: string | null
          severity: string | null
          solution_text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          device_type: string
          id?: string
          problem_description?: string | null
          problem_title: string
          related_guide_id?: string | null
          severity?: string | null
          solution_text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          device_type?: string
          id?: string
          problem_description?: string | null
          problem_title?: string
          related_guide_id?: string | null
          severity?: string | null
          solution_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_issues_related_guide_id_fkey"
            columns: ["related_guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      panic_cases: {
        Row: {
          action_plan: Json | null
          clicked_or_shared: string | null
          created_at: string
          id: string
          incident_type: string
          money_risk: string | null
          notify_helper: boolean | null
          user_id: string
        }
        Insert: {
          action_plan?: Json | null
          clicked_or_shared?: string | null
          created_at?: string
          id?: string
          incident_type: string
          money_risk?: string | null
          notify_helper?: boolean | null
          user_id: string
        }
        Update: {
          action_plan?: Json | null
          clicked_or_shared?: string | null
          created_at?: string
          id?: string
          incident_type?: string
          money_risk?: string | null
          notify_helper?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      pending_subscriptions: {
        Row: {
          checkout_session_id: string
          claimed: boolean | null
          claimed_by: string | null
          created_at: string
          id: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          purchaser_email: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          checkout_session_id: string
          claimed?: boolean | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          purchaser_email: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          checkout_session_id?: string
          claimed?: boolean | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          purchaser_email?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          device_preference: string | null
          display_name: string | null
          email: string | null
          emergency_bank_phone: string | null
          emergency_helper_name: string | null
          emergency_helper_phone: string | null
          id: string
          is_admin: boolean | null
          onboarding_completed: boolean | null
          owned_devices: string[] | null
          senior_mode_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          device_preference?: string | null
          display_name?: string | null
          email?: string | null
          emergency_bank_phone?: string | null
          emergency_helper_name?: string | null
          emergency_helper_phone?: string | null
          id?: string
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          owned_devices?: string[] | null
          senior_mode_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          device_preference?: string | null
          display_name?: string | null
          email?: string | null
          emergency_bank_phone?: string | null
          emergency_helper_name?: string | null
          emergency_helper_phone?: string | null
          id?: string
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          owned_devices?: string[] | null
          senior_mode_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          answer_is_scam: boolean
          category: string | null
          created_at: string | null
          difficulty: number | null
          explanation: string
          id: string
          question: string
          scenario_description: string | null
        }
        Insert: {
          answer_is_scam: boolean
          category?: string | null
          created_at?: string | null
          difficulty?: number | null
          explanation: string
          id?: string
          question: string
          scenario_description?: string | null
        }
        Update: {
          answer_is_scam?: boolean
          category?: string | null
          created_at?: string | null
          difficulty?: number | null
          explanation?: string
          id?: string
          question?: string
          scenario_description?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"] | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_credits: {
        Row: {
          credits_remaining: number | null
          credits_used_this_month: number | null
          id: string
          last_reset_at: string
          user_id: string
        }
        Insert: {
          credits_remaining?: number | null
          credits_used_this_month?: number | null
          id?: string
          last_reset_at?: string
          user_id: string
        }
        Update: {
          credits_remaining?: number | null
          credits_used_this_month?: number | null
          id?: string
          last_reset_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: number | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_content: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      trusted_helpers: {
        Row: {
          can_view_checkins: boolean | null
          can_view_dashboard: boolean | null
          can_view_notes: boolean | null
          can_view_tickets: boolean | null
          can_view_vault: boolean | null
          created_at: string
          expires_at: string | null
          helper_email: string
          helper_user_id: string | null
          id: string
          invitation_accepted: boolean | null
          invitation_token: string | null
          medical_id_verified: boolean | null
          medical_id_verified_at: string | null
          permissions: Json | null
          user_id: string
        }
        Insert: {
          can_view_checkins?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_notes?: boolean | null
          can_view_tickets?: boolean | null
          can_view_vault?: boolean | null
          created_at?: string
          expires_at?: string | null
          helper_email: string
          helper_user_id?: string | null
          id?: string
          invitation_accepted?: boolean | null
          invitation_token?: string | null
          medical_id_verified?: boolean | null
          medical_id_verified_at?: string | null
          permissions?: Json | null
          user_id: string
        }
        Update: {
          can_view_checkins?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_notes?: boolean | null
          can_view_tickets?: boolean | null
          can_view_vault?: boolean | null
          created_at?: string
          expires_at?: string | null
          helper_email?: string
          helper_user_id?: string | null
          id?: string
          invitation_accepted?: boolean | null
          invitation_token?: string | null
          medical_id_verified?: boolean | null
          medical_id_verified_at?: string | null
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          checkins_completed: number | null
          created_at: string
          current_level: string | null
          guides_read: string[] | null
          id: string
          tools_used: string[] | null
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checkins_completed?: number | null
          created_at?: string
          current_level?: string | null
          guides_read?: string[] | null
          id?: string
          tools_used?: string[] | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checkins_completed?: number | null
          created_at?: string
          current_level?: string | null
          guides_read?: string[] | null
          id?: string
          tools_used?: string[] | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_dashboard_settings: {
        Row: {
          card_categories: Json
          card_order: string[] | null
          created_at: string
          hidden_cards: string[] | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_categories?: Json
          card_order?: string[] | null
          created_at?: string
          hidden_cards?: string[] | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_categories?: Json
          card_order?: string[] | null
          created_at?: string
          hidden_cards?: string[] | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wishlist: {
        Row: {
          created_at: string
          id: string
          item_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_key?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_folders: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          iv: string
          name_encrypted: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          iv: string
          name_encrypted: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          iv?: string
          name_encrypted?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          iv: string
          note_encrypted: string | null
          secret_encrypted: string
          title_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          iv: string
          note_encrypted?: string | null
          secret_encrypted: string
          title_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          iv?: string
          note_encrypted?: string | null
          secret_encrypted?: string
          title_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "vault_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_password_resets: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      vault_settings: {
        Row: {
          created_at: string
          id: string
          kdf_iterations: number | null
          salt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kdf_iterations?: number | null
          salt: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kdf_iterations?: number | null
          salt?: string
          user_id?: string
        }
        Relationships: []
      }
      visual_help_images: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          gif_url: string | null
          id: string
          image_url: string | null
          sort_order: number | null
          step_key: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          gif_url?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number | null
          step_key: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          gif_url?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number | null
          step_key?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite_token: {
        Args: { token_input: string }
        Returns: {
          helper_user_id: string
          id: string
          invitation_accepted: boolean
          message: string
          success: boolean
          user_id: string
        }[]
      }
      check_pending_subscription_by_email: {
        Args: { check_email: string }
        Returns: {
          checkout_session_id: string
          claimed: boolean
          id: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
        }[]
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          can_view_checkins: boolean
          can_view_dashboard: boolean
          can_view_notes: boolean
          can_view_tickets: boolean
          can_view_vault: boolean
          expires_at: string
          helper_email: string
          id: string
          invitation_accepted: boolean
          inviter_display_name: string
          user_id: string
        }[]
      }
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      verify_invite_token: {
        Args: { token_input: string }
        Returns: {
          can_view_checkins: boolean
          can_view_dashboard: boolean
          can_view_notes: boolean
          can_view_tickets: boolean
          can_view_vault: boolean
          expires_at: string
          helper_email: string
          id: string
          invitation_accepted: boolean
          inviter_display_name: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      plan_tier: "basic" | "plus" | "pro"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "trialing"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["admin", "user"],
      plan_tier: ["basic", "plus", "pro"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "trialing",
      ],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
