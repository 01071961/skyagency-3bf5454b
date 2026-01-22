-- Tabela para feedback de mensagens da IA
CREATE TABLE public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating IN (-1, 1)),
  resolved BOOLEAN DEFAULT false,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT -- visitor_id ou admin_id
);

-- Tabela para padrões aprendidos pela IA
CREATE TABLE public.ai_learnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- support, sales, marketing
  success_score INTEGER DEFAULT 0,
  fail_score INTEGER DEFAULT 0,
  response_template TEXT,
  keywords TEXT[],
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Tabela para configuração de modos da IA
CREATE TABLE public.ai_mode_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL UNIQUE CHECK (mode IN ('support', 'sales', 'marketing', 'handoff_human')),
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  prompt_template TEXT NOT NULL,
  trigger_keywords TEXT[],
  confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Adicionar coluna mode na conversa para tracking
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS current_mode TEXT DEFAULT 'support',
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Adicionar coluna de feedback na mensagem
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS feedback_score INTEGER CHECK (feedback_score IN (-1, 0, 1));

-- Enable RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mode_config ENABLE ROW LEVEL SECURITY;

-- Policies para ai_feedback
CREATE POLICY "Anyone can submit feedback" ON public.ai_feedback
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all feedback" ON public.ai_feedback
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage feedback" ON public.ai_feedback
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para ai_learnings
CREATE POLICY "Admins can manage learnings" ON public.ai_learnings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active learnings" ON public.ai_learnings
FOR SELECT USING (is_active = true);

-- Policies para ai_mode_config
CREATE POLICY "Admins can manage mode config" ON public.ai_mode_config
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read mode config" ON public.ai_mode_config
FOR SELECT USING (true);

-- Inserir configurações padrão dos modos
INSERT INTO public.ai_mode_config (mode, prompt_template, trigger_keywords, description, priority) VALUES
('support', 
'Você é um assistente de suporte profissional da SKY BRASIL.
Seu objetivo é resolver o problema do usuário com clareza, precisão e calma.
Se não tiver certeza, diga explicitamente.
Nunca invente respostas.
Se detectar frustração ou erro crítico, sugira atendimento humano.
Mantenha um tom amigável e profissional.',
ARRAY['erro', 'problema', 'ajuda', 'não funciona', 'bug', 'dúvida', 'como faço', 'suporte'],
'Modo padrão para resolução de problemas e dúvidas técnicas',
1),

('sales',
'Você atua como consultor, não como vendedor agressivo.
Só apresente produtos se houver interesse explícito.
Explique benefícios com exemplos reais.
Nunca pressione o usuário.
Se o usuário não quiser comprar, volte para suporte.
Foque em entender a necessidade antes de oferecer soluções.',
ARRAY['preço', 'plano', 'contratar', 'upgrade', 'valor', 'quanto custa', 'pacote', 'assinar', 'comprar'],
'Modo consultivo para apresentação de produtos e serviços',
2),

('marketing',
'Você cria mensagens personalizadas e úteis.
Nunca envie spam.
Toda ação exige consentimento do usuário.
O objetivo é ajudar, não interromper.
Sugira conteúdos relevantes baseados no histórico do usuário.',
ARRAY['novidades', 'promoção', 'newsletter', 'conteúdo', 'dicas'],
'Modo para engajamento e retenção de usuários',
3),

('handoff_human',
'Você está preparando a transição para um atendente humano.
Colete informações relevantes para facilitar o atendimento.
Informe o usuário que um especialista irá atendê-lo em breve.
Mantenha o usuário engajado enquanto aguarda.',
ARRAY['humano', 'pessoa real', 'atendente', 'falar com alguém', 'reclamação formal'],
'Modo de transição para atendimento humano',
4);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ai_learnings_updated_at
BEFORE UPDATE ON public.ai_learnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_mode_config_updated_at
BEFORE UPDATE ON public.ai_mode_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para feedback
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_feedback;