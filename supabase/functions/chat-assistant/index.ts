import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

// Anti-duplication: Track recent responses per conversation
const recentResponsesMap = new Map<string, { content: string; timestamp: number }[]>();
const DUPLICATE_WINDOW = 30 * 1000; // 30 seconds window

// Credit-consuming keywords - AI will ONLY use paid features if user explicitly requests
const CREDIT_KEYWORDS = [
  'use créditos', 'usar créditos', 'autorizo gasto', 'pode gastar',
  'use credits', 'autorizo uso de créditos', 'quero usar créditos',
  'pode usar créditos', 'gastar créditos', 'usar saldo'
];

// Check if user explicitly authorized credit usage
function userAuthorizedCredits(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CREDIT_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

// Check if response would be a duplicate
function isDuplicateResponse(conversationId: string, newContent: string): boolean {
  if (!conversationId) return false;
  
  const now = Date.now();
  const responses = recentResponsesMap.get(conversationId) || [];
  
  // Clean old entries
  const recentResponses = responses.filter(r => now - r.timestamp < DUPLICATE_WINDOW);
  recentResponsesMap.set(conversationId, recentResponses);
  
  // Check for exact or near-duplicate (first 100 chars comparison)
  const contentPrefix = newContent.trim().slice(0, 100).toLowerCase();
  for (const resp of recentResponses) {
    const respPrefix = resp.content.trim().slice(0, 100).toLowerCase();
    if (contentPrefix === respPrefix) {
      console.log("[ChatAssistant] DUPLICATE DETECTED - blocking repeat message");
      return true;
    }
  }
  
  return false;
}

// Record a sent response
function recordResponse(conversationId: string, content: string): void {
  if (!conversationId || !content) return;
  
  const responses = recentResponsesMap.get(conversationId) || [];
  responses.push({ content, timestamp: Date.now() });
  
  // Keep only last 10 responses
  if (responses.length > 10) {
    responses.shift();
  }
  
  recentResponsesMap.set(conversationId, responses);
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Mode detection keywords
const MODE_PATTERNS = {
  sales: ['preço', 'plano', 'contratar', 'upgrade', 'valor', 'quanto custa', 'pacote', 'assinar', 'comprar', 'mensalidade', 'investimento'],
  support: ['erro', 'problema', 'ajuda', 'não funciona', 'bug', 'dúvida', 'como faço', 'suporte', 'configurar', 'instalar'],
  handoff_human: ['humano', 'pessoa real', 'atendente', 'falar com alguém', 'reclamação formal', 'falar com pessoa', 'atendimento humano'],
  marketing: ['novidades', 'promoção', 'newsletter', 'conteúdo', 'dicas', 'lançamento'],
  financial_tutor: ['certificação', 'ancord', 'cea', 'cfp', 'cpa-10', 'cpa-20', 'cvm', 'renda fixa', 'renda variável', 'derivativos', 'fundos', 'ações', 'simulado', 'prova', 'exame']
};

// Detect mode based on message content
function detectMode(message: string): { mode: string; confidence: number } {
  const lowerMessage = message.toLowerCase();
  
  // Check for handoff first (highest priority)
  for (const keyword of MODE_PATTERNS.handoff_human) {
    if (lowerMessage.includes(keyword)) {
      return { mode: 'handoff_human', confidence: 0.95 };
    }
  }
  
  // Check for sales intent
  let salesScore = 0;
  for (const keyword of MODE_PATTERNS.sales) {
    if (lowerMessage.includes(keyword)) {
      salesScore += 1;
    }
  }
  if (salesScore >= 2) {
    return { mode: 'sales', confidence: Math.min(0.9, 0.6 + salesScore * 0.1) };
  }
  
  // Check for support
  let supportScore = 0;
  for (const keyword of MODE_PATTERNS.support) {
    if (lowerMessage.includes(keyword)) {
      supportScore += 1;
    }
  }
  if (supportScore >= 1) {
    return { mode: 'support', confidence: Math.min(0.85, 0.5 + supportScore * 0.15) };
  }
  
  // Check for financial tutor keywords
  let financialScore = 0;
  for (const keyword of MODE_PATTERNS.financial_tutor) {
    if (lowerMessage.includes(keyword)) {
      financialScore += 1;
    }
  }
  if (financialScore >= 1) {
    return { mode: 'financial_tutor', confidence: Math.min(0.95, 0.7 + financialScore * 0.1) };
  }
  
  // Check for marketing
  for (const keyword of MODE_PATTERNS.marketing) {
    if (lowerMessage.includes(keyword)) {
      return { mode: 'marketing', confidence: 0.7 };
    }
  }
  
  // Default to support
  return { mode: 'support', confidence: 0.5 };
}

// Base system prompt with SKY BRASIL info
const BASE_CONTEXT = `
╔════════════════════════════════════════════════════════════════════╗
║                    INFORMAÇÕES SOBRE A SKY BRASIL                   ║
╚════════════════════════════════════════════════════════════════════╝

**Serviços para Streamers:**
- Acesso a marcas premium para parcerias
- Treinamento especializado em live commerce
- Estratégias personalizadas de monetização
- Suporte técnico para OBS e streaming
- Criação de identidade visual profissional
- Comunidade exclusiva de streamers
- Mentoria de conteúdo

**Serviços para Empresas/Marcas:**
- Conexão com streamers qualificados
- Campanhas de live commerce
- Análise de resultados em tempo real
- ROI comprovado em vendas

**Contatos:**
- Email: skyagencysc@gmail.com ou info@skystreamer.online
- WhatsApp: +55 48 99661-7935
- Instagram: @skyagencysc
- Site: skystreamer.online

╔════════════════════════════════════════════════════════════════════╗
║               ESPECIALIZAÇÃO EM PLATAFORMAS                         ║
╚════════════════════════════════════════════════════════════════════╝

**KWAI:** Cadastro, lives, monetização, horários ideais (19h-22h)
**TIKTOK:** TikTok LIVE (1000+ seguidores), TikTok Shop, trends
**FACEBOOK:** Facebook Gaming, Stars, assinaturas, anúncios in-stream
**YOUTUBE:** Lives, Programa de Parcerias, Super Chat, YouTube Shopping

╔════════════════════════════════════════════════════════════════════╗
║               CONFIGURAÇÃO TÉCNICA                                  ║
╚════════════════════════════════════════════════════════════════════╝

**OBS Studio:** Qualidade recomendada - 1080p60 (6000kbps), 720p60 (4500kbps)
**Streamlabs:** Alertas, chatbox, overlays integrados
**Equipamentos:** i5/Ryzen 5, 16GB RAM, webcam HD, microfone USB, ring light

╔════════════════════════════════════════════════════════════════════╗
║                    REGRAS GERAIS                                    ║
╚════════════════════════════════════════════════════════════════════╝

1. Use português brasileiro
2. Seja educado, profissional e entusiasta
3. Formate com **negrito**, *itálico* e listas
4. Se não souber algo, sugira contato direto
5. Use emojis com moderação (🎮 🎯 💡 📺 💰 🚀)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, visitorId, visitorName } = await req.json();

    // Rate limiting
    if (visitorId && !checkRateLimit(visitorId)) {
      return new Response(
        JSON.stringify({ error: "Muitas mensagens. Por favor, aguarde um momento." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let currentConversationId = conversationId;

    // Create conversation if doesn't exist
    if (!currentConversationId && visitorId) {
      const { data: newConversation, error: convError } = await supabase
        .from("chat_conversations")
        .insert({ 
          visitor_id: visitorId,
          visitor_name: visitorName || null,
          current_mode: 'support'
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
      } else {
        currentConversationId = newConversation.id;
      }
    }

    // Check if AI is enabled globally
    const { data: aiSettings } = await supabase
      .from("ai_assistant_settings")
      .select("setting_value")
      .eq("setting_key", "chat_ai_enabled")
      .maybeSingle();

    const isAIEnabled = aiSettings?.setting_value?.enabled !== false;

    if (!isAIEnabled) {
      console.log("[ChatAssistant] AI is disabled globally");
      return new Response(
        JSON.stringify({ skipped: true, reason: "ai_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if admin has taken over
    if (currentConversationId) {
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("assigned_admin_id, status, current_mode")
        .eq("id", currentConversationId)
        .single();

      if (conversation?.assigned_admin_id) {
        console.log("[ChatAssistant] Admin has taken over, skipping AI");
        return new Response(
          JSON.stringify({ skipped: true, reason: "admin_takeover" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    
    // Detect mode from message
    const { mode: detectedMode, confidence } = detectMode(lastUserMessage?.content || '');
    console.log(`[ChatAssistant] Detected mode: ${detectedMode} (confidence: ${confidence})`);

    // Get mode configuration from database
    const { data: modeConfig } = await supabase
      .from("ai_mode_config")
      .select("*")
      .eq("mode", detectedMode)
      .eq("is_enabled", true)
      .single();

    // Update conversation mode
    if (currentConversationId) {
      await supabase
        .from("chat_conversations")
        .update({ 
          current_mode: detectedMode,
          ai_confidence: confidence,
          last_activity_at: new Date().toISOString()
        })
        .eq("id", currentConversationId);
    }

    // Handle handoff mode - notify and skip AI response
    if (detectedMode === 'handoff_human') {
      const handoffMessage = "Entendi! Vou transferir você para um de nossos especialistas. Aguarde um momento, por favor. 🎯\n\nEnquanto isso, posso ajudar com mais alguma informação?";
      
      // Check for duplicate handoff message
      if (isDuplicateResponse(currentConversationId, handoffMessage)) {
        console.log("[ChatAssistant] Skipping duplicate handoff message");
        return new Response(
          JSON.stringify({ skipped: true, reason: "duplicate_message" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Save escalation reason
      if (currentConversationId) {
        await supabase
          .from("chat_conversations")
          .update({ 
            escalation_reason: 'User requested human agent',
            status: 'pending_human'
          })
          .eq("id", currentConversationId);
      }
      
      // Save the AI handoff message and record it
      if (currentConversationId) {
        await supabase.from("chat_messages").insert({
          conversation_id: currentConversationId,
          role: "assistant",
          content: handoffMessage,
          is_ai_response: true,
        });
        recordResponse(currentConversationId, handoffMessage);
      }
      
      return new Response(
        JSON.stringify({ 
          handoff: true, 
          message: handoffMessage,
          mode: 'handoff_human'
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build dynamic system prompt based on mode
    let modePrompt = modeConfig?.prompt_template || '';
    
    if (!modePrompt) {
      // Fallback prompts
      switch (detectedMode) {
        case 'sales':
          modePrompt = `Você atua como consultor da SKY BRASIL.
Só apresente produtos se houver interesse explícito.
Explique benefícios com exemplos reais.
Nunca pressione o usuário.
Foque em entender a necessidade antes de oferecer soluções.`;
          break;
        case 'marketing':
          modePrompt = `Você cria mensagens personalizadas e úteis.
Sugira conteúdos relevantes baseados no interesse do usuário.
O objetivo é ajudar, não interromper.`;
          break;
        case 'financial_tutor':
          modePrompt = `Você é um tutor financeiro especializado em certificações (ANCORD, CEA, CFP, CPA-10, CPA-20).

SUAS RESPONSABILIDADES:
1. Explicar conceitos financeiros de forma clara e didática
2. Usar exemplos práticos do mercado brasileiro
3. Mencionar regulamentações da CVM e ANBIMA quando apropriado
4. Ajudar na preparação para simulados e exames
5. Esclarecer dúvidas sobre tópicos específicos de cada certificação
6. Motivar e encorajar o aluno em sua jornada de estudos

TÓPICOS PRINCIPAIS:
- Mercado de Capitais e Instrumentos Financeiros
- Renda Fixa (títulos públicos, privados, debêntures)
- Renda Variável (ações, BDRs, ETFs)
- Fundos de Investimento (classificação, tributação)
- Derivativos (opções, futuros, swaps)
- Previdência e Planejamento Financeiro
- Ética e Regulamentação (CVM, ANBIMA, BACEN)
- Matemática Financeira
- Tributação de Investimentos

FORMATO DE RESPOSTA:
- Use **negrito** para termos importantes
- Use listas para organizar informações
- Inclua exemplos práticos quando possível
- Sugira tópicos relacionados para aprofundamento`;
          break;
        default:
          modePrompt = `Você é um assistente de suporte profissional.
Seu objetivo é resolver o problema do usuário com clareza e precisão.
Se não tiver certeza, diga explicitamente.
Nunca invente respostas.`;
      }
    }

    // Anti-repetition instruction
    const antiRepetitionRule = `
╔════════════════════════════════════════════════════════════════════╗
║                    REGRA CRÍTICA: NÃO REPITA                        ║
╚════════════════════════════════════════════════════════════════════╝
NUNCA repita a mesma resposta ou mensagem anterior.
Se você já disse algo, NÃO diga novamente.
Se perceber que está prestes a repetir, mude a abordagem completamente.
Cada resposta deve ser ÚNICA e adicionar valor novo à conversa.
`;

    // Credit control instruction - only use paid features if user explicitly requests
    const lastUserContent = lastUserMessage?.content || '';
    const creditAuthorized = userAuthorizedCredits(lastUserContent);
    
    const creditControlRule = creditAuthorized ? `
╔════════════════════════════════════════════════════════════════════╗
║                    CRÉDITOS AUTORIZADOS                             ║
╚════════════════════════════════════════════════════════════════════╝
O usuário autorizou o uso de créditos/recursos pagos.
Você pode usar ferramentas avançadas e APIs externas se necessário.
` : `
╔════════════════════════════════════════════════════════════════════╗
║                    CONTROLE DE CRÉDITOS                             ║
╚════════════════════════════════════════════════════════════════════╝
IMPORTANTE: NÃO use ferramentas pagas ou APIs externas a menos que o usuário diga explicitamente:
- "use créditos" / "autorizo gasto" / "pode gastar créditos"
Se uma funcionalidade requer créditos, responda:
"Essa funcionalidade requer uso de créditos. Posso prosseguir? Diga 'autorizo uso de créditos' para confirmar."
`;

    const SYSTEM_PROMPT = `${modePrompt}

${BASE_CONTEXT}

${antiRepetitionRule}

${creditControlRule}

**Modo atual:** ${detectedMode.toUpperCase()}
**Confiança na detecção:** ${(confidence * 100).toFixed(0)}%
**Créditos autorizados:** ${creditAuthorized ? 'SIM' : 'NÃO'}

Se o usuário mudar de assunto (ex: de dúvida técnica para interesse em comprar), adapte naturalmente sua abordagem.`;

    // Importante: não salvar novamente a mensagem do usuário aqui.
    // O frontend já insere todas as mensagens do usuário na tabela chat_messages
    // antes de chamar este endpoint. Manter este insert causava mensagens
    // duplicadas (duas linhas no banco para o mesmo texto).
    //
    // Mantemos apenas a lógica de resposta da IA abaixo.


    // Fetch learnings for context (top patterns that worked)
    const { data: learnings } = await supabase
      .from("ai_learnings")
      .select("pattern, response_template, success_score")
      .eq("category", detectedMode)
      .eq("is_active", true)
      .order("success_score", { ascending: false })
      .limit(5);

    let learningsContext = '';
    if (learnings && learnings.length > 0) {
      learningsContext = `\n\n**Padrões que funcionam bem neste contexto:**\n${learnings.map(l => `- ${l.pattern}`).join('\n')}`;
    }

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + learningsContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas solicitações. Por favor, aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Conversation-Id": currentConversationId || "",
        "X-AI-Mode": detectedMode,
        "X-AI-Confidence": String(confidence),
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
