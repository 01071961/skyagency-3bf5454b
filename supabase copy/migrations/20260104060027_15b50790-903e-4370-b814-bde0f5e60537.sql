-- =====================================================
-- Sistema de Avaliações e Notas para TechCursos
-- =====================================================

-- Tabela de Avaliações (provas, trabalhos, etc.)
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modulo_id UUID REFERENCES public.product_modules(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'prova', -- prova, trabalho, quiz, projeto
  peso NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (peso > 0 AND peso <= 3),
  data_aplicacao DATE,
  nota_maxima NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  nota_minima_aprovacao NUMERIC(5,2) NOT NULL DEFAULT 6.0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Notas dos Alunos
CREATE TABLE IF NOT EXISTS public.notas_alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nota NUMERIC(5,2) CHECK (nota >= 0),
  observacoes TEXT,
  lancado_por UUID,
  lancado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(avaliacao_id, user_id)
);

-- Tabela para Frequência dos Alunos por Módulo
CREATE TABLE IF NOT EXISTS public.frequencia_alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modulo_id UUID NOT NULL REFERENCES public.product_modules(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  aulas_totais INTEGER NOT NULL DEFAULT 0,
  aulas_presentes INTEGER NOT NULL DEFAULT 0,
  frequencia_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN aulas_totais > 0 THEN (aulas_presentes::NUMERIC / aulas_totais * 100) ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, modulo_id)
);

-- Tabela para Histórico Escolar Consolidado
CREATE TABLE IF NOT EXISTS public.historico_modulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modulo_id UUID NOT NULL REFERENCES public.product_modules(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_final NUMERIC(5,2),
  frequencia NUMERIC(5,2) DEFAULT 100,
  situacao TEXT DEFAULT 'cursando', -- aprovado, reprovado, cursando
  conceito TEXT, -- A, B, C, D, F
  nota_manual NUMERIC(5,2), -- Para quando não há avaliações
  data_conclusao DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, modulo_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_modulo ON public.avaliacoes(modulo_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_product ON public.avaliacoes(product_id);
CREATE INDEX IF NOT EXISTS idx_notas_avaliacao ON public.notas_alunos(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_notas_user ON public.notas_alunos(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_user ON public.historico_modulos(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_product ON public.historico_modulos(product_id);

-- Enable RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencia_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_modulos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para avaliacoes
CREATE POLICY "Admins can manage avaliacoes" ON public.avaliacoes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view avaliacoes" ON public.avaliacoes
  FOR SELECT USING (is_active = true);

-- Políticas RLS para notas_alunos  
CREATE POLICY "Admins can manage all notas" ON public.notas_alunos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view own notas" ON public.notas_alunos
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas RLS para frequencia_alunos
CREATE POLICY "Admins can manage frequencia" ON public.frequencia_alunos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view own frequencia" ON public.frequencia_alunos
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas RLS para historico_modulos
CREATE POLICY "Admins can manage historico" ON public.historico_modulos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view own historico" ON public.historico_modulos
  FOR SELECT USING (auth.uid() = user_id);

-- Função para calcular média ponderada do módulo
CREATE OR REPLACE FUNCTION public.calcular_media_modulo(p_user_id UUID, p_modulo_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_soma_ponderada NUMERIC := 0;
  v_soma_pesos NUMERIC := 0;
  v_media NUMERIC := NULL;
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT n.nota, a.peso 
    FROM notas_alunos n
    JOIN avaliacoes a ON a.id = n.avaliacao_id
    WHERE n.user_id = p_user_id 
      AND a.modulo_id = p_modulo_id
      AND n.nota IS NOT NULL
  LOOP
    v_soma_ponderada := v_soma_ponderada + (rec.nota * rec.peso);
    v_soma_pesos := v_soma_pesos + rec.peso;
  END LOOP;
  
  IF v_soma_pesos > 0 THEN
    v_media := ROUND(v_soma_ponderada / v_soma_pesos, 2);
  END IF;
  
  RETURN v_media;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função para determinar conceito baseado na nota
CREATE OR REPLACE FUNCTION public.nota_para_conceito(nota NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF nota IS NULL THEN RETURN NULL; END IF;
  IF nota >= 9.0 THEN RETURN 'A';
  ELSIF nota >= 7.5 THEN RETURN 'B';
  ELSIF nota >= 6.0 THEN RETURN 'C';
  ELSIF nota >= 4.0 THEN RETURN 'D';
  ELSE RETURN 'F';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Função para atualizar histórico do módulo após lançamento de nota
CREATE OR REPLACE FUNCTION public.atualizar_historico_modulo()
RETURNS TRIGGER AS $$
DECLARE
  v_modulo_id UUID;
  v_product_id UUID;
  v_media NUMERIC;
  v_frequencia NUMERIC;
  v_situacao TEXT;
  v_conceito TEXT;
BEGIN
  -- Buscar modulo_id e product_id da avaliação
  SELECT a.modulo_id, a.product_id INTO v_modulo_id, v_product_id
  FROM avaliacoes a WHERE a.id = NEW.avaliacao_id;
  
  IF v_modulo_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular média ponderada
  v_media := calcular_media_modulo(NEW.user_id, v_modulo_id);
  
  -- Buscar frequência
  SELECT frequencia_percent INTO v_frequencia
  FROM frequencia_alunos
  WHERE user_id = NEW.user_id AND modulo_id = v_modulo_id;
  
  v_frequencia := COALESCE(v_frequencia, 100);
  
  -- Determinar situação
  IF v_media IS NOT NULL THEN
    IF v_media >= 6.0 AND v_frequencia >= 75 THEN
      v_situacao := 'aprovado';
    ELSIF v_media < 6.0 OR v_frequencia < 75 THEN
      v_situacao := 'reprovado';
    ELSE
      v_situacao := 'cursando';
    END IF;
  ELSE
    v_situacao := 'cursando';
  END IF;
  
  v_conceito := nota_para_conceito(v_media);
  
  -- Upsert no histórico
  INSERT INTO historico_modulos (user_id, modulo_id, product_id, media_final, frequencia, situacao, conceito)
  VALUES (NEW.user_id, v_modulo_id, v_product_id, v_media, v_frequencia, v_situacao, v_conceito)
  ON CONFLICT (user_id, modulo_id) DO UPDATE SET
    media_final = EXCLUDED.media_final,
    situacao = EXCLUDED.situacao,
    conceito = EXCLUDED.conceito,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar histórico após lançamento de nota
DROP TRIGGER IF EXISTS trigger_atualizar_historico ON public.notas_alunos;
CREATE TRIGGER trigger_atualizar_historico
  AFTER INSERT OR UPDATE ON public.notas_alunos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_historico_modulo();

-- Função para obter estatísticas de avaliações pendentes
CREATE OR REPLACE FUNCTION public.get_avaliacoes_pendentes()
RETURNS TABLE (
  avaliacao_id UUID,
  titulo TEXT,
  modulo_nome TEXT,
  total_alunos BIGINT,
  notas_lancadas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as avaliacao_id,
    a.titulo,
    pm.name as modulo_nome,
    COUNT(DISTINCT e.user_id) as total_alunos,
    COUNT(DISTINCT n.user_id) as notas_lancadas
  FROM avaliacoes a
  JOIN product_modules pm ON pm.id = a.modulo_id
  JOIN enrollments e ON e.product_id = a.product_id AND e.status = 'active'
  LEFT JOIN notas_alunos n ON n.avaliacao_id = a.id
  WHERE a.is_active = true
  GROUP BY a.id, a.titulo, pm.name
  HAVING COUNT(DISTINCT e.user_id) > COUNT(DISTINCT n.user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;