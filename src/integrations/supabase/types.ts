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
      abandoned_forms: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          form_data: Json | null
          id: string
          recovered: boolean | null
          step_reached: number | null
          visitor_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          recovered?: boolean | null
          step_reached?: number | null
          visitor_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          recovered?: boolean | null
          step_reached?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_forms_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      admin_availability: {
        Row: {
          admin_id: string
          id: string
          is_available: boolean | null
          schedule: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          id?: string
          is_available?: boolean | null
          schedule?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          id?: string
          is_available?: boolean | null
          schedule?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          inviter_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          inviter_name?: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          inviter_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          commission_amount: number | null
          commission_percent: number | null
          created_at: string | null
          id: string
          level: number | null
          order_id: string | null
          paid_at: string | null
          referral_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          commission_amount?: number | null
          commission_percent?: number | null
          created_at?: string | null
          id?: string
          level?: number | null
          order_id?: string | null
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_amount?: number | null
          commission_percent?: number | null
          created_at?: string | null
          id?: string
          level?: number | null
          order_id?: string | null
          paid_at?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      affiliate_invites: {
        Row: {
          accepted_at: string | null
          affiliate_id: string
          code: string
          commission_rate: number | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          name: string | null
          program_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          affiliate_id: string
          code: string
          commission_rate?: number | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          name?: string | null
          program_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          affiliate_id?: string
          code?: string
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          name?: string | null
          program_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_invites_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_materials: {
        Row: {
          created_at: string | null
          description: string | null
          downloads_count: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          material_type: string
          product_id: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          material_type: string
          product_id?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          material_type?: string
          product_id?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "affiliate_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "affiliate_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_post_likes: {
        Row: {
          affiliate_id: string | null
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "affiliate_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_posts: {
        Row: {
          author_id: string
          category: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          post_type: string | null
          shares_count: number | null
          title: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          title?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          title?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          converted_at: string | null
          created_at: string | null
          id: string
          level: number | null
          referred_affiliate_id: string | null
          referred_user_id: string | null
          referrer_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          converted_at?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          referred_affiliate_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          converted_at?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          referred_affiliate_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_referred_affiliate_id_fkey"
            columns: ["referred_affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_learnings: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          pattern: string
          response: string
          success_rate: number | null
          updated_at: string | null
          uses_count: number | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pattern: string
          response: string
          success_rate?: number | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pattern?: string
          response?: string
          success_rate?: number | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Relationships: []
      }
      ai_mode_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          mode_name: string
          settings: Json | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          mode_name: string
          settings?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          mode_name?: string
          settings?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_name: string
          id: string
          ip_address: unknown
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action_result: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          rule_id: string | null
          status: string | null
          trigger_data: Json | null
        }
        Insert: {
          action_result?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
        }
        Update: {
          action_result?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number | null
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required?: number | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          layout: Json
          name: string
          preview_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout?: Json
          name: string
          preview_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout?: Json
          name?: string
          preview_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          ai_confidence: number | null
          assigned_admin_id: string | null
          created_at: string | null
          current_mode: string | null
          escalation_reason: string | null
          form_completed: boolean | null
          id: string
          last_activity_at: string | null
          metadata: Json | null
          rating: number | null
          status: string | null
          transferred_at: string | null
          updated_at: string | null
          user_id: string | null
          visitor_id: string | null
          visitor_name: string | null
        }
        Insert: {
          ai_confidence?: number | null
          assigned_admin_id?: string | null
          created_at?: string | null
          current_mode?: string | null
          escalation_reason?: string | null
          form_completed?: boolean | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          rating?: number | null
          status?: string | null
          transferred_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
        }
        Update: {
          ai_confidence?: number | null
          assigned_admin_id?: string | null
          created_at?: string | null
          current_mode?: string | null
          escalation_reason?: string | null
          form_completed?: boolean | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          rating?: number | null
          status?: string | null
          transferred_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_ai_response: boolean | null
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_ai_response?: boolean | null
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_ai_response?: boolean | null
          metadata?: Json | null
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
      community_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          is_resolved: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          replies_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          likes_count: number | null
          post_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          likes_count?: number | null
          post_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          likes_count?: number | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          source: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string | null
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          product_ids: string[] | null
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type?: string | null
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          product_ids?: string[] | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          product_ids?: string[] | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      course_certificates: {
        Row: {
          certificate_number: string
          course_hours: number | null
          course_name: string
          created_at: string | null
          final_score: number | null
          id: string
          issued_at: string | null
          metadata: Json | null
          product_id: string
          student_name: string
          template_id: string | null
          user_id: string
          validation_code: string
        }
        Insert: {
          certificate_number: string
          course_hours?: number | null
          course_name: string
          created_at?: string | null
          final_score?: number | null
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          product_id: string
          student_name: string
          template_id?: string | null
          user_id: string
          validation_code: string
        }
        Update: {
          certificate_number?: string
          course_hours?: number | null
          course_name?: string
          created_at?: string | null
          final_score?: number | null
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          product_id?: string
          student_name?: string
          template_id?: string | null
          user_id?: string
          validation_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_logs: {
        Row: {
          created_at: string | null
          document_id: string | null
          document_number: string | null
          document_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          document_number?: string | null
          document_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          document_number?: string | null
          document_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          total_clicked: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string | null
          email_log_id: string | null
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email_log_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email_log_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          order_id: string | null
          product_id: string
          progress_percent: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          progress_percent?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          progress_percent?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      esp_configurations: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          completed_at: string | null
          created_at: string | null
          exam_id: string
          id: string
          passed: boolean | null
          score: number | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          exam_id: string
          id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          exam_id?: string
          id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "financial_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_simulators: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          passing_score: number | null
          product_id: string | null
          time_limit_minutes: number | null
          title: string
          total_questions: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          product_id?: string | null
          time_limit_minutes?: number | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          product_id?: string | null
          time_limit_minutes?: number | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_simulators_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_exams: {
        Row: {
          created_at: string | null
          description: string | null
          exam_type: string | null
          id: string
          is_active: boolean | null
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exam_type?: string | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exam_type?: string | null
          id?: string
          is_active?: boolean | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: []
      }
      generated_certificates: {
        Row: {
          certificate_id: string | null
          generated_at: string | null
          id: string
          metadata: Json | null
          pdf_url: string | null
          product_id: string | null
          status: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          certificate_id?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          product_id?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          certificate_id?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          product_id?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_certificates_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "course_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_modulos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_modulos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          enrollment_id: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          progress_percent: number | null
          updated_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          progress_percent?: number | null
          updated_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          progress_percent?: number | null
          updated_at?: string | null
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "product_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quiz_attempts: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          lesson_id: string
          passed: boolean | null
          score: number | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string | null
          id?: string
          lesson_id: string
          passed?: boolean | null
          score?: number | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          lesson_id?: string
          passed?: boolean | null
          score?: number | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "product_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_highlighted: boolean | null
          is_pinned: boolean | null
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_highlighted?: boolean | null
          is_pinned?: boolean | null
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_highlighted?: boolean | null
          is_pinned?: boolean | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          completed_steps: number[] | null
          created_at: string | null
          current_step: number | null
          data: Json | null
          id: string
          is_completed: boolean | null
          skipped: boolean | null
          step: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number | null
          data?: Json | null
          id?: string
          is_completed?: boolean | null
          skipped?: boolean | null
          step?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number | null
          data?: Json | null
          id?: string
          is_completed?: boolean | null
          skipped?: boolean | null
          step?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_id: string | null
          coupon_id: string | null
          created_at: string | null
          discount: number | null
          id: string
          metadata: Json | null
          order_number: string
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          order_number: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          order_number?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_transactions: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          paid_at: string | null
          qr_code: string | null
          qr_code_image: string | null
          status: string | null
          txid: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_image?: string | null
          status?: string | null
          txid?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_image?: string | null
          status?: string | null
          txid?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pix_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          position: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          position?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          position?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_content: {
        Row: {
          content_data: Json | null
          content_type: string
          content_url: string | null
          created_at: string | null
          id: string
          position: number | null
          product_id: string
          title: string
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
          title: string
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_content_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lessons: {
        Row: {
          attachments: Json | null
          content: string | null
          content_type: string | null
          created_at: string | null
          description: string | null
          id: string
          is_free_preview: boolean | null
          is_published: boolean | null
          module_id: string
          name: string
          position: number | null
          quiz_passing_score: number | null
          quiz_questions: Json | null
          quiz_required: boolean | null
          updated_at: string | null
          video_duration: number | null
          video_url: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          is_published?: boolean | null
          module_id: string
          name: string
          position?: number | null
          quiz_passing_score?: number | null
          quiz_questions?: Json | null
          quiz_required?: boolean | null
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          is_published?: boolean | null
          module_id?: string
          name?: string
          position?: number | null
          quiz_passing_score?: number | null
          quiz_questions?: Json | null
          quiz_required?: boolean | null
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_free_preview: boolean | null
          is_published: boolean | null
          name: string
          position: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          is_published?: boolean | null
          name: string
          position?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          is_published?: boolean | null
          name?: string
          position?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          access_days: number | null
          affiliate_free: boolean | null
          category_id: string | null
          commission_percent: number | null
          cover_image_url: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          faq: Json | null
          guarantee_days: number | null
          id: string
          instructor_id: string | null
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          max_installments: number | null
          metadata: Json | null
          name: string
          original_price: number | null
          price: number | null
          pricing_type: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          requires_approval: boolean | null
          sales_page_content: Json | null
          short_description: string | null
          slug: string | null
          status: string | null
          testimonials: Json | null
          thumbnail_url: string | null
          total_lessons: number | null
          trailer_url: string | null
          updated_at: string | null
        }
        Insert: {
          access_days?: number | null
          affiliate_free?: boolean | null
          category_id?: string | null
          commission_percent?: number | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          faq?: Json | null
          guarantee_days?: number | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          max_installments?: number | null
          metadata?: Json | null
          name: string
          original_price?: number | null
          price?: number | null
          pricing_type?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          requires_approval?: boolean | null
          sales_page_content?: Json | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          testimonials?: Json | null
          thumbnail_url?: string | null
          total_lessons?: number | null
          trailer_url?: string | null
          updated_at?: string | null
        }
        Update: {
          access_days?: number | null
          affiliate_free?: boolean | null
          category_id?: string | null
          commission_percent?: number | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          faq?: Json | null
          guarantee_days?: number | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          max_installments?: number | null
          metadata?: Json | null
          name?: string
          original_price?: number | null
          price?: number | null
          pricing_type?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          requires_approval?: boolean | null
          sales_page_content?: Json | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          testimonials?: Json | null
          thumbnail_url?: string | null
          total_lessons?: number | null
          trailer_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_edit_history: {
        Row: {
          changed_at: string | null
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_education: {
        Row: {
          created_at: string | null
          degree: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          is_current: boolean | null
          linkedin_id: string | null
          school: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          school?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          school?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_experiences: {
        Row: {
          company: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          linkedin_id: string | null
          location: string | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          location?: string | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          location?: string | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          created_at: string | null
          endorsement_count: number | null
          id: string
          linkedin_id: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endorsement_count?: number | null
          id?: string
          linkedin_id?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          endorsement_count?: number | null
          id?: string
          linkedin_id?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cover_image_url: string | null
          cpf: string | null
          created_at: string | null
          drive_connected: boolean | null
          email: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          instagram_url: string | null
          is_public: boolean | null
          linkedin_url: string | null
          location: string | null
          name: string | null
          phone: string | null
          plan: string | null
          profile_views: number | null
          storage_used: number | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tiktok_url: string | null
          twitter_url: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_image_url?: string | null
          cpf?: string | null
          created_at?: string | null
          drive_connected?: boolean | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone?: string | null
          plan?: string | null
          profile_views?: number | null
          storage_used?: number | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_image_url?: string | null
          cpf?: string | null
          created_at?: string | null
          drive_connected?: boolean | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          phone?: string | null
          plan?: string | null
          profile_views?: number | null
          storage_used?: number | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string | null
          fulfilled_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fulfilled_at?: string | null
          id?: string
          points_spent: number
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fulfilled_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cash_value: number | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_required: number
          quantity_available: number | null
          stock: number | null
          tier_required: string | null
          type: string | null
        }
        Insert: {
          cash_value?: number | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_required: number
          quantity_available?: number | null
          stock?: number | null
          tier_required?: string | null
          type?: string | null
        }
        Update: {
          cash_value?: number | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_required?: number
          quantity_available?: number | null
          stock?: number | null
          tier_required?: string | null
          type?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string
          created_at: string | null
          error_message: string | null
          facebook_post_id: string | null
          id: string
          instagram_post_id: string | null
          media_type: string | null
          media_url: string | null
          platform: string
          published_at: string | null
          scheduled_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          error_message?: string | null
          facebook_post_id?: string | null
          id?: string
          instagram_post_id?: string | null
          media_type?: string | null
          media_url?: string | null
          platform: string
          published_at?: string | null
          scheduled_at: string
          status?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          error_message?: string | null
          facebook_post_id?: string | null
          id?: string
          instagram_post_id?: string | null
          media_type?: string | null
          media_url?: string | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      simulator_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          passed: boolean | null
          score: number | null
          simulator_id: string
          started_at: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          simulator_id: string
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          simulator_id?: string
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_attempts_simulator_id_fkey"
            columns: ["simulator_id"]
            isOneToOne: false
            referencedRelation: "exam_simulators"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          options: Json
          points: number | null
          position: number | null
          question_text: string
          question_type: string | null
          simulator_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          points?: number | null
          position?: number | null
          question_text: string
          question_type?: string | null
          simulator_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          points?: number | null
          position?: number | null
          question_text?: string
          question_type?: string | null
          simulator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_questions_simulator_id_fkey"
            columns: ["simulator_id"]
            isOneToOne: false
            referencedRelation: "exam_simulators"
            referencedColumns: ["id"]
          },
        ]
      }
      study_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          last_study_date: string | null
          longest_streak: number | null
          total_study_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          last_study_date?: string | null
          longest_streak?: number | null
          total_study_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          last_study_date?: string | null
          longest_streak?: number | null
          total_study_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string | null
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_check_at: string | null
          response_time_ms: number | null
          service_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          response_time_ms?: number | null
          service_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          response_time_ms?: number | null
          service_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transcript_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          layout: Json
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout?: Json
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout?: Json
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          available_points: number | null
          created_at: string | null
          current_balance: number | null
          id: string
          level: number | null
          tier: string | null
          total_earned: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_points?: number | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          level?: number | null
          tier?: string | null
          total_earned?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_points?: number | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          level?: number | null
          tier?: string | null
          total_earned?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          video_id: string | null
          viewer_ip: string | null
          watched_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
          viewer_ip?: string | null
          watched_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
          viewer_ip?: string | null
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          comments_count: number | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_live: boolean | null
          is_published: boolean | null
          likes_count: number | null
          live_ended_at: string | null
          live_started_at: string | null
          metadata: Json | null
          status: string | null
          storage_url: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_live?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          live_ended_at?: string | null
          live_started_at?: string | null
          metadata?: Json | null
          status?: string | null
          storage_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_live?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          live_ended_at?: string | null
          live_started_at?: string | null
          metadata?: Json | null
          status?: string | null
          storage_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      vip_affiliates: {
        Row: {
          available_balance: number | null
          bank_info: Json | null
          bio: string | null
          created_at: string | null
          direct_referrals_count: number | null
          id: string
          is_creator: boolean | null
          level1_count: number | null
          level2_count: number | null
          pix_key: string | null
          referral_code: string
          referral_count: number | null
          social_links: Json | null
          sponsor_id: string | null
          status: string | null
          team_earnings: number | null
          tier: Database["public"]["Enums"]["affiliate_tier"] | null
          total_earnings: number | null
          total_referrals: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          available_balance?: number | null
          bank_info?: Json | null
          bio?: string | null
          created_at?: string | null
          direct_referrals_count?: number | null
          id?: string
          is_creator?: boolean | null
          level1_count?: number | null
          level2_count?: number | null
          pix_key?: string | null
          referral_code: string
          referral_count?: number | null
          social_links?: Json | null
          sponsor_id?: string | null
          status?: string | null
          team_earnings?: number | null
          tier?: Database["public"]["Enums"]["affiliate_tier"] | null
          total_earnings?: number | null
          total_referrals?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          available_balance?: number | null
          bank_info?: Json | null
          bio?: string | null
          created_at?: string | null
          direct_referrals_count?: number | null
          id?: string
          is_creator?: boolean | null
          level1_count?: number | null
          level2_count?: number | null
          pix_key?: string | null
          referral_code?: string
          referral_count?: number | null
          social_links?: Json | null
          sponsor_id?: string | null
          status?: string | null
          team_earnings?: number | null
          tier?: Database["public"]["Enums"]["affiliate_tier"] | null
          total_earnings?: number | null
          total_referrals?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_affiliates_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vip_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          parent_id: string | null
          post_id: string
          replies_count: number | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          replies_count?: number | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          replies_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vip_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vip_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      vip_live_chat: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_highlighted: boolean | null
          is_pinned: boolean | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_highlighted?: boolean | null
          is_pinned?: boolean | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_highlighted?: boolean | null
          is_pinned?: boolean | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_live_chat_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vip_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_posts: {
        Row: {
          author_id: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          dislikes_count: number | null
          hashtags: string[] | null
          id: string
          is_live: boolean | null
          likes_count: number | null
          live_ended_at: string | null
          live_started_at: string | null
          media_type: string | null
          media_url: string | null
          media_urls: string[] | null
          post_type: string | null
          shares_count: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
          youtube_video_id: string | null
        }
        Insert: {
          author_id?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          dislikes_count?: number | null
          hashtags?: string[] | null
          id?: string
          is_live?: boolean | null
          likes_count?: number | null
          live_ended_at?: string | null
          live_started_at?: string | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
          youtube_video_id?: string | null
        }
        Update: {
          author_id?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          dislikes_count?: number | null
          hashtags?: string[] | null
          id?: string
          is_live?: boolean | null
          likes_count?: number | null
          live_ended_at?: string | null
          live_started_at?: string | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      vip_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vip_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          pix_key: string
          processed_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          pix_key: string
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          pix_key?: string
          processed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
    }
    Enums: {
      affiliate_tier: "bronze" | "silver" | "gold" | "diamond"
      app_role: "user" | "streamer" | "admin" | "owner" | "editor"
      enrollment_status: "active" | "completed" | "cancelled" | "expired"
      order_status: "pending" | "paid" | "cancelled" | "refunded" | "expired"
      product_type:
        | "course"
        | "ebook"
        | "mentorship"
        | "subscription"
        | "physical"
        | "mentoring"
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
      affiliate_tier: ["bronze", "silver", "gold", "diamond"],
      app_role: ["user", "streamer", "admin", "owner", "editor"],
      enrollment_status: ["active", "completed", "cancelled", "expired"],
      order_status: ["pending", "paid", "cancelled", "refunded", "expired"],
      product_type: [
        "course",
        "ebook",
        "mentorship",
        "subscription",
        "physical",
        "mentoring",
      ],
    },
  },
} as const
