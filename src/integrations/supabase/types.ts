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
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          id?: string
          is_available?: boolean | null
          schedule?: Json | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          id?: string
          is_available?: boolean | null
          schedule?: Json | null
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
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
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
      affiliate_invites: {
        Row: {
          accepted_at: string | null
          affiliate_id: string
          code: string
          created_at: string | null
          email: string
          id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          affiliate_id: string
          code: string
          created_at?: string | null
          email: string
          id?: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          affiliate_id?: string
          code?: string
          created_at?: string | null
          email?: string
          id?: string
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
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          post_type: string | null
          shares_count: number | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          author_id: string
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          author_id?: string
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
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
          created_at: string | null
          form_completed: boolean | null
          id: string
          metadata: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          form_completed?: boolean | null
          id?: string
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          form_completed?: boolean | null
          id?: string
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
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
          pdf_url: string | null
          template_id: string | null
        }
        Insert: {
          certificate_id?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          template_id?: string | null
        }
        Update: {
          certificate_id?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          template_id?: string | null
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
          id: string
          skipped: boolean | null
          step: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_steps?: number[] | null
          created_at?: string | null
          id?: string
          skipped?: boolean | null
          step?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_steps?: number[] | null
          created_at?: string | null
          id?: string
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
          category_id: string | null
          commission_percent: number | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instructor_id: string | null
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          metadata: Json | null
          name: string
          original_price: number | null
          price: number | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          requires_approval: boolean | null
          short_description: string | null
          slug: string | null
          thumbnail_url: string | null
          total_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          commission_percent?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          name: string
          original_price?: number | null
          price?: number | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          requires_approval?: boolean | null
          short_description?: string | null
          slug?: string | null
          thumbnail_url?: string | null
          total_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          commission_percent?: number | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          name?: string
          original_price?: number | null
          price?: number | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          requires_approval?: boolean | null
          short_description?: string | null
          slug?: string | null
          thumbnail_url?: string | null
          total_lessons?: number | null
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
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_cost: number
          quantity_available: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_cost: number
          quantity_available?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_cost?: number
          quantity_available?: number | null
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
          id: string
          level: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_points?: number | null
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_points?: number | null
          created_at?: string | null
          id?: string
          level?: number | null
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
          id: string
          level1_count: number | null
          level2_count: number | null
          pix_key: string | null
          referral_code: string
          social_links: Json | null
          sponsor_id: string | null
          status: string | null
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
          id?: string
          level1_count?: number | null
          level2_count?: number | null
          pix_key?: string | null
          referral_code: string
          social_links?: Json | null
          sponsor_id?: string | null
          status?: string | null
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
          id?: string
          level1_count?: number | null
          level2_count?: number | null
          pix_key?: string | null
          referral_code?: string
          social_links?: Json | null
          sponsor_id?: string | null
          status?: string | null
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
      vip_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          media_urls: string[] | null
          post_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      affiliate_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
      app_role: "user" | "streamer" | "admin"
      enrollment_status: "active" | "completed" | "cancelled" | "expired"
      order_status: "pending" | "paid" | "cancelled" | "refunded" | "expired"
      product_type:
        | "course"
        | "ebook"
        | "mentorship"
        | "subscription"
        | "physical"
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
      affiliate_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
      app_role: ["user", "streamer", "admin"],
      enrollment_status: ["active", "completed", "cancelled", "expired"],
      order_status: ["pending", "paid", "cancelled", "refunded", "expired"],
      product_type: [
        "course",
        "ebook",
        "mentorship",
        "subscription",
        "physical",
      ],
    },
  },
} as const
