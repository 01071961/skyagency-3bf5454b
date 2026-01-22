import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIAssistantRequest {
  message: string;
  context: "email_campaign" | "chat_support" | "general";
  conversationHistory?: Array<{ role: string; content: string }>;
  confirmAction?: {
    actionId: string;
    confirmed: boolean;
  };
}

// Define todas as ferramentas disponíveis para a IA
const availableTools = [
  // ========== CHAT & CONVERSAS ==========
  {
    type: "function",
    function: {
      name: "delete_chat_messages",
      description: "Deleta mensagens específicas de uma conversa de chat ou todas as mensagens de uma conversa. AÇÃO DESTRUTIVA - requer confirmação.",
      parameters: {
        type: "object",
        properties: {
          conversation_id: { type: "string", description: "ID da conversa" },
          message_ids: { type: "array", items: { type: "string" }, description: "IDs das mensagens (opcional)" },
          delete_all: { type: "boolean", description: "Deletar todas" }
        },
        required: ["conversation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_conversation",
      description: "Deleta uma conversa de chat inteira incluindo mensagens. AÇÃO DESTRUTIVA - requer confirmação.",
      parameters: {
        type: "object",
        properties: {
          conversation_id: { type: "string", description: "ID da conversa" }
        },
        required: ["conversation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_conversations",
      description: "Lista conversas de chat com filtros",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status (active, closed)" },
          limit: { type: "number", description: "Quantidade máxima" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_conversation_messages",
      description: "Obtém mensagens de uma conversa",
      parameters: {
        type: "object",
        properties: {
          conversation_id: { type: "string", description: "ID da conversa" }
        },
        required: ["conversation_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "close_conversation",
      description: "Encerra uma conversa de chat",
      parameters: {
        type: "object",
        properties: {
          conversation_id: { type: "string", description: "ID da conversa" }
        },
        required: ["conversation_id"]
      }
    }
  },

  // ========== CONTATOS ==========
  {
    type: "function",
    function: {
      name: "delete_contact",
      description: "Deleta um contato. AÇÃO DESTRUTIVA - requer confirmação.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "ID do contato" }
        },
        required: ["contact_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_contact_status",
      description: "Atualiza status de contato (lido, respondido)",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "ID do contato" },
          read_at: { type: "string", description: "'now' ou ISO date" },
          replied_at: { type: "string", description: "'now' ou ISO date" }
        },
        required: ["contact_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_contacts",
      description: "Lista contatos com filtros",
      parameters: {
        type: "object",
        properties: {
          user_type: { type: "string", description: "Tipo de usuário (vip, streamer, marca, etc)" },
          source: { type: "string", description: "Fonte (contact, vip, etc)" },
          unread_only: { type: "boolean", description: "Apenas não lidos" },
          limit: { type: "number", description: "Quantidade máxima" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "Cria um novo contato manualmente",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do contato" },
          email: { type: "string", description: "Email do contato" },
          message: { type: "string", description: "Mensagem/notas" },
          user_type: { type: "string", description: "Tipo (vip, streamer, marca)" },
          source: { type: "string", description: "Fonte (manual, contact, vip)" }
        },
        required: ["name", "email", "message"]
      }
    }
  },

  // ========== E-MAILS & CAMPANHAS ==========
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Envia um email para um ou mais destinatários",
      parameters: {
        type: "object",
        properties: {
          to: { type: "array", items: { type: "string" }, description: "Lista de emails destinatários" },
          subject: { type: "string", description: "Assunto do email" },
          html_content: { type: "string", description: "Conteúdo HTML do email" },
          from_name: { type: "string", description: "Nome do remetente (padrão: SKY BRASIL)" }
        },
        required: ["to", "subject", "html_content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_email_templates",
      description: "Lista templates de email disponíveis",
      parameters: {
        type: "object",
        properties: {
          active_only: { type: "boolean", description: "Apenas templates ativos" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_email_template",
      description: "Cria um novo template de email",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do template" },
          subject: { type: "string", description: "Assunto padrão" },
          html_content: { type: "string", description: "Conteúdo HTML" },
          text_content: { type: "string", description: "Conteúdo texto (opcional)" }
        },
        required: ["name", "subject", "html_content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_email_template",
      description: "Atualiza um template existente",
      parameters: {
        type: "object",
        properties: {
          template_id: { type: "string", description: "ID do template" },
          name: { type: "string", description: "Novo nome" },
          subject: { type: "string", description: "Novo assunto" },
          html_content: { type: "string", description: "Novo conteúdo HTML" },
          is_active: { type: "boolean", description: "Ativar/desativar" }
        },
        required: ["template_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_email_template",
      description: "Deleta um template. AÇÃO DESTRUTIVA.",
      parameters: {
        type: "object",
        properties: {
          template_id: { type: "string", description: "ID do template" }
        },
        required: ["template_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_campaigns",
      description: "Lista campanhas de email",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status (draft, sent, scheduled)" },
          limit: { type: "number", description: "Quantidade máxima" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_campaign",
      description: "Cria uma nova campanha de email",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da campanha" },
          subject: { type: "string", description: "Assunto do email" },
          html_content: { type: "string", description: "Conteúdo HTML" },
          text_content: { type: "string", description: "Conteúdo texto" }
        },
        required: ["name", "subject", "html_content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_campaign",
      description: "Envia uma campanha para lista de emails",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string", description: "ID da campanha" },
          recipient_emails: { type: "array", items: { type: "string" }, description: "Lista de emails" }
        },
        required: ["campaign_id", "recipient_emails"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_campaign",
      description: "Deleta uma campanha. AÇÃO DESTRUTIVA.",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string", description: "ID da campanha" }
        },
        required: ["campaign_id"]
      }
    }
  },

  // ========== IA EVOLUTIVA ==========
  {
    type: "function",
    function: {
      name: "create_ai_learning",
      description: "Cria um novo padrão de aprendizado",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Nome do padrão" },
          category: { type: "string", description: "Categoria (support, sales, marketing, general)" },
          keywords: { type: "array", items: { type: "string" }, description: "Palavras-chave" },
          response_template: { type: "string", description: "Template de resposta" }
        },
        required: ["pattern", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_ai_mode",
      description: "Atualiza configuração de modo da IA",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", description: "Nome do modo (support, sales, marketing, handoff_human)" },
          is_enabled: { type: "boolean", description: "Ativar/desativar" },
          confidence_threshold: { type: "number", description: "Threshold (0-1)" }
        },
        required: ["mode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_ai_learnings",
      description: "Lista padrões de aprendizado",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filtrar por categoria" },
          active_only: { type: "boolean", description: "Apenas ativos" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_ai_learning",
      description: "Deleta um padrão de aprendizado. AÇÃO DESTRUTIVA.",
      parameters: {
        type: "object",
        properties: {
          learning_id: { type: "string", description: "ID do padrão" }
        },
        required: ["learning_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_ai_feedback_summary",
      description: "Obtém resumo dos feedbacks da IA",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Últimos X dias (padrão: 30)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resolve_ai_feedback",
      description: "Marca um feedback como resolvido",
      parameters: {
        type: "object",
        properties: {
          feedback_id: { type: "string", description: "ID do feedback" }
        },
        required: ["feedback_id"]
      }
    }
  },

  // ========== SISTEMA & AUDITORIA ==========
  {
    type: "function",
    function: {
      name: "get_audit_logs",
      description: "Obtém logs de auditoria",
      parameters: {
        type: "object",
        properties: {
          action_type: { type: "string", description: "Filtrar por tipo de ação" },
          admin_id: { type: "string", description: "Filtrar por admin" },
          limit: { type: "number", description: "Quantidade máxima" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_system_stats",
      description: "Obtém estatísticas gerais do sistema",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_esp_configurations",
      description: "Lista configurações de provedores de email (ESP)",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_esp_configuration",
      description: "Atualiza configuração de ESP",
      parameters: {
        type: "object",
        properties: {
          esp_id: { type: "string", description: "ID da configuração" },
          is_active: { type: "boolean", description: "Ativar/desativar" },
          is_default: { type: "boolean", description: "Definir como padrão" }
        },
        required: ["esp_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_admin_users",
      description: "Lista usuários administrativos",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },

  // ========== BANCO DE DADOS ==========
  {
    type: "function",
    function: {
      name: "bulk_delete_conversations",
      description: "Deleta múltiplas conversas de uma vez. AÇÃO DESTRUTIVA MASSIVA - requer confirmação.",
      parameters: {
        type: "object",
        properties: {
          conversation_ids: { type: "array", items: { type: "string" }, description: "IDs das conversas" },
          older_than_days: { type: "number", description: "Ou deletar conversas mais antigas que X dias" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bulk_delete_contacts",
      description: "Deleta múltiplos contatos de uma vez. AÇÃO DESTRUTIVA MASSIVA - requer confirmação.",
      parameters: {
        type: "object",
        properties: {
          contact_ids: { type: "array", items: { type: "string" }, description: "IDs dos contatos" }
        },
        required: ["contact_ids"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "export_data",
      description: "Exporta dados em formato JSON",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Tabela (contacts, conversations, campaigns, templates)" },
          format: { type: "string", description: "Formato (json, csv)" }
        },
        required: ["table"]
      }
    }
  },

  // ========== AUTOMAÇÕES ==========
  {
    type: "function",
    function: {
      name: "create_automation_rule",
      description: "Cria uma nova regra de automação (ex: quando chegar lead VIP, enviar email automaticamente ou webhook para Slack/Discord)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da regra" },
          description: { type: "string", description: "Descrição" },
          trigger_type: { type: "string", description: "Tipo de gatilho: vip_lead, new_conversation, abandoned_form, low_rating, inactivity, keyword" },
          trigger_config: { type: "object", description: "Configuração do gatilho (ex: { keyword: 'urgente', threshold: 2 })" },
          action_type: { type: "string", description: "Tipo de ação: send_email, assign_admin, notify_admin, create_task, webhook" },
          action_config: { type: "object", description: "Configuração da ação (ex: { template_id: 'xxx', webhook_url: 'https://hooks.slack.com/...', webhook_type: 'slack', webhook_message: 'Novo lead: {{name}}' })" },
          priority: { type: "number", description: "Prioridade (1-10, maior = mais prioritário)" }
        },
        required: ["name", "trigger_type", "action_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_automation_rules",
      description: "Lista todas as regras de automação configuradas",
      parameters: {
        type: "object",
        properties: {
          active_only: { type: "boolean", description: "Apenas regras ativas" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_automation_rule",
      description: "Atualiza uma regra de automação existente",
      parameters: {
        type: "object",
        properties: {
          rule_id: { type: "string", description: "ID da regra" },
          name: { type: "string", description: "Novo nome" },
          is_active: { type: "boolean", description: "Ativar/desativar" },
          trigger_config: { type: "object", description: "Nova configuração do gatilho" },
          action_config: { type: "object", description: "Nova configuração da ação" }
        },
        required: ["rule_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_automation_rule",
      description: "Deleta uma regra de automação. AÇÃO DESTRUTIVA.",
      parameters: {
        type: "object",
        properties: {
          rule_id: { type: "string", description: "ID da regra" }
        },
        required: ["rule_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_automation_logs",
      description: "Obtém logs de execução das automações",
      parameters: {
        type: "object",
        properties: {
          rule_id: { type: "string", description: "Filtrar por regra específica" },
          status: { type: "string", description: "Filtrar por status (success, failed, skipped)" },
          limit: { type: "number", description: "Quantidade máxima" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_automation_rule",
      description: "Executa manualmente uma regra de automação para teste",
      parameters: {
        type: "object",
        properties: {
          rule_id: { type: "string", description: "ID da regra" },
          test_data: { type: "object", description: "Dados de teste para simular o gatilho" }
        },
        required: ["rule_id"]
      }
    }
  },

  // ========== PUBLICAÇÕES SOCIAIS ==========
  {
    type: "function",
    function: {
      name: "create_social_post",
      description: "Cria e agenda uma publicação para redes sociais (Facebook, Instagram) ou WhatsApp. NOTA: Requer configuração de APIs externas.",
      parameters: {
        type: "object",
        properties: {
          platforms: { type: "array", items: { type: "string" }, description: "Plataformas: facebook, instagram, whatsapp" },
          content: { type: "string", description: "Texto da publicação" },
          media_type: { type: "string", description: "Tipo de mídia: text, image, video" },
          media_url: { type: "string", description: "URL da mídia (opcional)" },
          scheduled_at: { type: "string", description: "Data/hora de agendamento ISO (opcional, se vazio publica imediatamente)" }
        },
        required: ["platforms", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_social_posts",
      description: "Lista publicações agendadas ou publicadas nas redes sociais",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filtrar por status: scheduled, published, failed, draft" },
          platform: { type: "string", description: "Filtrar por plataforma" },
          limit: { type: "number", description: "Quantidade máxima" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp_message",
      description: "Envia mensagem pelo WhatsApp Business API. NOTA: Requer API configurada e templates aprovados pelo Meta.",
      parameters: {
        type: "object",
        properties: {
          phone_number: { type: "string", description: "Número de telefone com código do país (ex: +5548999999999)" },
          template_name: { type: "string", description: "Nome do template aprovado pelo Meta (obrigatório para iniciar conversas)" },
          template_params: { type: "array", items: { type: "string" }, description: "Parâmetros do template" },
          message: { type: "string", description: "Mensagem de texto livre (apenas para conversas já iniciadas)" }
        },
        required: ["phone_number"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_social_accounts",
      description: "Lista contas de redes sociais conectadas e seus status",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_social_integration_status",
      description: "Verifica o status das integrações de redes sociais (Facebook, Instagram, WhatsApp) e retorna quais estão configuradas",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },

  // ========== GERENCIAMENTO DE INTEGRAÇÕES ==========
  {
    type: "function",
    function: {
      name: "list_integration_requirements",
      description: "Lista todos os secrets/configurações necessários para cada integração (Meta APIs, WhatsApp, etc.) e seu status atual",
      parameters: {
        type: "object",
        properties: {
          integration: { type: "string", description: "Filtrar por integração específica: facebook, instagram, whatsapp, all" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_integration_config",
      description: "Salva configurações não-sensíveis de integração (IDs, nomes, URLs públicas). Para secrets sensíveis (tokens, senhas), instrui o admin a usar o gerenciador de secrets.",
      parameters: {
        type: "object",
        properties: {
          integration_type: { type: "string", description: "Tipo: facebook, instagram, whatsapp" },
          config: { 
            type: "object", 
            description: "Configurações não-sensíveis (ex: page_id, business_account_id, phone_display)" 
          }
        },
        required: ["integration_type", "config"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_meta_setup_guide",
      description: "Retorna guia passo-a-passo para configurar APIs do Meta (Facebook/Instagram) com links diretos",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_whatsapp_setup_guide",
      description: "Retorna guia passo-a-passo para configurar WhatsApp Business API com links diretos",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "test_social_connection",
      description: "Testa conexão com APIs de redes sociais configuradas e retorna status detalhado",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Plataforma: facebook, instagram, whatsapp" }
        },
        required: ["platform"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_secret_configuration",
      description: "Gera instruções detalhadas para o admin configurar secrets específicos no Lovable Cloud. Use quando precisar que o admin adicione credenciais sensíveis.",
      parameters: {
        type: "object",
        properties: {
          secrets_needed: { 
            type: "array", 
            items: { type: "string" }, 
            description: "Lista de secrets necessários (ex: FACEBOOK_APP_ID, WHATSAPP_ACCESS_TOKEN)" 
          },
          purpose: { type: "string", description: "Para que serão usados" }
        },
        required: ["secrets_needed", "purpose"]
      }
    }
  }
];

// Ações que requerem confirmação
const DESTRUCTIVE_ACTIONS = [
  'delete_chat_messages',
  'delete_conversation',
  'delete_contact',
  'delete_email_template',
  'delete_campaign',
  'delete_ai_learning',
  'bulk_delete_conversations',
  'bulk_delete_contacts',
  'delete_automation_rule'
];

// Executa ferramentas
async function executeTool(
  supabase: any,
  toolName: string,
  args: any,
  adminId: string
): Promise<{ success: boolean; result: any; error?: string; requires_confirmation?: boolean; action_details?: any }> {
  console.log(`[admin-ai-assistant] Executing tool: ${toolName}`, args);

  try {
    switch (toolName) {
      // ========== CHAT & CONVERSAS ==========
      case "delete_chat_messages": {
        const { conversation_id, message_ids, delete_all } = args;
        
        let query = supabase.from("chat_messages").delete();
        if (delete_all || !message_ids?.length) {
          query = query.eq("conversation_id", conversation_id);
        } else {
          query = query.in("id", message_ids);
        }
        
        const { error, count } = await query;
        if (error) throw error;
        
        await logAction(supabase, adminId, "ai_delete_messages", "chat_messages", conversation_id, { message_ids, delete_all, deleted_count: count });
        return { success: true, result: { deleted: count || "todas as mensagens" } };
      }

      case "delete_conversation": {
        const { conversation_id } = args;
        
        await supabase.from("chat_messages").delete().eq("conversation_id", conversation_id);
        const { error } = await supabase.from("chat_conversations").delete().eq("id", conversation_id);
        if (error) throw error;
        
        await logAction(supabase, adminId, "ai_delete_conversation", "chat_conversations", conversation_id, { conversation_id });
        return { success: true, result: { deleted_conversation: conversation_id } };
      }

      case "list_conversations": {
        const { status, limit } = args;
        let query = supabase.from("chat_conversations")
          .select("id, visitor_name, visitor_email, visitor_phone, status, created_at, current_mode, subject")
          .order("created_at", { ascending: false })
          .limit(limit || 20);
        if (status) query = query.eq("status", status);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { conversations: data, count: data?.length } };
      }

      case "get_conversation_messages": {
        const { conversation_id } = args;
        const { data, error } = await supabase.from("chat_messages")
          .select("id, role, content, created_at, is_ai_response, file_url, file_name")
          .eq("conversation_id", conversation_id)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return { success: true, result: { messages: data, count: data?.length } };
      }

      case "close_conversation": {
        const { conversation_id } = args;
        const { error } = await supabase.from("chat_conversations")
          .update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("id", conversation_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_close_conversation", "chat_conversations", conversation_id, {});
        return { success: true, result: { closed: conversation_id } };
      }

      // ========== CONTATOS ==========
      case "delete_contact": {
        const { contact_id } = args;
        const { error } = await supabase.from("contact_submissions").delete().eq("id", contact_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_delete_contact", "contact_submissions", contact_id, {});
        return { success: true, result: { deleted_contact: contact_id } };
      }

      case "update_contact_status": {
        const { contact_id, read_at, replied_at } = args;
        const updates: any = {};
        if (read_at) updates.read_at = read_at === 'now' ? new Date().toISOString() : read_at;
        if (replied_at) updates.replied_at = replied_at === 'now' ? new Date().toISOString() : replied_at;
        const { error } = await supabase.from("contact_submissions").update(updates).eq("id", contact_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_update_contact", "contact_submissions", contact_id, updates);
        return { success: true, result: { updated: contact_id, changes: updates } };
      }

      case "list_contacts": {
        const { user_type, source, unread_only, limit } = args;
        let query = supabase.from("contact_submissions")
          .select("id, name, email, user_type, source, message, created_at, read_at, replied_at")
          .order("created_at", { ascending: false })
          .limit(limit || 50);
        if (user_type) query = query.eq("user_type", user_type);
        if (source) query = query.eq("source", source);
        if (unread_only) query = query.is("read_at", null);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { contacts: data, count: data?.length } };
      }

      case "create_contact": {
        const { name, email, message, user_type, source } = args;
        const { data, error } = await supabase.from("contact_submissions")
          .insert({ name, email, message, user_type: user_type || null, source: source || 'manual' })
          .select().single();
        if (error) throw error;
        await logAction(supabase, adminId, "ai_create_contact", "contact_submissions", data.id, { name, email });
        return { success: true, result: { created_contact: data } };
      }

      // ========== E-MAILS & CAMPANHAS ==========
      case "send_email": {
        const { to, subject, html_content, from_name } = args;
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada");
        
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `${from_name || 'SKY BRASIL'} <noreply@skystreamer.online>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html: html_content
          })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Erro ao enviar email");
        
        await logAction(supabase, adminId, "ai_send_email", "email_logs", result.id, { to, subject });
        return { success: true, result: { email_sent: result.id, recipients: to } };
      }

      case "list_email_templates": {
        const { active_only } = args;
        let query = supabase.from("email_templates")
          .select("id, name, subject, is_active, created_at, updated_at")
          .order("updated_at", { ascending: false });
        if (active_only) query = query.eq("is_active", true);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { templates: data } };
      }

      case "create_email_template": {
        const { name, subject, html_content, text_content } = args;
        const { data, error } = await supabase.from("email_templates")
          .insert({ name, subject, html_content, text_content, is_active: true })
          .select().single();
        if (error) throw error;
        await logAction(supabase, adminId, "ai_create_template", "email_templates", data.id, { name });
        return { success: true, result: { created_template: data } };
      }

      case "update_email_template": {
        const { template_id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
        filteredUpdates.updated_at = new Date().toISOString();
        const { error } = await supabase.from("email_templates").update(filteredUpdates).eq("id", template_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_update_template", "email_templates", template_id, filteredUpdates);
        return { success: true, result: { updated_template: template_id } };
      }

      case "delete_email_template": {
        const { template_id } = args;
        const { error } = await supabase.from("email_templates").delete().eq("id", template_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_delete_template", "email_templates", template_id, {});
        return { success: true, result: { deleted_template: template_id } };
      }

      case "list_campaigns": {
        const { status, limit } = args;
        let query = supabase.from("email_campaigns")
          .select("id, name, subject, status, sent_count, opened_count, clicked_count, created_at")
          .order("created_at", { ascending: false })
          .limit(limit || 20);
        if (status) query = query.eq("status", status);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { campaigns: data } };
      }

      case "create_campaign": {
        const { name, subject, html_content, text_content } = args;
        const { data, error } = await supabase.from("email_campaigns")
          .insert({ name, subject, html_content, text_content, status: 'draft' })
          .select().single();
        if (error) throw error;
        await logAction(supabase, adminId, "ai_create_campaign", "email_campaigns", data.id, { name });
        return { success: true, result: { created_campaign: data } };
      }

      case "send_campaign": {
        const { campaign_id, recipient_emails } = args;
        // Buscar campanha
        const { data: campaign, error: campError } = await supabase.from("email_campaigns")
          .select("*").eq("id", campaign_id).single();
        if (campError) throw campError;
        
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada");
        
        let sent = 0;
        for (const email of recipient_emails) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `SKY BRASIL <noreply@skystreamer.online>`,
                to: [email],
                subject: campaign.subject,
                html: campaign.html_content
              })
            });
            sent++;
          } catch (e) {
            console.error(`Erro enviando para ${email}:`, e);
          }
        }
        
        await supabase.from("email_campaigns")
          .update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: sent, total_recipients: recipient_emails.length })
          .eq("id", campaign_id);
        
        await logAction(supabase, adminId, "ai_send_campaign", "email_campaigns", campaign_id, { sent, total: recipient_emails.length });
        return { success: true, result: { campaign_sent: campaign_id, sent_count: sent, total: recipient_emails.length } };
      }

      case "delete_campaign": {
        const { campaign_id } = args;
        const { error } = await supabase.from("email_campaigns").delete().eq("id", campaign_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_delete_campaign", "email_campaigns", campaign_id, {});
        return { success: true, result: { deleted_campaign: campaign_id } };
      }

      // ========== IA EVOLUTIVA ==========
      case "create_ai_learning": {
        const { pattern, category, keywords, response_template } = args;
        const { data, error } = await supabase.from("ai_learnings")
          .insert({ pattern, category: category || 'general', keywords: keywords || [], response_template, is_active: true })
          .select().single();
        if (error) throw error;
        await logAction(supabase, adminId, "ai_create_learning", "ai_learnings", data.id, { pattern, category });
        return { success: true, result: { created_learning: data } };
      }

      case "update_ai_mode": {
        const { mode, is_enabled, confidence_threshold } = args;
        const updates: any = { updated_at: new Date().toISOString(), updated_by: adminId };
        if (is_enabled !== undefined) updates.is_enabled = is_enabled;
        if (confidence_threshold !== undefined) updates.confidence_threshold = confidence_threshold;
        const { error } = await supabase.from("ai_mode_config").update(updates).eq("mode", mode);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_update_mode", "ai_mode_config", mode, updates);
        return { success: true, result: { updated_mode: mode } };
      }

      case "list_ai_learnings": {
        const { category, active_only } = args;
        let query = supabase.from("ai_learnings")
          .select("id, pattern, category, keywords, response_template, is_active, success_score, fail_score")
          .order("success_score", { ascending: false });
        if (category) query = query.eq("category", category);
        if (active_only) query = query.eq("is_active", true);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { learnings: data } };
      }

      case "delete_ai_learning": {
        const { learning_id } = args;
        const { error } = await supabase.from("ai_learnings").delete().eq("id", learning_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_delete_learning", "ai_learnings", learning_id, {});
        return { success: true, result: { deleted_learning: learning_id } };
      }

      case "get_ai_feedback_summary": {
        const { days } = args;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - (days || 30));
        
        const { data, error } = await supabase.from("ai_feedback")
          .select("rating, resolved, comment, created_at")
          .gte("created_at", daysAgo.toISOString());
        if (error) throw error;
        
        const total = data?.length || 0;
        const withRating = data?.filter((f: any) => f.rating) || [];
        const avgRating = withRating.length > 0 ? withRating.reduce((sum: number, f: any) => sum + f.rating, 0) / withRating.length : 0;
        const unresolved = data?.filter((f: any) => !f.resolved).length || 0;
        
        return { success: true, result: { total, avgRating: avgRating.toFixed(1), unresolved, recent: data?.slice(0, 10) } };
      }

      case "resolve_ai_feedback": {
        const { feedback_id } = args;
        const { error } = await supabase.from("ai_feedback").update({ resolved: true }).eq("id", feedback_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_resolve_feedback", "ai_feedback", feedback_id, {});
        return { success: true, result: { resolved_feedback: feedback_id } };
      }

      // ========== SISTEMA & AUDITORIA ==========
      case "get_audit_logs": {
        const { action_type, admin_id, limit } = args;
        let query = supabase.from("admin_audit_log")
          .select("id, action, target_table, target_id, details, created_at, admin_id")
          .order("created_at", { ascending: false })
          .limit(limit || 50);
        if (action_type) query = query.ilike("action", `%${action_type}%`);
        if (admin_id) query = query.eq("admin_id", admin_id);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { logs: data } };
      }

      case "get_system_stats": {
        const [contacts, conversations, campaigns, templates, learnings] = await Promise.all([
          supabase.from("contact_submissions").select("id", { count: "exact" }),
          supabase.from("chat_conversations").select("id", { count: "exact" }),
          supabase.from("email_campaigns").select("id", { count: "exact" }),
          supabase.from("email_templates").select("id", { count: "exact" }),
          supabase.from("ai_learnings").select("id", { count: "exact" })
        ]);
        
        return { 
          success: true, 
          result: {
            total_contacts: contacts.count || 0,
            total_conversations: conversations.count || 0,
            total_campaigns: campaigns.count || 0,
            total_templates: templates.count || 0,
            total_learnings: learnings.count || 0
          }
        };
      }

      case "list_esp_configurations": {
        const { data, error } = await supabase.from("esp_configurations")
          .select("id, name, provider, is_active, is_default")
          .order("is_default", { ascending: false });
        if (error) throw error;
        return { success: true, result: { esp_configs: data } };
      }

      case "update_esp_configuration": {
        const { esp_id, is_active, is_default } = args;
        const updates: any = { updated_at: new Date().toISOString() };
        if (is_active !== undefined) updates.is_active = is_active;
        if (is_default !== undefined) updates.is_default = is_default;
        const { error } = await supabase.from("esp_configurations").update(updates).eq("id", esp_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_update_esp", "esp_configurations", esp_id, updates);
        return { success: true, result: { updated_esp: esp_id } };
      }

      case "get_admin_users": {
        const { data, error } = await supabase.from("admin_emails")
          .select("id, name, email, is_active, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return { success: true, result: { admin_users: data } };
      }

      // ========== BANCO DE DADOS (BULK) ==========
      case "bulk_delete_conversations": {
        const { conversation_ids, older_than_days } = args;
        
        if (older_than_days) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - older_than_days);
          
          await supabase.from("chat_messages").delete().lt("created_at", cutoff.toISOString());
          const { error, count } = await supabase.from("chat_conversations").delete().lt("created_at", cutoff.toISOString());
          if (error) throw error;
          
          await logAction(supabase, adminId, "ai_bulk_delete_old_conversations", "chat_conversations", null, { older_than_days, deleted: count });
          return { success: true, result: { deleted_count: count } };
        } else if (conversation_ids?.length) {
          for (const id of conversation_ids) {
            await supabase.from("chat_messages").delete().eq("conversation_id", id);
          }
          const { error, count } = await supabase.from("chat_conversations").delete().in("id", conversation_ids);
          if (error) throw error;
          
          await logAction(supabase, adminId, "ai_bulk_delete_conversations", "chat_conversations", null, { ids: conversation_ids, deleted: count });
          return { success: true, result: { deleted_count: count } };
        }
        
        return { success: false, result: null, error: "Forneça conversation_ids ou older_than_days" };
      }

      case "bulk_delete_contacts": {
        const { contact_ids } = args;
        const { error, count } = await supabase.from("contact_submissions").delete().in("id", contact_ids);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_bulk_delete_contacts", "contact_submissions", null, { ids: contact_ids, deleted: count });
        return { success: true, result: { deleted_count: count } };
      }

      case "export_data": {
        const { table, format } = args;
        const tableMap: Record<string, string> = {
          contacts: "contact_submissions",
          conversations: "chat_conversations",
          campaigns: "email_campaigns",
          templates: "email_templates"
        };
        
        const tableName = tableMap[table] || table;
        const { data, error } = await supabase.from(tableName).select("*");
        if (error) throw error;
        
        return { success: true, result: { data, format: format || 'json', count: data?.length } };
      }

      // ========== AUTOMAÇÕES ==========
      case "create_automation_rule": {
        const { name, description, trigger_type, trigger_config, action_type, action_config, priority } = args;
        const { data, error } = await supabase.from("automation_rules")
          .insert({ 
            name, 
            description, 
            trigger_type, 
            trigger_config: trigger_config || {},
            action_type, 
            action_config: action_config || {},
            priority: priority || 1,
            is_active: true,
            created_by: adminId
          })
          .select().single();
        if (error) throw error;
        await logAction(supabase, adminId, "ai_create_automation", "automation_rules", data.id, { name, trigger_type, action_type });
        return { success: true, result: { created_rule: data } };
      }

      case "list_automation_rules": {
        const { active_only } = args;
        let query = supabase.from("automation_rules")
          .select("id, name, description, trigger_type, trigger_config, action_type, action_config, is_active, priority, execution_count, last_executed_at, created_at")
          .order("priority", { ascending: false });
        if (active_only) query = query.eq("is_active", true);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { rules: data, count: data?.length } };
      }

      case "update_automation_rule": {
        const { rule_id, name, is_active, trigger_config, action_config } = args;
        const updates: any = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name;
        if (is_active !== undefined) updates.is_active = is_active;
        if (trigger_config !== undefined) updates.trigger_config = trigger_config;
        if (action_config !== undefined) updates.action_config = action_config;
        const { error } = await supabase.from("automation_rules").update(updates).eq("id", rule_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_update_automation", "automation_rules", rule_id, updates);
        return { success: true, result: { updated_rule: rule_id } };
      }

      case "delete_automation_rule": {
        const { rule_id } = args;
        const { error } = await supabase.from("automation_rules").delete().eq("id", rule_id);
        if (error) throw error;
        await logAction(supabase, adminId, "ai_delete_automation", "automation_rules", rule_id, {});
        return { success: true, result: { deleted_rule: rule_id } };
      }

      case "get_automation_logs": {
        const { rule_id, status, limit } = args;
        let query = supabase.from("automation_logs")
          .select("id, rule_id, trigger_data, action_result, status, error_message, executed_at")
          .order("executed_at", { ascending: false })
          .limit(limit || 50);
        if (rule_id) query = query.eq("rule_id", rule_id);
        if (status) query = query.eq("status", status);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, result: { logs: data } };
      }

      case "execute_automation_rule": {
        const { rule_id, test_data } = args;
        
        // Get the rule
        const { data: rule, error: ruleError } = await supabase.from("automation_rules")
          .select("*").eq("id", rule_id).single();
        if (ruleError) throw ruleError;
        
        let actionResult: any = { simulated: true };
        
        // Execute action based on type
        if (rule.action_type === 'send_email') {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY && rule.action_config?.template_id) {
            const { data: template } = await supabase.from("email_templates")
              .select("*").eq("id", rule.action_config.template_id).single();
            if (template && test_data?.email) {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: `SKY BRASIL <noreply@skystreamer.online>`,
                  to: [test_data.email],
                  subject: template.subject,
                  html: template.html_content
                })
              });
              actionResult = { email_sent: test_data.email, template: template.name };
            }
          }
        } else if (rule.action_type === 'notify_admin') {
          actionResult = { notification: 'Admin notificado (simulado)', data: test_data };
        } else if (rule.action_type === 'webhook') {
          // Execute webhook
          const webhookUrl = rule.action_config?.webhook_url;
          if (webhookUrl) {
            const webhookType = rule.action_config?.webhook_type || 'custom';
            let message = rule.action_config?.webhook_message || 'Nova automação executada';
            
            // Replace placeholders
            if (test_data) {
              message = message
                .replace(/\{\{name\}\}/g, test_data.name || '')
                .replace(/\{\{email\}\}/g, test_data.email || '')
                .replace(/\{\{phone\}\}/g, test_data.phone || '');
            }
            
            let payload;
            if (webhookType === 'slack') {
              payload = { text: message };
            } else if (webhookType === 'discord') {
              payload = { content: message };
            } else {
              payload = { message, data: test_data };
            }
            
            try {
              const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              actionResult = { webhook_sent: true, url: webhookUrl, status: webhookResponse.status, type: webhookType };
            } catch (e) {
              actionResult = { webhook_sent: false, error: e instanceof Error ? e.message : 'Erro ao enviar webhook' };
            }
          } else {
            actionResult = { webhook_sent: false, error: 'URL do webhook não configurada' };
          }
        }
        
        // Log execution
        await supabase.from("automation_logs").insert({
          rule_id,
          trigger_data: test_data || {},
          action_result: actionResult,
          status: 'success'
        });
        
        // Update execution count
        await supabase.from("automation_rules")
          .update({ execution_count: (rule.execution_count || 0) + 1, last_executed_at: new Date().toISOString() })
          .eq("id", rule_id);
        
        await logAction(supabase, adminId, "ai_execute_automation", "automation_rules", rule_id, { test_data, result: actionResult });
        return { success: true, result: { executed_rule: rule.name, action_result: actionResult } };
      }

      // ========== PUBLICAÇÕES SOCIAIS ==========
      case "create_social_post": {
        const { platforms, content, media_type, media_url, scheduled_at } = args;
        
        // Verificar se META_SYSTEM_USER_TOKEN está configurado
        const META_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
        const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
        const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_ACCOUNT_ID");
        
        if (!META_TOKEN) {
          return {
            success: false,
            result: null,
            error: "META_SYSTEM_USER_TOKEN não configurado. Configure nas secrets do Lovable Cloud."
          };
        }
        
        const results: Record<string, any> = {};
        
        // Publicar em cada plataforma
        for (const platform of platforms) {
          if ((platform === 'facebook' || platform === 'instagram') && (FACEBOOK_PAGE_ID || INSTAGRAM_ACCOUNT_ID)) {
            try {
              // Chamar edge function publish-social
              const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
              const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
              
              const publishResponse = await fetch(`${SUPABASE_URL}/functions/v1/publish-social`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                  platform: platform,
                  content,
                  mediaUrl: media_url,
                  mediaType: media_type === 'image' ? 'image' : media_type === 'video' ? 'video' : undefined
                })
              });
              
              const publishResult = await publishResponse.json();
              results[platform] = publishResult;
            } catch (e) {
              results[platform] = { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' };
            }
          } else if (platform === 'whatsapp') {
            results[platform] = { success: false, error: 'WhatsApp requer envio para número específico. Use send_whatsapp_message.' };
          } else {
            results[platform] = { success: false, error: 'Plataforma não configurada ou não suportada' };
          }
        }
        
        const allSuccess = Object.values(results).every((r: any) => r.success);
        
        await logAction(supabase, adminId, "ai_create_social_post", "social_posts", null, { platforms, content_preview: content.substring(0, 50), results });
        return { 
          success: allSuccess, 
          result: {
            message: allSuccess ? 'Publicado com sucesso em todas as plataformas!' : 'Algumas publicações falharam.',
            platforms_results: results
          }
        };
      }

      case "list_social_posts": {
        // Buscar posts da tabela de auditoria
        const { data: posts } = await supabase
          .from("admin_audit_log")
          .select("*")
          .eq("action", "ai_create_social_post")
          .order("created_at", { ascending: false })
          .limit(20);
        
        return { 
          success: true, 
          result: { 
            posts: posts || [],
            message: posts?.length ? `${posts.length} publicações encontradas` : "Nenhuma publicação ainda.",
            tip: "Use create_social_post para publicar diretamente no Facebook e Instagram"
          } 
        };
      }

      case "send_whatsapp_message": {
        const { phone_number, template_name, template_params, message: msg } = args;
        
        const META_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
        const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        
        if (!META_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
          return {
            success: false,
            result: null,
            error: "WhatsApp não configurado. Configure META_SYSTEM_USER_TOKEN e WHATSAPP_PHONE_NUMBER_ID nas secrets."
          };
        }
        
        try {
          // Chamar edge function send-whatsapp
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
          const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
          
          const whatsappResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              to: phone_number,
              type: template_name ? 'template' : 'text',
              message: msg,
              template: template_name ? {
                name: template_name,
                language: 'pt_BR',
                components: template_params ? [{ type: 'body', parameters: template_params.map((p: string) => ({ type: 'text', text: p })) }] : []
              } : undefined
            })
          });
          
          const result = await whatsappResponse.json();
          
          await logAction(supabase, adminId, "ai_send_whatsapp", "whatsapp_messages", null, { phone_number, template_name, result });
          
          return { 
            success: result.success, 
            result: result.success ? {
              message: `Mensagem enviada para ${phone_number}!`,
              whatsapp_message_id: result.messageId,
              details: result
            } : {
              error: result.error,
              details: result
            }
          };
        } catch (e) {
          return {
            success: false,
            result: null,
            error: e instanceof Error ? e.message : 'Erro ao enviar WhatsApp'
          };
        }
      }

      case "get_social_accounts": {
        const META_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
        const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
        const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_ACCOUNT_ID");
        const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        
        return {
          success: true,
          result: {
            accounts: [
              {
                platform: 'facebook',
                name: 'Sky Streamer',
                connected: !!META_TOKEN && !!FACEBOOK_PAGE_ID,
                status: META_TOKEN && FACEBOOK_PAGE_ID ? 'configured' : 'not_configured',
                page_id: FACEBOOK_PAGE_ID || null
              },
              {
                platform: 'instagram',
                name: '@skystreamer.online',
                connected: !!META_TOKEN && !!INSTAGRAM_ACCOUNT_ID,
                status: META_TOKEN && INSTAGRAM_ACCOUNT_ID ? 'configured' : 'not_configured',
                account_id: INSTAGRAM_ACCOUNT_ID || null
              },
              {
                platform: 'whatsapp',
                name: 'WhatsApp Business - Sky Agencya',
                connected: !!META_TOKEN && !!WHATSAPP_PHONE_NUMBER_ID,
                status: META_TOKEN && WHATSAPP_PHONE_NUMBER_ID ? 'configured' : 'not_configured',
                phone_id: WHATSAPP_PHONE_NUMBER_ID || null
              }
            ]
          }
        };
      }

      case "check_social_integration_status": {
        const META_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
        const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
        const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_ACCOUNT_ID");
        const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        
        const facebookReady = !!META_TOKEN && !!FACEBOOK_PAGE_ID;
        const instagramReady = !!META_TOKEN && !!INSTAGRAM_ACCOUNT_ID;
        const whatsappReady = !!META_TOKEN && !!WHATSAPP_PHONE_NUMBER_ID;
        
        return {
          success: true,
          result: {
            system_user_token: {
              configured: !!META_TOKEN,
              note: "Token único do System User para todas as plataformas Meta"
            },
            facebook: {
              page_id_configured: !!FACEBOOK_PAGE_ID,
              ready: facebookReady,
              page_id: FACEBOOK_PAGE_ID || null
            },
            instagram: {
              account_id_configured: !!INSTAGRAM_ACCOUNT_ID,
              ready: instagramReady,
              account_id: INSTAGRAM_ACCOUNT_ID || null
            },
            whatsapp: {
              phone_number_id_configured: !!WHATSAPP_PHONE_NUMBER_ID,
              ready: whatsappReady,
              phone_id: WHATSAPP_PHONE_NUMBER_ID || null
            },
            overall_status: (facebookReady && instagramReady && whatsappReady) ? 'fully_configured' : 
                           (facebookReady || instagramReady || whatsappReady) ? 'partially_configured' : 'not_configured',
            capabilities: {
              can_publish_facebook: facebookReady,
              can_publish_instagram: instagramReady,
              can_send_whatsapp: whatsappReady
            },
            next_steps: !META_TOKEN ? ["Configure META_SYSTEM_USER_TOKEN"] : []
          }
        };
      }

      // ========== GERENCIAMENTO DE INTEGRAÇÕES ==========
      case "list_integration_requirements": {
        const { integration = 'all' } = args;
        
        const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
        const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
        const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
        const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        
        const integrations: Record<string, any> = {
          facebook: {
            name: "Facebook / Instagram (Meta Graph API)",
            secrets_required: [
              { name: "FACEBOOK_APP_ID", configured: !!FACEBOOK_APP_ID, description: "ID do App Meta Developer" },
              { name: "FACEBOOK_ACCESS_TOKEN", configured: !!FACEBOOK_ACCESS_TOKEN, description: "Token de acesso da página/app" }
            ],
            setup_url: "https://developers.facebook.com/apps/",
            permissions_needed: ["pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish"],
            status: !!FACEBOOK_APP_ID && !!FACEBOOK_ACCESS_TOKEN ? "ready" : "needs_configuration"
          },
          instagram: {
            name: "Instagram (via Meta Graph API)",
            note: "Usa as mesmas credenciais do Facebook",
            secrets_required: [
              { name: "FACEBOOK_APP_ID", configured: !!FACEBOOK_APP_ID, description: "Mesmo do Facebook" },
              { name: "FACEBOOK_ACCESS_TOKEN", configured: !!FACEBOOK_ACCESS_TOKEN, description: "Mesmo do Facebook" }
            ],
            setup_url: "https://developers.facebook.com/docs/instagram-api/",
            permissions_needed: ["instagram_basic", "instagram_content_publish", "instagram_manage_comments"],
            status: !!FACEBOOK_APP_ID && !!FACEBOOK_ACCESS_TOKEN ? "ready" : "needs_configuration"
          },
          whatsapp: {
            name: "WhatsApp Business API",
            secrets_required: [
              { name: "WHATSAPP_ACCESS_TOKEN", configured: !!WHATSAPP_ACCESS_TOKEN, description: "Token de acesso permanente" },
              { name: "WHATSAPP_PHONE_NUMBER_ID", configured: !!WHATSAPP_PHONE_NUMBER_ID, description: "ID do número de telefone" }
            ],
            setup_url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/",
            notes: [
              "Requer conta Meta Business verificada",
              "Mensagens iniciadas requerem templates aprovados",
              "Respostas em 24h podem ser texto livre"
            ],
            status: !!WHATSAPP_ACCESS_TOKEN && !!WHATSAPP_PHONE_NUMBER_ID ? "ready" : "needs_configuration"
          }
        };
        
        const result = integration === 'all' ? integrations : { [integration]: integrations[integration] };
        return { success: true, result };
      }

      case "save_integration_config": {
        const { integration_type, config } = args;
        
        // Salvar configurações não-sensíveis em ai_assistant_settings
        const { error } = await supabase.from("ai_assistant_settings").upsert({
          setting_key: `social_integration_${integration_type}`,
          setting_value: config,
          updated_by: adminId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
        
        if (error) {
          return { success: false, result: null, error: `Erro ao salvar: ${error.message}` };
        }
        
        await logAction(supabase, adminId, "ai_save_integration_config", "ai_assistant_settings", integration_type, config);
        return { 
          success: true, 
          result: { 
            message: `Configuração de ${integration_type} salva com sucesso`,
            config_saved: config,
            next_step: "Para tokens e secrets sensíveis, use o gerenciador de secrets do Lovable Cloud"
          } 
        };
      }

      case "get_meta_setup_guide": {
        return {
          success: true,
          result: {
            title: "Guia de Configuração: Meta APIs (Facebook/Instagram)",
            steps: [
              {
                step: 1,
                title: "Criar App no Meta for Developers",
                url: "https://developers.facebook.com/apps/create/",
                details: [
                  "Acesse developers.facebook.com e faça login",
                  "Clique em 'Criar App'",
                  "Escolha 'Business' como tipo",
                  "Preencha nome e email de contato"
                ]
              },
              {
                step: 2,
                title: "Configurar produtos",
                details: [
                  "No dashboard do app, adicione os produtos: Facebook Login, Instagram Graph API",
                  "Configure as URLs de redirecionamento OAuth"
                ]
              },
              {
                step: 3,
                title: "Obter credenciais",
                details: [
                  "FACEBOOK_APP_ID: Encontre em Configurações > Básico",
                  "FACEBOOK_ACCESS_TOKEN: Gere em Ferramentas > Graph API Explorer",
                  "Selecione sua página e as permissões necessárias"
                ]
              },
              {
                step: 4,
                title: "Adicionar secrets no Lovable",
                details: [
                  "Vá em Configurações > Secrets no Lovable Cloud",
                  "Adicione FACEBOOK_APP_ID com o ID do app",
                  "Adicione FACEBOOK_ACCESS_TOKEN com o token gerado"
                ],
                lovable_action: "Peça ao admin para adicionar os secrets"
              }
            ],
            permissions_required: [
              "pages_manage_posts - Publicar na página",
              "pages_read_engagement - Ler métricas",
              "instagram_basic - Acesso básico ao Instagram",
              "instagram_content_publish - Publicar no Instagram"
            ],
            important_notes: [
              "Tokens expiram! Configure token de longa duração ou renovação automática",
              "App precisa estar em modo 'Live' para produção",
              "Algumas permissões requerem revisão do Meta"
            ]
          }
        };
      }

      case "get_whatsapp_setup_guide": {
        return {
          success: true,
          result: {
            title: "Guia de Configuração: WhatsApp Business API",
            steps: [
              {
                step: 1,
                title: "Requisitos prévios",
                details: [
                  "Conta Meta Business Manager verificada",
                  "Número de telefone não usado em WhatsApp pessoal ou Business App",
                  "Empresa registrada (CNPJ para Brasil)"
                ]
              },
              {
                step: 2,
                title: "Criar App WhatsApp",
                url: "https://developers.facebook.com/apps/create/",
                details: [
                  "Crie novo app tipo 'Business'",
                  "Adicione o produto 'WhatsApp'",
                  "Siga o assistente de configuração"
                ]
              },
              {
                step: 3,
                title: "Configurar número de teste",
                details: [
                  "No dashboard WhatsApp, vá em 'API Setup'",
                  "Use o número de teste gratuito do Meta para começar",
                  "Adicione números de telefone para receber mensagens de teste"
                ]
              },
              {
                step: 4,
                title: "Obter credenciais",
                details: [
                  "WHATSAPP_ACCESS_TOKEN: Token temporário ou permanente",
                  "WHATSAPP_PHONE_NUMBER_ID: ID do número (não é o número em si)",
                  "Para token permanente: Configurações > Business Settings > System Users"
                ]
              },
              {
                step: 5,
                title: "Criar templates de mensagem",
                url: "https://business.facebook.com/wa/manage/message-templates/",
                details: [
                  "Templates são obrigatórios para iniciar conversas",
                  "Precisam ser aprovados pelo Meta (24-48h)",
                  "Categorias: Marketing, Utility, Authentication"
                ]
              },
              {
                step: 6,
                title: "Adicionar secrets no Lovable",
                details: [
                  "Adicione WHATSAPP_ACCESS_TOKEN",
                  "Adicione WHATSAPP_PHONE_NUMBER_ID"
                ],
                lovable_action: "Peça ao admin para adicionar os secrets"
              }
            ],
            pricing_info: {
              free_tier: "1000 conversas/mês gratuitas",
              paid: "Preço varia por país e tipo de conversa",
              url: "https://developers.facebook.com/docs/whatsapp/pricing/"
            },
            important_notes: [
              "Mensagens iniciadas pelo negócio requerem templates aprovados",
              "Respostas dentro de 24h podem ser texto livre",
              "Número de produção requer verificação do Meta"
            ]
          }
        };
      }

      case "test_social_connection": {
        const { platform } = args;
        const META_TOKEN = Deno.env.get("META_SYSTEM_USER_TOKEN");
        
        if (!META_TOKEN) {
          return { 
            success: false, 
            result: null, 
            error: "META_SYSTEM_USER_TOKEN não configurado. Configure nas secrets do Lovable Cloud." 
          };
        }
        
        if (platform === 'facebook') {
          const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
          if (!FACEBOOK_PAGE_ID) {
            return { 
              success: false, 
              result: null, 
              error: "FACEBOOK_PAGE_ID não configurado." 
            };
          }
          
          try {
            const response = await fetch(`https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}?fields=name,id,followers_count&access_token=${META_TOKEN}`);
            const data = await response.json();
            
            if (data.error) {
              return { 
                success: false, 
                result: { error: data.error.message, code: data.error.code },
                error: `Erro na API: ${data.error.message}`
              };
            }
            
            await logAction(supabase, adminId, "ai_test_social_connection", "social_integrations", platform, { success: true });
            return { 
              success: true, 
              result: { 
                status: "connected",
                platform: "facebook",
                page_name: data.name,
                page_id: data.id,
                followers: data.followers_count,
                message: `✅ Facebook conectado: ${data.name}`
              } 
            };
          } catch (e) {
            return { success: false, result: null, error: `Erro de conexão: ${e instanceof Error ? e.message : 'Desconhecido'}` };
          }
        }
        
        if (platform === 'instagram') {
          const INSTAGRAM_ACCOUNT_ID = Deno.env.get("INSTAGRAM_ACCOUNT_ID");
          if (!INSTAGRAM_ACCOUNT_ID) {
            return { 
              success: false, 
              result: null, 
              error: "INSTAGRAM_ACCOUNT_ID não configurado." 
            };
          }
          
          try {
            const response = await fetch(`https://graph.facebook.com/v21.0/${INSTAGRAM_ACCOUNT_ID}?fields=username,id,followers_count,media_count&access_token=${META_TOKEN}`);
            const data = await response.json();
            
            if (data.error) {
              return { 
                success: false, 
                result: { error: data.error.message, code: data.error.code },
                error: `Erro na API: ${data.error.message}`
              };
            }
            
            await logAction(supabase, adminId, "ai_test_social_connection", "social_integrations", platform, { success: true });
            return { 
              success: true, 
              result: { 
                status: "connected",
                platform: "instagram",
                username: data.username || '@skystreamer.online',
                account_id: data.id,
                followers: data.followers_count,
                posts: data.media_count,
                message: `✅ Instagram conectado: @${data.username || 'skystreamer.online'}`
              } 
            };
          } catch (e) {
            return { success: false, result: null, error: `Erro de conexão: ${e instanceof Error ? e.message : 'Desconhecido'}` };
          }
        }
        
        if (platform === 'whatsapp') {
          const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
          
          if (!WHATSAPP_PHONE_NUMBER_ID) {
            return { 
              success: false, 
              result: null, 
              error: "WHATSAPP_PHONE_NUMBER_ID não configurado." 
            };
          }
          
          try {
            const response = await fetch(
              `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}?access_token=${META_TOKEN}`
            );
            const data = await response.json();
            
            if (data.error) {
              return { 
                success: false, 
                result: { error: data.error.message },
                error: `Erro na API: ${data.error.message}`
              };
            }
            
            await logAction(supabase, adminId, "ai_test_social_connection", "social_integrations", platform, { success: true });
            return { 
              success: true, 
              result: { 
                status: "connected",
                platform: "whatsapp",
                phone_number: data.display_phone_number,
                verified_name: data.verified_name,
                quality_rating: data.quality_rating,
                message: `✅ WhatsApp Business conectado: ${data.display_phone_number}`
              } 
            };
          } catch (e) {
            return { success: false, result: null, error: `Erro de conexão: ${e instanceof Error ? e.message : 'Desconhecido'}` };
          }
        }
        
        return { success: false, result: null, error: `Plataforma ${platform} não suportada` };
      }

      case "request_secret_configuration": {
        const { secrets_needed, purpose } = args;
        
        const secretsInfo = secrets_needed.map((secret: string) => {
          const info: Record<string, any> = {
            FACEBOOK_APP_ID: {
              where_to_find: "Meta for Developers > Seu App > Configurações > Básico",
              example_format: "123456789012345",
              url: "https://developers.facebook.com/apps/"
            },
            FACEBOOK_ACCESS_TOKEN: {
              where_to_find: "Meta for Developers > Ferramentas > Graph API Explorer",
              example_format: "EAAxxxxxxx...",
              note: "Tokens expiram - use System User para token permanente",
              url: "https://developers.facebook.com/tools/explorer/"
            },
            WHATSAPP_ACCESS_TOKEN: {
              where_to_find: "Meta for Developers > WhatsApp > API Setup",
              example_format: "EAAxxxxxxx...",
              note: "Para produção, gere token permanente via System User",
              url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/"
            },
            WHATSAPP_PHONE_NUMBER_ID: {
              where_to_find: "Meta for Developers > WhatsApp > API Setup > Phone Number ID",
              example_format: "123456789012345",
              note: "É o ID, não o número de telefone em si"
            }
          };
          return { name: secret, ...info[secret] };
        });
        
        await logAction(supabase, adminId, "ai_request_secret_config", "secrets", null, { secrets_needed, purpose });
        
        return {
          success: true,
          result: {
            message: "📋 Configuração de Secrets Necessária",
            purpose,
            action_required: "Adicione os seguintes secrets no Lovable Cloud",
            how_to_add: [
              "1. Acesse as Configurações do projeto no Lovable",
              "2. Vá em 'Secrets' ou 'Variáveis de Ambiente'",
              "3. Adicione cada secret com seu respectivo valor",
              "4. Salve as alterações"
            ],
            secrets: secretsInfo,
            after_configuration: "Após configurar, peça para eu testar a conexão com test_social_connection"
          }
        };
      }

      default:
        return { success: false, result: null, error: `Ferramenta ${toolName} não encontrada` };
    }
  } catch (error) {
    console.error(`[admin-ai-assistant] Tool execution error:`, error);
    return { success: false, result: null, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

async function logAction(supabase: any, adminId: string, action: string, table: string, targetId: string | null, details: any) {
  try {
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_table: table,
      target_id: targetId,
      details
    });
  } catch (e) {
    console.error("Erro ao logar ação:", e);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token necessário" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, anonKey);

    // Em ambiente de função não existe sessão persistida,
    // então precisamos passar explicitamente o token JWT
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !user) {
      console.error("[admin-ai-assistant] Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Permissão negada" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[admin-ai-assistant] Admin: ${user.email}`);

    const { message, context, conversationHistory = [] }: AIAssistantRequest = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "message obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const businessContext = await gatherBusinessContext(supabase);
    const systemPrompt = buildSystemPrompt(context, businessContext);

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: availableTools,
        tool_choice: "auto",
        stream: false,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message;

    if (assistantMessage?.tool_calls?.length > 0) {
      console.log("[admin-ai-assistant] Processing tools:", assistantMessage.tool_calls.length);

      const toolResults: any[] = [];
      const actionsExecuted: any[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        const toolArgs = JSON.parse(toolCall.function?.arguments || "{}");

        // Check if action requires confirmation
        const isDestructive = DESTRUCTIVE_ACTIONS.includes(toolName);

        const result = await executeTool(supabase, toolName, toolArgs, user.id);

        const actionRecord = {
          tool: toolName,
          args: toolArgs,
          success: result.success,
          result: result.result,
          error: result.error,
          is_destructive: isDestructive,
          timestamp: new Date().toISOString()
        };
        actionsExecuted.push(actionRecord);

        if (result.success) {
          toolResults.push(`✅ **${toolName}** executado com sucesso:\n${JSON.stringify(result.result, null, 2)}`);
        } else {
          toolResults.push(`❌ **${toolName}** falhou: ${result.error}`);
        }
      }

      // Final response
      const finalMessages = [
        ...messages,
        assistantMessage,
        { role: "tool", content: toolResults.join("\n\n"), tool_call_id: assistantMessage.tool_calls[0].id }
      ];

      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: finalMessages, stream: false, max_tokens: 2000 })
      });

      const finalAIResponse = await finalResponse.json();
      const finalContent = finalAIResponse.choices?.[0]?.message?.content || `Ações executadas:\n${toolResults.join("\n")}`;

      return new Response(JSON.stringify({
        success: true,
        response: finalContent,
        context,
        actions_executed: actionsExecuted
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      response: assistantMessage?.content || "Não consegui processar.",
      context
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[admin-ai-assistant] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

async function gatherBusinessContext(supabase: any) {
  const context: Record<string, any> = {};
  try {
    const [contacts, templates, campaigns, chats, aiModes, aiFeedback, aiLearnings] = await Promise.all([
      supabase.from("contact_submissions").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(20),
      supabase.from("email_templates").select("id, name, subject, is_active").eq("is_active", true),
      supabase.from("email_campaigns").select("id, name, subject, status, sent_count, opened_count, clicked_count", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
      supabase.from("chat_conversations").select("id, visitor_name, visitor_email, status, created_at, current_mode, ai_confidence", { count: "exact" }).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_mode_config").select("mode, is_enabled, confidence_threshold, description, trigger_keywords"),
      supabase.from("ai_feedback").select("rating, resolved, comment, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_learnings").select("pattern, category, success_score, fail_score, is_active").eq("is_active", true).order("success_score", { ascending: false }).limit(20)
    ]);

    context.totalContacts = contacts.count || 0;
    context.recentContacts = contacts.data?.map((c: any) => ({ id: c.id, name: c.name, email: c.email, userType: c.user_type, source: c.source })) || [];
    context.emailTemplates = templates.data || [];
    context.totalCampaigns = campaigns.count || 0;
    context.recentCampaigns = campaigns.data || [];
    context.totalChats = chats.count || 0;
    context.recentChats = chats.data?.map((c: any) => ({ id: c.id, name: c.visitor_name, email: c.visitor_email, status: c.status, mode: c.current_mode })) || [];
    context.aiModes = aiModes.data || [];
    context.activeAIModes = aiModes.data?.filter((m: any) => m.is_enabled).map((m: any) => m.mode) || [];
    context.totalAIFeedback = aiFeedback.count || 0;
    const ratings = aiFeedback.data?.filter((f: any) => f.rating != null) || [];
    context.avgAIRating = ratings.length > 0 ? (ratings.reduce((sum: number, f: any) => sum + f.rating, 0) / ratings.length).toFixed(1) : "N/A";
    context.unresolvedFeedback = aiFeedback.data?.filter((f: any) => !f.resolved).length || 0;
    context.totalAILearnings = aiLearnings.count || 0;
    context.topPatterns = aiLearnings.data?.slice(0, 5) || [];
  } catch (e) {
    console.error("[gatherBusinessContext] Error:", e);
  }
  return context;
}

function buildSystemPrompt(context: string, bc: Record<string, any>) {
  return `Você é o ASSISTENTE IA AUTÔNOMO do painel administrativo SKY BRASIL com PODERES TOTAIS DE EXECUÇÃO.

🔧 SUAS CAPACIDADES (USE-AS!):

📧 **E-MAILS & CAMPANHAS:**
- send_email: Enviar emails diretamente
- list_email_templates, create_email_template, update_email_template, delete_email_template
- list_campaigns, create_campaign, send_campaign, delete_campaign

💬 **CHAT & CONVERSAS:**
- list_conversations, get_conversation_messages, close_conversation
- delete_chat_messages, delete_conversation

👥 **CONTATOS:**
- list_contacts, create_contact, update_contact_status, delete_contact

🧠 **IA EVOLUTIVA:**
- create_ai_learning, list_ai_learnings, delete_ai_learning
- update_ai_mode, get_ai_feedback_summary, resolve_ai_feedback

⚙️ **SISTEMA:**
- get_system_stats, get_audit_logs, list_esp_configurations, update_esp_configuration
- get_admin_users

🗑️ **OPERAÇÕES EM MASSA:**
- bulk_delete_conversations, bulk_delete_contacts, export_data

📱 **REDES SOCIAIS & INTEGRAÇÕES (NOVAS!):**
- create_social_post: Criar/agendar posts (Facebook, Instagram, WhatsApp)
- list_social_posts: Listar publicações
- send_whatsapp_message: Enviar mensagens WhatsApp Business
- get_social_accounts: Ver contas conectadas
- check_social_integration_status: Verificar status das APIs
- list_integration_requirements: Ver requisitos de cada integração
- save_integration_config: Salvar configurações não-sensíveis
- get_meta_setup_guide: Guia completo para Facebook/Instagram
- get_whatsapp_setup_guide: Guia completo para WhatsApp Business
- test_social_connection: Testar conexão com APIs
- request_secret_configuration: Instruir admin a configurar secrets

🔐 **GERENCIAMENTO DE SECRETS:**
Quando precisar de credenciais (FACEBOOK_APP_ID, WHATSAPP_ACCESS_TOKEN, etc.):
1. Use check_social_integration_status para ver o que falta
2. Use get_meta_setup_guide ou get_whatsapp_setup_guide para instruções detalhadas
3. Use request_secret_configuration para gerar instruções de configuração
4. Use test_social_connection para validar após configuração

📊 **CONTEXTO ATUAL:**
- Contatos: ${bc.totalContacts || 0} | Conversas: ${bc.totalChats || 0} | Campanhas: ${bc.totalCampaigns || 0}
- Templates ativos: ${bc.emailTemplates?.length || 0}
- Modos IA ativos: ${bc.activeAIModes?.join(", ") || "Nenhum"}
- Avaliação média: ${bc.avgAIRating || "N/A"}/5

**CONTATOS RECENTES (para referência):**
${bc.recentContacts?.slice(0, 5).map((c: any) => `- [${c.id}] ${c.name} (${c.email})`).join("\n") || "Nenhum"}

**CONVERSAS RECENTES (para referência):**
${bc.recentChats?.slice(0, 5).map((c: any) => `- [${c.id}] ${c.name || 'Visitante'} | ${c.status}`).join("\n") || "Nenhuma"}

**REGRAS:**
1. Responda em português brasileiro
2. EXECUTE as ações quando solicitado - você TEM as ferramentas!
3. Confirme o que foi feito com detalhes
4. Se precisar de um ID específico, pergunte ou liste primeiro
5. Ações são registradas no log de auditoria
6. Para ações destrutivas (delete), informe o que será deletado antes de executar
7. Para integrações sociais, verifique primeiro o status e guie o admin na configuração`;
}

serve(handler);
