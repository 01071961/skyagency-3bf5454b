-- Create table for evaluation questions (provas, quizzes)
CREATE TABLE public.avaliacao_questoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',
  topic TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avaliacao_questoes ENABLE ROW LEVEL SECURITY;

-- Admin can manage all questions
CREATE POLICY "Admins can manage evaluation questions"
ON public.avaliacao_questoes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can view questions for their enrolled courses
CREATE POLICY "Users can view questions for enrolled courses"
ON public.avaliacao_questoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avaliacoes a
    JOIN public.enrollments e ON e.product_id = a.product_id
    WHERE a.id = avaliacao_id
    AND e.user_id = auth.uid()
    AND e.status = 'active'
  )
);

-- Add certificate_id column to avaliacoes table
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS certificate_template_id UUID REFERENCES public.certificate_templates(id);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS generates_certificate BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_avaliacao_questoes_avaliacao_id ON public.avaliacao_questoes(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_questoes_position ON public.avaliacao_questoes(avaliacao_id, position);