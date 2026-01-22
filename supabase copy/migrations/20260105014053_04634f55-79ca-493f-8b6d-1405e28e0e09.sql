-- =====================================================
-- SKY BRASIL SaaS v4.2.0 - Sistema de Avaliações e Templates
-- =====================================================

-- 1. Tabela de Templates de Certificados
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '{}',
  preview_image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates padrão de certificados
INSERT INTO public.certificate_templates (name, description, layout, is_default) VALUES
  ('Moderno', 'Design contemporâneo com bordas arredondadas', '{"style":"modern","borderColor":"#3b82f6","fontFamily":"Inter","backgroundColor":"#ffffff","accentColor":"#1e40af"}', true),
  ('Clássico', 'Estilo tradicional acadêmico', '{"style":"classic","borderColor":"#1f2937","fontFamily":"Georgia","backgroundColor":"#f9fafb","accentColor":"#374151"}', false),
  ('Minimalista', 'Design limpo e elegante', '{"style":"minimal","borderColor":"#10b981","fontFamily":"Helvetica","backgroundColor":"#ffffff","accentColor":"#059669"}', false),
  ('Corporativo', 'Para certificações empresariais', '{"style":"corporate","borderColor":"#6366f1","fontFamily":"Arial","backgroundColor":"#f8fafc","accentColor":"#4f46e5"}', false);

-- 2. Tabela de Templates de Histórico Escolar
CREATE TABLE IF NOT EXISTS public.transcript_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates padrão de histórico
INSERT INTO public.transcript_templates (name, description, layout, is_default) VALUES
  ('Acadêmico Padrão', 'Formato tradicional com detalhes completos', '{"style":"academic","showModuleDetails":true,"showGrades":true,"showHours":true}', true),
  ('Compacto', 'Versão resumida com informações essenciais', '{"style":"compact","showModuleDetails":false,"showGrades":true,"showHours":false}', false),
  ('Corporativo', 'Para treinamentos empresariais', '{"style":"corporate","showModuleDetails":true,"showGrades":true,"showHours":true}', false);

-- 3. Tabela de Simulados de Exames
CREATE TABLE IF NOT EXISTS public.exam_simulators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.product_modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER DEFAULT 10,
  time_limit_minutes INTEGER DEFAULT 60,
  passing_score INTEGER DEFAULT 70,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  allow_review BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT false,
  max_attempts INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Questões do Simulador
CREATE TABLE IF NOT EXISTS public.simulator_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulator_id UUID REFERENCES public.exam_simulators(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  options JSONB DEFAULT '[]',
  correct_answer TEXT,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Tentativas de Simulador
CREATE TABLE IF NOT EXISTS public.simulator_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulator_id UUID REFERENCES public.exam_simulators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score NUMERIC(5,2),
  total_points INTEGER,
  earned_points INTEGER,
  time_spent_seconds INTEGER,
  answers JSONB DEFAULT '{}',
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 6. Adicionar campos em company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS certificate_template_id UUID REFERENCES public.certificate_templates(id),
ADD COLUMN IF NOT EXISTS transcript_template_id UUID REFERENCES public.transcript_templates(id);

-- 7. Adicionar campo simulator_id em product_lessons
ALTER TABLE public.product_lessons
ADD COLUMN IF NOT EXISTS simulator_id UUID REFERENCES public.exam_simulators(id);

-- 8. Trigger para atualizar histórico após completar quiz/simulador
CREATE OR REPLACE FUNCTION public.update_history_after_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar histórico de módulos quando avaliação é completada
  IF NEW.passed IS NOT NULL THEN
    INSERT INTO public.historico_modulos (user_id, modulo_id, media_final, situacao, updated_at)
    SELECT 
      NEW.user_id,
      es.module_id,
      NEW.score,
      CASE WHEN NEW.passed THEN 'aprovado' ELSE 'cursando' END,
      now()
    FROM public.exam_simulators es
    WHERE es.id = NEW.simulator_id
    AND es.module_id IS NOT NULL
    ON CONFLICT (user_id, modulo_id) 
    DO UPDATE SET 
      media_final = GREATEST(historico_modulos.media_final, EXCLUDED.media_final),
      situacao = CASE WHEN EXCLUDED.media_final >= 70 THEN 'aprovado' ELSE historico_modulos.situacao END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_history_on_simulator ON public.simulator_attempts;
CREATE TRIGGER trigger_update_history_on_simulator
AFTER INSERT OR UPDATE ON public.simulator_attempts
FOR EACH ROW
WHEN (NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION public.update_history_after_assessment();

-- 9. RLS Policies
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_simulators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_attempts ENABLE ROW LEVEL SECURITY;

-- Certificate Templates - leitura pública
DROP POLICY IF EXISTS "certificate_templates_select" ON public.certificate_templates;
CREATE POLICY "certificate_templates_select" ON public.certificate_templates 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "certificate_templates_admin" ON public.certificate_templates;
CREATE POLICY "certificate_templates_admin" ON public.certificate_templates 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Transcript Templates - leitura pública
DROP POLICY IF EXISTS "transcript_templates_select" ON public.transcript_templates;
CREATE POLICY "transcript_templates_select" ON public.transcript_templates 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "transcript_templates_admin" ON public.transcript_templates;
CREATE POLICY "transcript_templates_admin" ON public.transcript_templates 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Exam Simulators - leitura pública, escrita admin
DROP POLICY IF EXISTS "exam_simulators_select" ON public.exam_simulators;
CREATE POLICY "exam_simulators_select" ON public.exam_simulators 
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "exam_simulators_admin" ON public.exam_simulators;
CREATE POLICY "exam_simulators_admin" ON public.exam_simulators 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Simulator Questions - leitura para todos, escrita admin
DROP POLICY IF EXISTS "simulator_questions_select" ON public.simulator_questions;
CREATE POLICY "simulator_questions_select" ON public.simulator_questions 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "simulator_questions_admin" ON public.simulator_questions;
CREATE POLICY "simulator_questions_admin" ON public.simulator_questions 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Simulator Attempts - usuário vê próprias, admin vê todas
DROP POLICY IF EXISTS "simulator_attempts_own" ON public.simulator_attempts;
CREATE POLICY "simulator_attempts_own" ON public.simulator_attempts 
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "simulator_attempts_insert" ON public.simulator_attempts;
CREATE POLICY "simulator_attempts_insert" ON public.simulator_attempts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Índices para performance
CREATE INDEX IF NOT EXISTS idx_exam_simulators_product ON public.exam_simulators(product_id);
CREATE INDEX IF NOT EXISTS idx_simulator_questions_simulator ON public.simulator_questions(simulator_id);
CREATE INDEX IF NOT EXISTS idx_simulator_attempts_user ON public.simulator_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_simulator_attempts_simulator ON public.simulator_attempts(simulator_id);

-- 11. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulator_attempts;