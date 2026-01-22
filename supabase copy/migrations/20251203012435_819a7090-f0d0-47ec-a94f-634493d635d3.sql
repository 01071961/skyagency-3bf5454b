-- Tabela para armazenar mensagens de contato
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'contact', -- 'contact', 'vip', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Política para inserção pública (qualquer pessoa pode enviar mensagem)
CREATE POLICY "Anyone can submit contact form" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Criar índice para buscas por data
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;