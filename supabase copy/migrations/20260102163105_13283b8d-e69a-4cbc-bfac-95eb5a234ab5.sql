-- ================================================
-- SKY FINANCE EDTECH - Database Structure
-- White-label para Educação Financeira
-- ================================================

-- Tipos de certificação financeira
CREATE TYPE public.financial_certification AS ENUM (
  'ancord',
  'cea', 
  'cfp',
  'cpa_10',
  'cpa_20',
  'cnpi',
  'other'
);

-- Dificuldade de questões
CREATE TYPE public.question_difficulty AS ENUM (
  'easy',
  'medium', 
  'hard',
  'expert'
);

-- Status do exame/simulado
CREATE TYPE public.exam_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Status da tentativa do aluno
CREATE TYPE public.attempt_status AS ENUM (
  'in_progress',
  'completed',
  'abandoned',
  'expired'
);

-- ================================================
-- Tabela: Bancos de Questões por Certificação
-- ================================================
CREATE TABLE public.question_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification financial_certification NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- Tabela: Questões Financeiras
-- ================================================
CREATE TABLE public.financial_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_id UUID REFERENCES public.question_banks(id) ON DELETE CASCADE,
  certification financial_certification NOT NULL,
  topic TEXT NOT NULL, -- Ex: "Renda Fixa", "Derivativos", "Ética"
  subtopic TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false, calculation
  options JSONB NOT NULL DEFAULT '[]', -- [{id, text, is_correct}]
  correct_answer TEXT,
  explanation TEXT, -- Explicação da resposta correta
  difficulty question_difficulty DEFAULT 'medium',
  points INTEGER DEFAULT 1,
  time_limit_seconds INTEGER DEFAULT 120,
  reference_material TEXT, -- Link para material de estudo
  cvm_regulation TEXT, -- Referência à norma CVM/ANCORD
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- Tabela: Simulados/Exames
-- ================================================
CREATE TABLE public.financial_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  certification financial_certification NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT DEFAULT 'practice', -- practice, mock, official_simulation
  total_questions INTEGER NOT NULL DEFAULT 50,
  passing_score INTEGER DEFAULT 70, -- Porcentagem para aprovação
  time_limit_minutes INTEGER DEFAULT 120,
  question_selection JSONB DEFAULT '{}', -- Regras de seleção: {topic: count}
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  show_answers_after BOOLEAN DEFAULT true,
  allow_review BOOLEAN DEFAULT true,
  max_attempts INTEGER, -- NULL = ilimitado
  status exam_status DEFAULT 'draft',
  is_free BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- Tabela: Tentativas de Exame
-- ================================================
CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.financial_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER,
  questions_order JSONB DEFAULT '[]', -- IDs das questões na ordem apresentada
  answers JSONB DEFAULT '{}', -- {question_id: {selected, is_correct, time_spent}}
  score INTEGER,
  total_correct INTEGER,
  total_wrong INTEGER,
  total_unanswered INTEGER,
  passed BOOLEAN,
  status attempt_status DEFAULT 'in_progress',
  review_data JSONB DEFAULT '{}', -- Dados de revisão por tópico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- Tabela: Progresso por Certificação
-- ================================================
CREATE TABLE public.certification_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification financial_certification NOT NULL,
  total_study_hours NUMERIC(10,2) DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  best_score NUMERIC(5,2) DEFAULT 0,
  exams_completed INTEGER DEFAULT 0,
  exams_passed INTEGER DEFAULT 0,
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  estimated_readiness NUMERIC(5,2) DEFAULT 0, -- % de preparo estimado
  target_date DATE, -- Data alvo para o exame oficial
  is_certified BOOLEAN DEFAULT false,
  certified_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, certification)
);

-- ================================================
-- Tabela: Unidades de Negócio (7 áreas)
-- ================================================
CREATE TABLE public.business_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE, -- Ex: 'certificacoes', 'renda-variavel'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'building',
  color TEXT DEFAULT '#3b82f6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir as 7 unidades inspiradas na MELVER
INSERT INTO public.business_units (slug, name, description, icon, color, sort_order) VALUES
  ('tecnologia', 'Tecnologia & Plataforma', 'Infraestrutura tecnológica e desenvolvimento', 'code', '#6366f1', 1),
  ('certificacoes', 'Certificações Financeiras', 'Preparatórios ANCORD, CEA, CFP, CPA', 'award', '#10b981', 2),
  ('renda-variavel', 'Renda Variável', 'Trading, análise técnica, opções e derivativos', 'trending-up', '#f59e0b', 3),
  ('renda-fixa', 'Renda Fixa & Tesouro', 'Títulos públicos, CDBs, debêntures', 'shield', '#3b82f6', 4),
  ('planejamento', 'Planejamento Financeiro', 'Gestão patrimonial, sucessão, previdência', 'target', '#8b5cf6', 5),
  ('b2b', 'Soluções Corporativas', 'Treinamentos in-company, consultoria', 'building-2', '#ef4444', 6),
  ('impacto-social', 'Impacto Social', 'Educação financeira em escolas e comunidades', 'heart', '#ec4899', 7);

-- ================================================
-- Tabela: Parcerias B2B
-- ================================================
CREATE TABLE public.b2b_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  partner_type TEXT DEFAULT 'corporate', -- corporate, institution, government
  status TEXT DEFAULT 'lead', -- lead, negotiation, active, inactive
  unit_id UUID REFERENCES public.business_units(id),
  contract_value NUMERIC(12,2),
  contract_start DATE,
  contract_end DATE,
  total_employees INTEGER,
  enrolled_employees INTEGER DEFAULT 0,
  certifications_target TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- Tabela: Métricas de Impacto Educacional
-- ================================================
CREATE TABLE public.education_impact_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  certification financial_certification,
  unit_id UUID REFERENCES public.business_units(id),
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  exams_taken INTEGER DEFAULT 0,
  exams_passed INTEGER DEFAULT 0,
  pass_rate NUMERIC(5,2) DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  study_hours_total NUMERIC(12,2) DEFAULT 0,
  new_certifications INTEGER DEFAULT 0,
  b2b_revenue NUMERIC(12,2) DEFAULT 0,
  b2c_revenue NUMERIC(12,2) DEFAULT 0,
  social_impact_students INTEGER DEFAULT 0, -- Alunos de programas sociais
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- Badges específicos para certificações
-- ================================================
CREATE TABLE public.certification_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  certification financial_certification,
  badge_type TEXT DEFAULT 'achievement', -- achievement, milestone, certification
  icon TEXT,
  color TEXT,
  requirement_type TEXT, -- score, exams_passed, study_hours, etc
  requirement_value INTEGER,
  points_reward INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir badges padrão
INSERT INTO public.certification_badges (name, description, certification, badge_type, icon, requirement_type, requirement_value, points_reward) VALUES
  ('Primeira Prova ANCORD', 'Completou seu primeiro simulado ANCORD', 'ancord', 'milestone', '🎯', 'exams_completed', 1, 25),
  ('Mestre ANCORD', 'Passou em 5 simulados ANCORD com nota >80%', 'ancord', 'achievement', '🏆', 'exams_passed', 5, 200),
  ('Certificado ANCORD', 'Aprovado no exame oficial ANCORD', 'ancord', 'certification', '🎓', 'certified', 1, 500),
  ('Primeira Prova CEA', 'Completou seu primeiro simulado CEA', 'cea', 'milestone', '🎯', 'exams_completed', 1, 25),
  ('Especialista CEA', 'Passou em 5 simulados CEA com nota >80%', 'cea', 'achievement', '🏆', 'exams_passed', 5, 200),
  ('Certificado CEA', 'Aprovado no exame oficial CEA', 'cea', 'certification', '🎓', 'certified', 1, 500),
  ('Estudante Dedicado', 'Acumulou 50 horas de estudo', NULL, 'milestone', '📚', 'study_hours', 50, 100),
  ('Maratonista', 'Acumulou 100 horas de estudo', NULL, 'achievement', '🏃', 'study_hours', 100, 250);

-- ================================================
-- Índices para performance
-- ================================================
CREATE INDEX idx_questions_certification ON public.financial_questions(certification);
CREATE INDEX idx_questions_bank ON public.financial_questions(bank_id);
CREATE INDEX idx_questions_topic ON public.financial_questions(topic);
CREATE INDEX idx_exams_certification ON public.financial_exams(certification);
CREATE INDEX idx_exams_product ON public.financial_exams(product_id);
CREATE INDEX idx_attempts_user ON public.exam_attempts(user_id);
CREATE INDEX idx_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX idx_progress_user ON public.certification_progress(user_id);
CREATE INDEX idx_progress_cert ON public.certification_progress(certification);
CREATE INDEX idx_metrics_date ON public.education_impact_metrics(metric_date);

-- ================================================
-- RLS Policies
-- ================================================
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_badges ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura para conteúdo publicado
CREATE POLICY "Anyone can view active question banks" ON public.question_banks FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view published exams" ON public.financial_exams FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can view business units" ON public.business_units FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view badges" ON public.certification_badges FOR SELECT USING (is_active = true);

-- Políticas para usuários autenticados
CREATE POLICY "Users can view their own attempts" ON public.exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create attempts" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attempts" ON public.exam_attempts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress" ON public.certification_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON public.certification_progress FOR ALL USING (auth.uid() = user_id);

-- Políticas para admins
CREATE POLICY "Admins can manage question banks" ON public.question_banks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage questions" ON public.financial_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage exams" ON public.financial_exams FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all attempts" ON public.exam_attempts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage B2B partners" ON public.b2b_partners FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage metrics" ON public.education_impact_metrics FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ================================================
-- Functions para cálculos automáticos
-- ================================================
CREATE OR REPLACE FUNCTION public.calculate_exam_score()
RETURNS TRIGGER AS $$
DECLARE
  total_correct INTEGER := 0;
  total_wrong INTEGER := 0;
  total_unanswered INTEGER := 0;
  total_questions INTEGER;
  calculated_score INTEGER;
  exam_passing_score INTEGER;
BEGIN
  -- Contar respostas
  SELECT COUNT(*) FILTER (WHERE (value->>'is_correct')::boolean = true),
         COUNT(*) FILTER (WHERE (value->>'is_correct')::boolean = false),
         COUNT(*) FILTER (WHERE value->>'selected' IS NULL)
  INTO total_correct, total_wrong, total_unanswered
  FROM jsonb_each(NEW.answers);
  
  -- Pegar total de questões do exame
  SELECT fe.total_questions, fe.passing_score 
  INTO total_questions, exam_passing_score
  FROM public.financial_exams fe WHERE fe.id = NEW.exam_id;
  
  -- Calcular score
  IF total_questions > 0 THEN
    calculated_score := ROUND((total_correct::NUMERIC / total_questions) * 100);
  ELSE
    calculated_score := 0;
  END IF;
  
  NEW.total_correct := total_correct;
  NEW.total_wrong := total_wrong;
  NEW.total_unanswered := total_unanswered;
  NEW.score := calculated_score;
  NEW.passed := calculated_score >= exam_passing_score;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_calculate_exam_score
BEFORE UPDATE ON public.exam_attempts
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status = 'in_progress')
EXECUTE FUNCTION public.calculate_exam_score();

-- Function para atualizar progresso do usuário
CREATE OR REPLACE FUNCTION public.update_certification_progress()
RETURNS TRIGGER AS $$
DECLARE
  cert financial_certification;
  stats RECORD;
BEGIN
  -- Pegar certificação do exame
  SELECT fe.certification INTO cert
  FROM public.financial_exams fe WHERE fe.id = NEW.exam_id;
  
  -- Calcular estatísticas
  SELECT 
    COUNT(*) as total_exams,
    COUNT(*) FILTER (WHERE passed = true) as passed_exams,
    AVG(score) as avg_score,
    MAX(score) as max_score,
    SUM(total_correct) as total_correct,
    SUM(total_correct + total_wrong + total_unanswered) as total_questions
  INTO stats
  FROM public.exam_attempts
  WHERE user_id = NEW.user_id 
    AND exam_id IN (SELECT id FROM public.financial_exams WHERE certification = cert)
    AND status = 'completed';
  
  -- Upsert progresso
  INSERT INTO public.certification_progress (
    user_id, certification, exams_completed, exams_passed,
    average_score, best_score, total_questions_answered, correct_answers,
    estimated_readiness
  ) VALUES (
    NEW.user_id, cert, stats.total_exams, stats.passed_exams,
    stats.avg_score, stats.max_score, stats.total_questions, stats.total_correct,
    LEAST(stats.avg_score * 1.1, 100) -- Estimativa de preparo
  )
  ON CONFLICT (user_id, certification) DO UPDATE SET
    exams_completed = EXCLUDED.exams_completed,
    exams_passed = EXCLUDED.exams_passed,
    average_score = EXCLUDED.average_score,
    best_score = EXCLUDED.best_score,
    total_questions_answered = EXCLUDED.total_questions_answered,
    correct_answers = EXCLUDED.correct_answers,
    estimated_readiness = EXCLUDED.estimated_readiness,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_certification_progress
AFTER UPDATE ON public.exam_attempts
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.update_certification_progress();

-- Function para atualizar contador de questões no banco
CREATE OR REPLACE FUNCTION public.update_question_bank_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.question_banks SET total_questions = total_questions + 1 WHERE id = NEW.bank_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.question_banks SET total_questions = total_questions - 1 WHERE id = OLD.bank_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_question_count
AFTER INSERT OR DELETE ON public.financial_questions
FOR EACH ROW EXECUTE FUNCTION public.update_question_bank_count();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certification_progress;