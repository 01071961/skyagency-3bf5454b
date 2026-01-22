-- Tabela para tentativas de quiz de aulas
CREATE TABLE public.lesson_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.product_lessons(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  answers JSONB DEFAULT '{}'::jsonb,
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  passed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para certificados emitidos
CREATE TABLE public.course_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  validation_code TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_hours INTEGER DEFAULT 0,
  final_score NUMERIC(5,2),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de quiz às aulas
ALTER TABLE public.product_lessons
ADD COLUMN IF NOT EXISTS quiz_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quiz_passing_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS quiz_time_limit INTEGER,
ADD COLUMN IF NOT EXISTS quiz_required BOOLEAN DEFAULT false;

-- Índices para performance
CREATE INDEX idx_lesson_quiz_attempts_user ON public.lesson_quiz_attempts(user_id);
CREATE INDEX idx_lesson_quiz_attempts_lesson ON public.lesson_quiz_attempts(lesson_id);
CREATE INDEX idx_course_certificates_user ON public.course_certificates(user_id);
CREATE INDEX idx_course_certificates_product ON public.course_certificates(product_id);
CREATE INDEX idx_course_certificates_validation ON public.course_certificates(validation_code);

-- RLS para lesson_quiz_attempts
ALTER TABLE public.lesson_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
ON public.lesson_quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz attempts"
ON public.lesson_quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts"
ON public.lesson_quiz_attempts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON public.lesson_quiz_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS para course_certificates
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
ON public.course_certificates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own certificates"
ON public.course_certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates"
ON public.course_certificates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can verify certificates by code"
ON public.course_certificates
FOR SELECT
USING (true);

-- Função para gerar código de validação único
CREATE OR REPLACE FUNCTION generate_certificate_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;