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
      abandoned_forms: {
        Row: {
          created_at: string | null
          email: string | null
          follow_up_sent: boolean | null
          follow_up_sent_at: string | null
          id: string
          name: string | null
          phone: string | null
          subject: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          follow_up_sent?: boolean | null
          follow_up_sent_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          subject?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          follow_up_sent?: boolean | null
          follow_up_sent_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          subject?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      admin_availability: {
        Row: {
          active_conversations: number | null
          admin_id: string
          created_at: string | null
          id: string
          last_seen_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active_conversations?: number | null
          admin_id: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active_conversations?: number | null
          admin_id?: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
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
          expires_at?: string
          id?: string
          invited_by?: string | null
          inviter_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
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
          commission_amount: number
          commission_level: number | null
          commission_rate: number
          commission_type: string | null
          created_at: string | null
          id: string
          order_id: string | null
          order_total: number
          paid_at: string | null
          paid_via: string | null
          pix_transaction_id: string | null
          referral_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          commission_level?: number | null
          commission_rate: number
          commission_type?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_total: number
          paid_at?: string | null
          paid_via?: string | null
          pix_transaction_id?: string | null
          referral_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_level?: number | null
          commission_rate?: number
          commission_type?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_total?: number
          paid_at?: string | null
          paid_via?: string | null
          pix_transaction_id?: string | null
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
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
        Relationships: [
          {
            foreignKeyName: "affiliate_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          commission_rate: number | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          name: string | null
          program_id: string | null
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          name?: string | null
          program_id?: string | null
          status?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          name?: string | null
          program_id?: string | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_invites_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_materials: {
        Row: {
          content: string | null
          created_at: string | null
          dimensions: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          product_id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          dimensions?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          dimensions?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          title?: string
          type?: string
          updated_at?: string | null
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
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string
          updated_at?: string | null
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
          affiliate_id: string
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
        }
        Insert: {
          affiliate_id: string
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
        }
        Update: {
          affiliate_id?: string
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_post_likes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_post_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "affiliate_post_comments"
            referencedColumns: ["id"]
          },
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
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
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
      affiliate_program_products: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: string
          product_id: string
          program_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          product_id: string
          program_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          product_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_program_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_program_products_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          attribution_rule: string
          created_at: string | null
          created_by: string | null
          default_commission_rate: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          attribution_rule?: string
          created_at?: string | null
          created_by?: string | null
          default_commission_rate?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          attribution_rule?: string
          created_at?: string | null
          created_by?: string | null
          default_commission_rate?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          converted_at: string | null
          created_at: string | null
          created_ip: string | null
          id: string
          order_id: string | null
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string | null
          validated: boolean | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          created_ip?: string | null
          id?: string
          order_id?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string | null
          validated?: boolean | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          created_ip?: string | null
          id?: string
          order_id?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string | null
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          comment: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          id: string
          message_id: string | null
          rating: number | null
          resolved: boolean | null
        }
        Insert: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message_id?: string | null
          rating?: number | null
          resolved?: boolean | null
        }
        Update: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message_id?: string | null
          rating?: number | null
          resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learnings: {
        Row: {
          category: string | null
          created_at: string
          fail_score: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          last_used: string | null
          pattern: string
          response_template: string | null
          success_score: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          fail_score?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_used?: string | null
          pattern: string
          response_template?: string | null
          success_score?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          fail_score?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_used?: string | null
          pattern?: string
          response_template?: string | null
          success_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_mode_config: {
        Row: {
          confidence_threshold: number | null
          description: string | null
          id: string
          is_enabled: boolean | null
          mode: string
          priority: number | null
          prompt_template: string
          trigger_keywords: string[] | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          confidence_threshold?: number | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          mode: string
          priority?: number | null
          prompt_template: string
          trigger_keywords?: string[] | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          confidence_threshold?: number | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          mode?: string
          priority?: number | null
          prompt_template?: string
          trigger_keywords?: string[] | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_name: string
          event_properties: Json | null
          id: string
          page_url: string | null
          referrer: string | null
          session_id: string | null
          tenant_id: string | null
          user_id: string | null
          user_properties: Json | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_name: string
          event_properties?: Json | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          user_properties?: Json | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_name?: string
          event_properties?: Json | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          user_properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          action_result: Json | null
          error_message: string | null
          executed_at: string | null
          id: string
          rule_id: string | null
          status: string | null
          trigger_data: Json | null
        }
        Insert: {
          action_result?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
        }
        Update: {
          action_result?: Json | null
          error_message?: string | null
          executed_at?: string | null
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
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          priority: number | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          priority?: number | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          priority?: number | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      avaliacao_questoes: {
        Row: {
          avaliacao_id: string
          correct_index: number
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json
          position: number
          question: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          avaliacao_id: string
          correct_index?: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          avaliacao_id?: string
          correct_index?: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_questoes_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          certificate_template_id: string | null
          created_at: string | null
          created_by: string | null
          data_aplicacao: string | null
          descricao: string | null
          generates_certificate: boolean | null
          id: string
          is_active: boolean | null
          modulo_id: string | null
          nota_maxima: number
          nota_minima_aprovacao: number
          peso: number
          product_id: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          certificate_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aplicacao?: string | null
          descricao?: string | null
          generates_certificate?: boolean | null
          id?: string
          is_active?: boolean | null
          modulo_id?: string | null
          nota_maxima?: number
          nota_minima_aprovacao?: number
          peso?: number
          product_id?: string | null
          tipo?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          certificate_template_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_aplicacao?: string | null
          descricao?: string | null
          generates_certificate?: boolean | null
          id?: string
          is_active?: boolean | null
          modulo_id?: string | null
          nota_maxima?: number
          nota_minima_aprovacao?: number
          peso?: number
          product_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_certificate_template_id_fkey"
            columns: ["certificate_template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_partners: {
        Row: {
          certifications_target: string[] | null
          cnpj: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end: string | null
          contract_start: string | null
          contract_value: number | null
          created_at: string | null
          created_by: string | null
          enrolled_employees: number | null
          id: string
          metadata: Json | null
          notes: string | null
          partner_type: string | null
          status: string | null
          total_employees: number | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          certifications_target?: string[] | null
          cnpj?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          enrolled_employees?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          partner_type?: string | null
          status?: string | null
          total_employees?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          certifications_target?: string[] | null
          cnpj?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_value?: number | null
          created_at?: string | null
          created_by?: string | null
          enrolled_employees?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          partner_type?: string | null
          status?: string | null
          total_employees?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_partners_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
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
          layout: Json | null
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
          layout?: Json | null
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
          layout?: Json | null
          name?: string
          preview_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      certification_badges: {
        Row: {
          badge_type: string | null
          certification:
            | Database["public"]["Enums"]["financial_certification"]
            | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number | null
          requirement_type: string | null
          requirement_value: number | null
        }
        Insert: {
          badge_type?: string | null
          certification?:
            | Database["public"]["Enums"]["financial_certification"]
            | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward?: number | null
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Update: {
          badge_type?: string | null
          certification?:
            | Database["public"]["Enums"]["financial_certification"]
            | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number | null
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      certification_progress: {
        Row: {
          average_score: number | null
          best_score: number | null
          certification: Database["public"]["Enums"]["financial_certification"]
          certified_at: string | null
          correct_answers: number | null
          created_at: string | null
          estimated_readiness: number | null
          exams_completed: number | null
          exams_passed: number | null
          id: string
          is_certified: boolean | null
          strong_topics: string[] | null
          target_date: string | null
          total_questions_answered: number | null
          total_study_hours: number | null
          updated_at: string | null
          user_id: string
          weak_topics: string[] | null
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          certification: Database["public"]["Enums"]["financial_certification"]
          certified_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          estimated_readiness?: number | null
          exams_completed?: number | null
          exams_passed?: number | null
          id?: string
          is_certified?: boolean | null
          strong_topics?: string[] | null
          target_date?: string | null
          total_questions_answered?: number | null
          total_study_hours?: number | null
          updated_at?: string | null
          user_id: string
          weak_topics?: string[] | null
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          certification?: Database["public"]["Enums"]["financial_certification"]
          certified_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          estimated_readiness?: number | null
          exams_completed?: number | null
          exams_passed?: number | null
          id?: string
          is_certified?: boolean | null
          strong_topics?: string[] | null
          target_date?: string | null
          total_questions_answered?: number | null
          total_study_hours?: number | null
          updated_at?: string | null
          user_id?: string
          weak_topics?: string[] | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          ai_confidence: number | null
          assigned_admin_id: string | null
          closed_at: string | null
          created_at: string
          current_mode: string | null
          escalation_reason: string | null
          form_completed: boolean | null
          id: string
          is_typing_admin: boolean | null
          is_typing_visitor: boolean | null
          last_activity_at: string | null
          rating: number | null
          rating_comment: string | null
          status: string
          subject: string | null
          transferred_at: string | null
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_id: string
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          ai_confidence?: number | null
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          current_mode?: string | null
          escalation_reason?: string | null
          form_completed?: boolean | null
          id?: string
          is_typing_admin?: boolean | null
          is_typing_visitor?: boolean | null
          last_activity_at?: string | null
          rating?: number | null
          rating_comment?: string | null
          status?: string
          subject?: string | null
          transferred_at?: string | null
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_id: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          ai_confidence?: number | null
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          current_mode?: string | null
          escalation_reason?: string | null
          form_completed?: boolean | null
          id?: string
          is_typing_admin?: boolean | null
          is_typing_visitor?: boolean | null
          last_activity_at?: string | null
          rating?: number | null
          rating_comment?: string | null
          status?: string
          subject?: string | null
          transferred_at?: string | null
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_id?: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          admin_id: string | null
          content: string
          conversation_id: string
          created_at: string
          feedback_score: number | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_ai_response: boolean
          message_type: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          feedback_score?: number | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_ai_response?: boolean
          message_type?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          feedback_score?: number | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_ai_response?: boolean
          message_type?: string | null
          role?: string
          user_id?: string | null
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
      commission_settings: {
        Row: {
          affiliate_rate: number | null
          created_at: string | null
          creator_rate: number | null
          id: string
          is_active: boolean | null
          mlm_level1_rate: number | null
          mlm_level2_rate: number | null
          platform_rate: number | null
          setting_type: string
          updated_at: string | null
        }
        Insert: {
          affiliate_rate?: number | null
          created_at?: string | null
          creator_rate?: number | null
          id?: string
          is_active?: boolean | null
          mlm_level1_rate?: number | null
          mlm_level2_rate?: number | null
          platform_rate?: number | null
          setting_type: string
          updated_at?: string | null
        }
        Update: {
          affiliate_rate?: number | null
          created_at?: string | null
          creator_rate?: number | null
          id?: string
          is_active?: boolean | null
          mlm_level1_rate?: number | null
          mlm_level2_rate?: number | null
          platform_rate?: number | null
          setting_type?: string
          updated_at?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "community_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "community_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          course_id: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          is_resolved: boolean | null
          likes_count: number | null
          replies_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      community_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          likes_count: number | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          likes_count?: number | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          likes_count?: number | null
          post_id?: string
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
          academic_coordinator_name: string | null
          academic_coordinator_role: string | null
          academic_coordinator_signature_url: string | null
          additional_signatories: Json | null
          address_city: string | null
          address_complement: string | null
          address_country: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          certificate_footer_text: string | null
          certificate_template: string | null
          certificate_template_id: string | null
          cnpj: string | null
          company_name: string
          created_at: string | null
          email: string | null
          favicon_url: string | null
          id: string
          legal_name: string | null
          legal_representative_cpf: string | null
          legal_representative_name: string | null
          legal_representative_role: string | null
          legal_representative_signature_url: string | null
          logo_dark_url: string | null
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          transcript_template_id: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          academic_coordinator_name?: string | null
          academic_coordinator_role?: string | null
          academic_coordinator_signature_url?: string | null
          additional_signatories?: Json | null
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          certificate_footer_text?: string | null
          certificate_template?: string | null
          certificate_template_id?: string | null
          cnpj?: string | null
          company_name: string
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          legal_name?: string | null
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          legal_representative_role?: string | null
          legal_representative_signature_url?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          transcript_template_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          academic_coordinator_name?: string | null
          academic_coordinator_role?: string | null
          academic_coordinator_signature_url?: string | null
          additional_signatories?: Json | null
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          certificate_footer_text?: string | null
          certificate_template?: string | null
          certificate_template_id?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          legal_name?: string | null
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          legal_representative_role?: string | null
          legal_representative_signature_url?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          transcript_template_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_certificate_template_id_fkey"
            columns: ["certificate_template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_settings_transcript_template_id_fkey"
            columns: ["transcript_template_id"]
            isOneToOne: false
            referencedRelation: "transcript_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          notes: string | null
          rule_id: string
          status: string
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rule_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rule_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read_at: string | null
          replied_at: string | null
          source: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read_at?: string | null
          replied_at?: string | null
          source?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read_at?: string | null
          replied_at?: string | null
          source?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase: number | null
          product_ids: string[] | null
          updated_at: string
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          product_ids?: string[] | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          product_ids?: string[] | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      course_certificates: {
        Row: {
          certificate_number: string
          certification_type: string
          course_hours: number | null
          course_name: string
          created_at: string
          final_score: number | null
          id: string
          is_public: boolean | null
          issued_at: string
          metadata: Json | null
          module_id: string | null
          product_id: string
          student_name: string
          user_id: string
          validation_code: string
        }
        Insert: {
          certificate_number: string
          certification_type?: string
          course_hours?: number | null
          course_name: string
          created_at?: string
          final_score?: number | null
          id?: string
          is_public?: boolean | null
          issued_at?: string
          metadata?: Json | null
          module_id?: string | null
          product_id: string
          student_name: string
          user_id: string
          validation_code: string
        }
        Update: {
          certificate_number?: string
          certification_type?: string
          course_hours?: number | null
          course_name?: string
          created_at?: string
          final_score?: number | null
          id?: string
          is_public?: boolean | null
          issued_at?: string
          metadata?: Json | null
          module_id?: string | null
          product_id?: string
          student_name?: string
          user_id?: string
          validation_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          affiliate_amount: number | null
          affiliate_id: string | null
          created_at: string | null
          creator_amount: number
          creator_id: string
          gross_amount: number
          id: string
          order_id: string | null
          paid_at: string | null
          platform_amount: number
          product_id: string | null
          status: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          affiliate_amount?: number | null
          affiliate_id?: string | null
          created_at?: string | null
          creator_amount: number
          creator_id: string
          gross_amount: number
          id?: string
          order_id?: string | null
          paid_at?: string | null
          platform_amount: number
          product_id?: string | null
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          affiliate_amount?: number | null
          affiliate_id?: string | null
          created_at?: string | null
          creator_amount?: number
          creator_id?: string
          gross_amount?: number
          id?: string
          order_id?: string | null
          paid_at?: string | null
          platform_amount?: number
          product_id?: string | null
          status?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_payouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_payouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_subscriptions: {
        Row: {
          affiliate_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_monthly: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_monthly?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_monthly?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_logs: {
        Row: {
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
      education_impact_metrics: {
        Row: {
          active_students: number | null
          average_score: number | null
          b2b_revenue: number | null
          b2c_revenue: number | null
          certification:
            | Database["public"]["Enums"]["financial_certification"]
            | null
          created_at: string | null
          exams_passed: number | null
          exams_taken: number | null
          id: string
          metadata: Json | null
          metric_date: string
          new_certifications: number | null
          pass_rate: number | null
          social_impact_students: number | null
          study_hours_total: number | null
          total_students: number | null
          unit_id: string | null
        }
        Insert: {
          active_students?: number | null
          average_score?: number | null
          b2b_revenue?: number | null
          b2c_revenue?: number | null
          certification?:
            | Database["public"]["Enums"]["financial_certification"]
            | null
          created_at?: string | null
          exams_passed?: number | null
          exams_taken?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          new_certifications?: number | null
          pass_rate?: number | null
          social_impact_students?: number | null
          study_hours_total?: number | null
          total_students?: number | null
          unit_id?: string | null
        }
        Update: {
          active_students?: number | null
          average_score?: number | null
          b2b_revenue?: number | null
          b2c_revenue?: number | null
          certification?:
            | Database["public"]["Enums"]["financial_certification"]
            | null
          created_at?: string | null
          exams_passed?: number | null
          exams_taken?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          new_certifications?: number | null
          pass_rate?: number | null
          social_impact_students?: number | null
          study_hours_total?: number | null
          total_students?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_impact_metrics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          bounced_count: number | null
          clicked_count: number | null
          created_at: string | null
          created_by: string | null
          esp_id: string | null
          html_content: string
          id: string
          name: string
          opened_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          text_content: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          bounced_count?: number | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          esp_id?: string | null
          html_content: string
          id?: string
          name: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          text_content?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          bounced_count?: number | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          esp_id?: string | null
          html_content?: string
          id?: string
          name?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          text_content?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_esp_id_fkey"
            columns: ["esp_id"]
            isOneToOne: false
            referencedRelation: "esp_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email_log_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          recipient_email: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email_log_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          recipient_email: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email_log_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
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
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          name: string
          subject: string
          text_content: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          created_at: string
          enrolled_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          order_id: string | null
          product_id: string
          progress_percent: number | null
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          order_id?: string | null
          product_id: string
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          order_id?: string | null
          product_id?: string
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
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
          config: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          provider: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          exam_id: string
          id: string
          passed: boolean | null
          questions_order: Json | null
          review_data: Json | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          time_spent_seconds: number | null
          total_correct: number | null
          total_unanswered: number | null
          total_wrong: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          exam_id: string
          id?: string
          passed?: boolean | null
          questions_order?: Json | null
          review_data?: Json | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          time_spent_seconds?: number | null
          total_correct?: number | null
          total_unanswered?: number | null
          total_wrong?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          exam_id?: string
          id?: string
          passed?: boolean | null
          questions_order?: Json | null
          review_data?: Json | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          time_spent_seconds?: number | null
          total_correct?: number | null
          total_unanswered?: number | null
          total_wrong?: number | null
          updated_at?: string | null
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
          allow_review: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          product_id: string | null
          show_correct_answers: boolean | null
          shuffle_options: boolean | null
          shuffle_questions: boolean | null
          time_limit_minutes: number | null
          title: string
          total_questions: number | null
          updated_at: string | null
        }
        Insert: {
          allow_review?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          product_id?: string | null
          show_correct_answers?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_review?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          product_id?: string | null
          show_correct_answers?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_simulators_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
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
          allow_review: boolean | null
          certification: Database["public"]["Enums"]["financial_certification"]
          created_at: string | null
          created_by: string | null
          description: string | null
          exam_type: string | null
          id: string
          is_free: boolean | null
          max_attempts: number | null
          passing_score: number | null
          product_id: string | null
          question_selection: Json | null
          show_answers_after: boolean | null
          shuffle_options: boolean | null
          shuffle_questions: boolean | null
          status: Database["public"]["Enums"]["exam_status"] | null
          time_limit_minutes: number | null
          title: string
          total_questions: number
          updated_at: string | null
        }
        Insert: {
          allow_review?: boolean | null
          certification: Database["public"]["Enums"]["financial_certification"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_type?: string | null
          id?: string
          is_free?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          product_id?: string | null
          question_selection?: Json | null
          show_answers_after?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          status?: Database["public"]["Enums"]["exam_status"] | null
          time_limit_minutes?: number | null
          title: string
          total_questions?: number
          updated_at?: string | null
        }
        Update: {
          allow_review?: boolean | null
          certification?: Database["public"]["Enums"]["financial_certification"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_type?: string | null
          id?: string
          is_free?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          product_id?: string | null
          question_selection?: Json | null
          show_answers_after?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          status?: Database["public"]["Enums"]["exam_status"] | null
          time_limit_minutes?: number | null
          title?: string
          total_questions?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_exams_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_questions: {
        Row: {
          bank_id: string | null
          certification: Database["public"]["Enums"]["financial_certification"]
          correct_answer: string | null
          created_at: string | null
          created_by: string | null
          cvm_regulation: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null
          explanation: string | null
          id: string
          is_active: boolean | null
          options: Json
          points: number | null
          question_text: string
          question_type: string | null
          reference_material: string | null
          subtopic: string | null
          success_rate: number | null
          tags: string[] | null
          time_limit_seconds: number | null
          topic: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          bank_id?: string | null
          certification: Database["public"]["Enums"]["financial_certification"]
          correct_answer?: string | null
          created_at?: string | null
          created_by?: string | null
          cvm_regulation?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          points?: number | null
          question_text: string
          question_type?: string | null
          reference_material?: string | null
          subtopic?: string | null
          success_rate?: number | null
          tags?: string[] | null
          time_limit_seconds?: number | null
          topic: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          bank_id?: string | null
          certification?: Database["public"]["Enums"]["financial_certification"]
          correct_answer?: string | null
          created_at?: string | null
          created_by?: string | null
          cvm_regulation?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          points?: number | null
          question_text?: string
          question_type?: string | null
          reference_material?: string | null
          subtopic?: string | null
          success_rate?: number | null
          tags?: string[] | null
          time_limit_seconds?: number | null
          topic?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_questions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia_alunos: {
        Row: {
          aulas_presentes: number
          aulas_totais: number
          created_at: string | null
          frequencia_percent: number | null
          id: string
          modulo_id: string
          product_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aulas_presentes?: number
          aulas_totais?: number
          created_at?: string | null
          frequencia_percent?: number | null
          id?: string
          modulo_id: string
          product_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aulas_presentes?: number
          aulas_totais?: number
          created_at?: string | null
          frequencia_percent?: number | null
          id?: string
          modulo_id?: string
          product_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_alunos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencia_alunos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_certificates: {
        Row: {
          course_certificate_id: string | null
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          pdf_url: string | null
          product_id: string
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_certificate_id?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          product_id: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_certificate_id?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          product_id?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_certificates_course_certificate_id_fkey"
            columns: ["course_certificate_id"]
            isOneToOne: false
            referencedRelation: "course_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          conceito: string | null
          created_at: string | null
          data_conclusao: string | null
          frequencia: number | null
          id: string
          media_final: number | null
          modulo_id: string
          nota_manual: number | null
          observacoes: string | null
          product_id: string
          situacao: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conceito?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          frequencia?: number | null
          id?: string
          media_final?: number | null
          modulo_id: string
          nota_manual?: number | null
          observacoes?: string | null
          product_id: string
          situacao?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conceito?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          frequencia?: number | null
          id?: string
          media_final?: number | null
          modulo_id?: string
          nota_manual?: number | null
          observacoes?: string | null
          product_id?: string
          situacao?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "product_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_modulos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          watch_time: number | null
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_time?: number | null
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_time?: number | null
          watch_time_seconds?: number | null
        }
        Relationships: [
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
          answers: Json | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string
          id: string
          lesson_id: string
          passed: boolean | null
          score: number | null
          started_at: string
          time_spent_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          id?: string
          lesson_id: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          time_spent_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          id?: string
          lesson_id?: string
          passed?: boolean | null
          score?: number | null
          started_at?: string
          time_spent_seconds?: number | null
          total_questions?: number | null
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
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
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
      notas_alunos: {
        Row: {
          atualizado_em: string | null
          avaliacao_id: string
          id: string
          lancado_em: string | null
          lancado_por: string | null
          nota: number | null
          observacoes: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string | null
          avaliacao_id: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          nota?: number | null
          observacoes?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string | null
          avaliacao_id?: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          nota?: number | null
          observacoes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_alunos_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read_at: string | null
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json | null
          created_at: string | null
          current_step: number | null
          data: Json | null
          id: string
          is_completed: boolean | null
          onboarding_type: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          data?: Json | null
          id?: string
          is_completed?: boolean | null
          onboarding_type?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          data?: Json | null
          id?: string
          is_completed?: boolean | null
          onboarding_type?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          is_order_bump: boolean | null
          is_upsell: boolean | null
          order_id: string
          price: number
          product_id: string
          product_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_order_bump?: boolean | null
          is_upsell?: boolean | null
          order_id: string
          price: number
          product_id: string
          product_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_order_bump?: boolean | null
          is_upsell?: boolean | null
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
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
          coupon_id: string | null
          created_at: string
          customer_cpf: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount: number | null
          id: string
          metadata: Json | null
          order_number: string
          paid_at: string | null
          payment_id: string | null
          payment_installments: number | null
          payment_method: string | null
          payment_url: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          order_number: string
          paid_at?: string | null
          payment_id?: string | null
          payment_installments?: number | null
          payment_method?: string | null
          payment_url?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          order_number?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_installments?: number | null
          payment_method?: string | null
          payment_url?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pix_split_configs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          efi_split_id: string | null
          id: string
          is_active: boolean | null
          name: string
          splits: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          efi_split_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          splits?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          efi_split_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          splits?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      pix_transactions: {
        Row: {
          affiliate_id: string | null
          chave_pix: string | null
          commission_id: string | null
          created_at: string | null
          e2e_id: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          loc_id: string | null
          order_id: string | null
          paid_at: string | null
          qr_code: string | null
          qr_code_base64: string | null
          redemption_id: string | null
          split_config_id: string | null
          status: string | null
          tipo: string
          txid: string
          updated_at: string | null
          valor: number
          webhook_data: Json | null
          withdrawal_id: string | null
        }
        Insert: {
          affiliate_id?: string | null
          chave_pix?: string | null
          commission_id?: string | null
          created_at?: string | null
          e2e_id?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          loc_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          redemption_id?: string | null
          split_config_id?: string | null
          status?: string | null
          tipo: string
          txid: string
          updated_at?: string | null
          valor: number
          webhook_data?: Json | null
          withdrawal_id?: string | null
        }
        Update: {
          affiliate_id?: string | null
          chave_pix?: string | null
          commission_id?: string | null
          created_at?: string | null
          e2e_id?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          loc_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          redemption_id?: string | null
          split_config_id?: string | null
          status?: string | null
          tipo?: string
          txid?: string
          updated_at?: string | null
          valor?: number
          webhook_data?: Json | null
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pix_transactions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "affiliate_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_transactions_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          affiliate_id: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          order_id: string | null
          order_total: number
        }
        Insert: {
          affiliate_id?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_total: number
        }
        Update: {
          affiliate_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          order_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          metadata: Json | null
          presentation_id: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          metadata?: Json | null
          presentation_id?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          metadata?: Json | null
          presentation_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_assets_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "vip_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          slides: Json | null
          theme: Json | null
          thumbnail_url: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          slides?: Json | null
          theme?: Json | null
          thumbnail_url?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          slides?: Json | null
          theme?: Json | null
          thumbnail_url?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      presentation_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          presentation_id: string
          slides: Json
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          presentation_id: string
          slides: Json
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          presentation_id?: string
          slides?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_versions_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "vip_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_content: {
        Row: {
          content_type: string
          created_at: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_preview: boolean | null
          metadata: Json | null
          mime_type: string | null
          position: number | null
          product_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_preview?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          position?: number | null
          product_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_preview?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          position?: number | null
          product_id?: string
          title?: string | null
          updated_at?: string | null
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
          content_text: string | null
          content_type: Database["public"]["Enums"]["lesson_content_type"]
          created_at: string
          description: string | null
          download_files: Json | null
          file_name: string | null
          file_url: string | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          name: string
          position: number
          quiz_passing_score: number | null
          quiz_questions: Json | null
          quiz_required: boolean | null
          quiz_time_limit: number | null
          simulator_id: string | null
          updated_at: string
          video_duration: number | null
          video_url: string | null
        }
        Insert: {
          content_text?: string | null
          content_type?: Database["public"]["Enums"]["lesson_content_type"]
          created_at?: string
          description?: string | null
          download_files?: Json | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          name: string
          position?: number
          quiz_passing_score?: number | null
          quiz_questions?: Json | null
          quiz_required?: boolean | null
          quiz_time_limit?: number | null
          simulator_id?: string | null
          updated_at?: string
          video_duration?: number | null
          video_url?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: Database["public"]["Enums"]["lesson_content_type"]
          created_at?: string
          description?: string | null
          download_files?: Json | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          name?: string
          position?: number
          quiz_passing_score?: number | null
          quiz_questions?: Json | null
          quiz_required?: boolean | null
          quiz_time_limit?: number | null
          simulator_id?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "product_lessons_simulator_id_fkey"
            columns: ["simulator_id"]
            isOneToOne: false
            referencedRelation: "exam_simulators"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_free_preview: boolean | null
          name: string
          position: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          name: string
          position?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_free_preview?: boolean | null
          name?: string
          position?: number
          product_id?: string
          updated_at?: string
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
          affiliate_commission_rate: number | null
          affiliate_enabled: boolean | null
          affiliate_free: boolean | null
          affiliate_free_tiers: string[] | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          creator_commission_rate: number | null
          creator_id: string | null
          description: string | null
          download_url: string | null
          external_integrations: Json | null
          faq: Json | null
          guarantee_days: number | null
          gumroad_link: string | null
          hotmart_product_id: string | null
          hotmart_webhook_url: string | null
          id: string
          is_active: boolean | null
          is_creator_product: boolean | null
          language: string | null
          max_installments: number | null
          name: string
          order_bump_product_id: string | null
          original_price: number | null
          platform_commission_rate: number | null
          price: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          product_type: Database["public"]["Enums"]["product_type"]
          saas_features: Json | null
          saas_url: string | null
          sales_page_content: string | null
          sales_page_published: boolean | null
          sales_page_template: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          subscription_interval: string | null
          subscription_price: number | null
          tags: string[] | null
          testimonials: Json | null
          trailer_url: string | null
          updated_at: string
          upsell_product_id: string | null
        }
        Insert: {
          access_days?: number | null
          affiliate_commission_rate?: number | null
          affiliate_enabled?: boolean | null
          affiliate_free?: boolean | null
          affiliate_free_tiers?: string[] | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          creator_commission_rate?: number | null
          creator_id?: string | null
          description?: string | null
          download_url?: string | null
          external_integrations?: Json | null
          faq?: Json | null
          guarantee_days?: number | null
          gumroad_link?: string | null
          hotmart_product_id?: string | null
          hotmart_webhook_url?: string | null
          id?: string
          is_active?: boolean | null
          is_creator_product?: boolean | null
          language?: string | null
          max_installments?: number | null
          name: string
          order_bump_product_id?: string | null
          original_price?: number | null
          platform_commission_rate?: number | null
          price?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          product_type?: Database["public"]["Enums"]["product_type"]
          saas_features?: Json | null
          saas_url?: string | null
          sales_page_content?: string | null
          sales_page_published?: boolean | null
          sales_page_template?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          subscription_interval?: string | null
          subscription_price?: number | null
          tags?: string[] | null
          testimonials?: Json | null
          trailer_url?: string | null
          updated_at?: string
          upsell_product_id?: string | null
        }
        Update: {
          access_days?: number | null
          affiliate_commission_rate?: number | null
          affiliate_enabled?: boolean | null
          affiliate_free?: boolean | null
          affiliate_free_tiers?: string[] | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          creator_commission_rate?: number | null
          creator_id?: string | null
          description?: string | null
          download_url?: string | null
          external_integrations?: Json | null
          faq?: Json | null
          guarantee_days?: number | null
          gumroad_link?: string | null
          hotmart_product_id?: string | null
          hotmart_webhook_url?: string | null
          id?: string
          is_active?: boolean | null
          is_creator_product?: boolean | null
          language?: string | null
          max_installments?: number | null
          name?: string
          order_bump_product_id?: string | null
          original_price?: number | null
          platform_commission_rate?: number | null
          price?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          product_type?: Database["public"]["Enums"]["product_type"]
          saas_features?: Json | null
          saas_url?: string | null
          sales_page_content?: string | null
          sales_page_published?: boolean | null
          sales_page_template?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          subscription_interval?: string | null
          subscription_price?: number | null
          tags?: string[] | null
          testimonials?: Json | null
          trailer_url?: string | null
          updated_at?: string
          upsell_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_edit_history: {
        Row: {
          changed_at: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string | null
          field_changed?: string
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
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution_logo_url: string | null
          institution_name: string
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution_logo_url?: string | null
          institution_name: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution_logo_url?: string | null
          institution_name?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_experiences: {
        Row: {
          company_logo_url: string | null
          company_name: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          position: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_logo_url?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          position: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          position?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_recommendations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          recommender_company: string | null
          recommender_id: string | null
          recommender_name: string
          recommender_title: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          recommender_company?: string | null
          recommender_id?: string | null
          recommender_name: string
          recommender_title?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          recommender_company?: string | null
          recommender_id?: string | null
          recommender_name?: string
          recommender_title?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          created_at: string | null
          endorsements_count: number | null
          id: string
          proficiency_level: string | null
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endorsements_count?: number | null
          id?: string
          proficiency_level?: string | null
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          endorsements_count?: number | null
          id?: string
          proficiency_level?: string | null
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          default_storage: string | null
          drive_connected: boolean | null
          email: string
          followers_count: number | null
          following_count: number | null
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
          twitter_url: string | null
          two_factor_backup_codes: string[] | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_storage?: string | null
          drive_connected?: boolean | null
          email: string
          followers_count?: number | null
          following_count?: number | null
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
          twitter_url?: string | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_storage?: string | null
          drive_connected?: boolean | null
          email?: string
          followers_count?: number | null
          following_count?: number | null
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
          twitter_url?: string | null
          two_factor_backup_codes?: string[] | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      question_banks: {
        Row: {
          certification: Database["public"]["Enums"]["financial_certification"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          total_questions: number | null
          updated_at: string | null
        }
        Insert: {
          certification: Database["public"]["Enums"]["financial_certification"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Update: {
          certification?: Database["public"]["Enums"]["financial_certification"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          payout_details: Json | null
          payout_method: string | null
          pix_transaction_id: string | null
          points_spent: number
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          payout_details?: Json | null
          payout_method?: string | null
          pix_transaction_id?: string | null
          points_spent: number
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          payout_details?: Json | null
          payout_method?: string | null
          pix_transaction_id?: string | null
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
          product_id: string | null
          stock: number | null
          tier_required: string | null
          type: string
          updated_at: string | null
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
          product_id?: string | null
          stock?: number | null
          tier_required?: string | null
          type: string
          updated_at?: string | null
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
          product_id?: string | null
          stock?: number | null
          tier_required?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number | null
          slug: string
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
      }
      sales_page_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          template_config: Json | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          template_config?: Json | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          template_config?: Json | null
          thumbnail_url?: string | null
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      simulator_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          earned_points: number | null
          id: string
          passed: boolean | null
          score: number | null
          simulator_id: string | null
          started_at: string | null
          time_spent_seconds: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          earned_points?: number | null
          id?: string
          passed?: boolean | null
          score?: number | null
          simulator_id?: string | null
          started_at?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          earned_points?: number | null
          id?: string
          passed?: boolean | null
          score?: number | null
          simulator_id?: string | null
          started_at?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
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
          correct_answer: string | null
          created_at: string | null
          explanation: string | null
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string | null
          simulator_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type?: string | null
          simulator_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string | null
          simulator_id?: string | null
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
      social_connections: {
        Row: {
          access_token: string
          connected_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          page_id: string | null
          page_name: string | null
          permissions: string[] | null
          platform: string
          platform_name: string | null
          platform_user_id: string | null
          platform_username: string | null
          profile_picture_url: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          page_id?: string | null
          page_name?: string | null
          permissions?: string[] | null
          platform: string
          platform_name?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          profile_picture_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          page_id?: string | null
          page_name?: string | null
          permissions?: string[] | null
          platform?: string
          platform_name?: string | null
          platform_user_id?: string | null
          platform_username?: string | null
          profile_picture_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
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
          created_at: string
          current_period_end: string
          current_period_start: string
          gateway_subscription_id: string | null
          id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          gateway_subscription_id?: string | null
          id?: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          gateway_subscription_id?: string | null
          id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          max_affiliates: number | null
          max_users: number | null
          name: string
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          max_affiliates?: number | null
          max_users?: number | null
          name: string
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          max_affiliates?: number | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tier_requirements: {
        Row: {
          benefits: Json | null
          color: string | null
          commission_rate: number
          created_at: string | null
          icon: string | null
          id: string
          min_points: number
          min_referrals: number
          min_sales_total: number
          sort_order: number | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          commission_rate?: number
          created_at?: string | null
          icon?: string | null
          id?: string
          min_points?: number
          min_referrals?: number
          min_sales_total?: number
          sort_order?: number | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          commission_rate?: number
          created_at?: string | null
          icon?: string | null
          id?: string
          min_points?: number
          min_referrals?: number
          min_sales_total?: number
          sort_order?: number | null
          tier?: string
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
          layout: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_icon: string | null
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_drive_tokens: {
        Row: {
          access_token: string | null
          created_at: string | null
          expiry_date: string | null
          folder_id: string | null
          id: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expiry_date?: string | null
          folder_id?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expiry_date?: string | null
          folder_id?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_files: {
        Row: {
          created_at: string | null
          drive_file_id: string | null
          drive_web_link: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          storage_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drive_file_id?: string | null
          drive_web_link?: string | null
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          storage_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          drive_file_id?: string | null
          drive_web_link?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          storage_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          current_balance: number | null
          id: string
          last_activity: string | null
          tier: string | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_activity?: string | null
          tier?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_activity?: string | null
          tier?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
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
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
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
          created_at: string
          id: string
          user_id: string | null
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
          video_id?: string
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
          comments_count: number
          created_at: string
          description: string | null
          duration: number | null
          file_size: number | null
          height: number | null
          hls_playlist_url: string | null
          id: string
          is_recording: boolean | null
          likes_count: number
          live_ended_at: string | null
          live_started_at: string | null
          mime_type: string | null
          privacy: Database["public"]["Enums"]["video_privacy"]
          recording_url: string | null
          status: Database["public"]["Enums"]["video_status"]
          storage_type: string
          storage_url: string | null
          thumbnail_url: string | null
          title: string
          type: Database["public"]["Enums"]["video_type"]
          updated_at: string
          user_id: string
          views_count: number
          width: number | null
        }
        Insert: {
          comments_count?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          hls_playlist_url?: string | null
          id?: string
          is_recording?: boolean | null
          likes_count?: number
          live_ended_at?: string | null
          live_started_at?: string | null
          mime_type?: string | null
          privacy?: Database["public"]["Enums"]["video_privacy"]
          recording_url?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          storage_type?: string
          storage_url?: string | null
          thumbnail_url?: string | null
          title: string
          type?: Database["public"]["Enums"]["video_type"]
          updated_at?: string
          user_id: string
          views_count?: number
          width?: number | null
        }
        Update: {
          comments_count?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          hls_playlist_url?: string | null
          id?: string
          is_recording?: boolean | null
          likes_count?: number
          live_ended_at?: string | null
          live_started_at?: string | null
          mime_type?: string | null
          privacy?: Database["public"]["Enums"]["video_privacy"]
          recording_url?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          storage_type?: string
          storage_url?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["video_type"]
          updated_at?: string
          user_id?: string
          views_count?: number
          width?: number | null
        }
        Relationships: []
      }
      vip_affiliate_actions: {
        Row: {
          action_type: string
          affiliate_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string
        }
        Insert: {
          action_type: string
          affiliate_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id: string
        }
        Update: {
          action_type?: string
          affiliate_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_affiliate_actions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_affiliates: {
        Row: {
          affiliate_commission_rate: number | null
          approved_at: string | null
          approved_by: string | null
          available_balance: number | null
          bank_info: Json | null
          commission_rate: number | null
          created_at: string | null
          creator_commission_rate: number | null
          creator_enabled_at: string | null
          creator_subscription_id: string | null
          direct_referrals_count: number | null
          id: string
          invite_id: string | null
          invited_by: string | null
          is_creator: boolean | null
          parent_affiliate_id: string | null
          pix_key: string | null
          platform_commission_rate: number | null
          program_id: string | null
          referral_code: string
          referral_count: number | null
          status: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          team_earnings: number | null
          tier: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: string
          withdrawn_balance: number | null
        }
        Insert: {
          affiliate_commission_rate?: number | null
          approved_at?: string | null
          approved_by?: string | null
          available_balance?: number | null
          bank_info?: Json | null
          commission_rate?: number | null
          created_at?: string | null
          creator_commission_rate?: number | null
          creator_enabled_at?: string | null
          creator_subscription_id?: string | null
          direct_referrals_count?: number | null
          id?: string
          invite_id?: string | null
          invited_by?: string | null
          is_creator?: boolean | null
          parent_affiliate_id?: string | null
          pix_key?: string | null
          platform_commission_rate?: number | null
          program_id?: string | null
          referral_code: string
          referral_count?: number | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          team_earnings?: number | null
          tier?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id: string
          withdrawn_balance?: number | null
        }
        Update: {
          affiliate_commission_rate?: number | null
          approved_at?: string | null
          approved_by?: string | null
          available_balance?: number | null
          bank_info?: Json | null
          commission_rate?: number | null
          created_at?: string | null
          creator_commission_rate?: number | null
          creator_enabled_at?: string | null
          creator_subscription_id?: string | null
          direct_referrals_count?: number | null
          id?: string
          invite_id?: string | null
          invited_by?: string | null
          is_creator?: boolean | null
          parent_affiliate_id?: string | null
          pix_key?: string | null
          platform_commission_rate?: number | null
          program_id?: string | null
          referral_code?: string
          referral_count?: number | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          team_earnings?: number | null
          tier?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string
          withdrawn_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_affiliates_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "affiliate_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "vip_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_affiliates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
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
          author_id: string
          content: string
          created_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          is_highlighted: boolean | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_highlighted?: boolean | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_highlighted?: boolean | null
          post_id?: string
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
      vip_monthly_goals: {
        Row: {
          bonus_points: number | null
          completed_at: string | null
          created_at: string | null
          current_referrals: number | null
          current_sales: number | null
          id: string
          is_completed: boolean | null
          month: number
          target_referrals: number | null
          target_sales: number | null
          user_id: string
          year: number
        }
        Insert: {
          bonus_points?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_referrals?: number | null
          current_sales?: number | null
          id?: string
          is_completed?: boolean | null
          month: number
          target_referrals?: number | null
          target_sales?: number | null
          user_id: string
          year: number
        }
        Update: {
          bonus_points?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_referrals?: number | null
          current_sales?: number | null
          id?: string
          is_completed?: boolean | null
          month?: number
          target_referrals?: number | null
          target_sales?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      vip_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_playlist_items: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string
          position: number | null
          post_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id: string
          position?: number | null
          post_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string
          position?: number | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "vip_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_playlist_items_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vip_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          owner_id: string
          posts_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          owner_id: string
          posts_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          owner_id?: string
          posts_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vip_posts: {
        Row: {
          author_id: string
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
          shares_count: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          views_count: number | null
          youtube_video_id: string | null
        }
        Insert: {
          author_id: string
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
          shares_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
          youtube_video_id?: string | null
        }
        Update: {
          author_id?: string
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
          shares_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          views_count?: number | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      vip_presentations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          settings: Json | null
          share_token: string | null
          slides: Json | null
          status: string | null
          theme: Json | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          settings?: Json | null
          share_token?: string | null
          slides?: Json | null
          status?: string | null
          theme?: Json | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          settings?: Json | null
          share_token?: string | null
          slides?: Json | null
          status?: string | null
          theme?: Json | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      vip_reactions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
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
      vip_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          share_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          share_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          share_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vip_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          affiliate_email: string | null
          affiliate_id: string | null
          affiliate_name: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_info: Json | null
          created_at: string
          fee: number | null
          id: string
          net_amount: number
          payment_method: string
          processed_at: string | null
          rejected_reason: string | null
          requested_by: string | null
          status: string
          stripe_payout_id: string | null
        }
        Insert: {
          affiliate_email?: string | null
          affiliate_id?: string | null
          affiliate_name?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_info?: Json | null
          created_at?: string
          fee?: number | null
          id?: string
          net_amount: number
          payment_method: string
          processed_at?: string | null
          rejected_reason?: string | null
          requested_by?: string | null
          status?: string
          stripe_payout_id?: string | null
        }
        Update: {
          affiliate_email?: string | null
          affiliate_id?: string | null
          affiliate_name?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_info?: Json | null
          created_at?: string
          fee?: number | null
          id?: string
          net_amount?: number
          payment_method?: string
          processed_at?: string | null
          rejected_reason?: string | null
          requested_by?: string | null
          status?: string
          stripe_payout_id?: string | null
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
      calcular_media_modulo: {
        Args: { p_modulo_id: string; p_user_id: string }
        Returns: number
      }
      calculate_affiliate_tier:
        | {
            Args: {
              p_direct_referrals: number
              p_team_earnings: number
              p_total_earnings: number
            }
            Returns: string
          }
        | {
            Args: {
              p_points: number
              p_referrals: number
              p_sales_total: number
            }
            Returns: string
          }
      calculate_user_tier: { Args: { total_points: number }; Returns: string }
      can_be_creator: { Args: { user_uuid: string }; Returns: boolean }
      create_vip_notification: {
        Args: {
          p_action_url?: string
          p_icon?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      enable_creator_access: {
        Args: { affiliate_uuid: string }
        Returns: boolean
      }
      fix_mlm_parent_links: {
        Args: never
        Returns: {
          details: Json
          updated_count: number
        }[]
      }
      generate_certificate_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_avaliacoes_pendentes: {
        Args: never
        Returns: {
          avaliacao_id: string
          modulo_nome: string
          notas_lancadas: number
          titulo: string
          total_alunos: number
        }[]
      }
      get_tier_commission_rate: { Args: { p_tier: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_direct_referrals: {
        Args: { affiliate_id: string }
        Returns: undefined
      }
      is_admin_email: { Args: { _email: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin_or_owner: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: boolean
      }
      link_referrals_to_affiliates: {
        Args: never
        Returns: {
          details: Json
          linked_count: number
        }[]
      }
      mask_bank_info: {
        Args: { bank_info: Json; is_admin: boolean }
        Returns: Json
      }
      nota_para_conceito: { Args: { nota: number }; Returns: string }
      process_full_mlm_commissions: {
        Args: {
          p_affiliate_id: string
          p_creator_id?: string
          p_is_certification?: boolean
          p_is_creator_product?: boolean
          p_order_id: string
          p_order_total: number
        }
        Returns: Json
      }
      recalculate_affiliate_referral_counts: { Args: never; Returns: undefined }
      recalculate_affiliate_tier: {
        Args: { p_affiliate_id: string }
        Returns: string
      }
      record_vip_action: {
        Args: {
          p_action_type: string
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: number
      }
      update_study_streak: { Args: { p_user_id: string }; Returns: undefined }
      user_has_tier_access: {
        Args: { allowed_tiers: string[]; user_tier: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "owner"
      attempt_status: "in_progress" | "completed" | "abandoned" | "expired"
      enrollment_status: "active" | "expired" | "cancelled" | "pending"
      exam_status: "draft" | "published" | "archived"
      financial_certification:
        | "ancord"
        | "cea"
        | "cfp"
        | "cpa_10"
        | "cpa_20"
        | "cnpi"
        | "other"
      lesson_content_type:
        | "video"
        | "pdf"
        | "text"
        | "audio"
        | "quiz"
        | "download"
      order_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      pricing_type: "one_time" | "subscription" | "free"
      product_status: "draft" | "published" | "archived"
      product_type:
        | "course"
        | "ebook"
        | "mentoring"
        | "live_event"
        | "files"
        | "combo"
      question_difficulty: "easy" | "medium" | "hard" | "expert"
      video_privacy: "public" | "students" | "vip" | "private"
      video_status: "processing" | "ready" | "live" | "ended" | "failed"
      video_type: "video" | "short" | "live"
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
      app_role: ["admin", "user", "editor", "owner"],
      attempt_status: ["in_progress", "completed", "abandoned", "expired"],
      enrollment_status: ["active", "expired", "cancelled", "pending"],
      exam_status: ["draft", "published", "archived"],
      financial_certification: [
        "ancord",
        "cea",
        "cfp",
        "cpa_10",
        "cpa_20",
        "cnpi",
        "other",
      ],
      lesson_content_type: [
        "video",
        "pdf",
        "text",
        "audio",
        "quiz",
        "download",
      ],
      order_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      pricing_type: ["one_time", "subscription", "free"],
      product_status: ["draft", "published", "archived"],
      product_type: [
        "course",
        "ebook",
        "mentoring",
        "live_event",
        "files",
        "combo",
      ],
      question_difficulty: ["easy", "medium", "hard", "expert"],
      video_privacy: ["public", "students", "vip", "private"],
      video_status: ["processing", "ready", "live", "ended", "failed"],
      video_type: ["video", "short", "live"],
    },
  },
} as const
