-- Verificar e recriar as políticas RLS para abandoned_forms
-- Garantir que apenas admins podem ler/atualizar/deletar
-- E que INSERT anônimo não expõe dados existentes

-- Primeiro, remover políticas existentes para recriar de forma segura
DROP POLICY IF EXISTS "Anyone can insert abandoned forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Admins can view abandoned forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Admins can update abandoned forms" ON public.abandoned_forms;
DROP POLICY IF EXISTS "Admins can delete abandoned forms" ON public.abandoned_forms;

-- Recriar política de INSERT que não retorna dados após inserção
-- Usando WITH CHECK para validar apenas a inserção, sem expor dados
CREATE POLICY "Public can insert abandoned forms"
ON public.abandoned_forms
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Políticas de leitura APENAS para admins autenticados
CREATE POLICY "Only admins can view abandoned forms"
ON public.abandoned_forms
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas de atualização APENAS para admins
CREATE POLICY "Only admins can update abandoned forms"
ON public.abandoned_forms
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Políticas de exclusão APENAS para admins
CREATE POLICY "Only admins can delete abandoned forms"
ON public.abandoned_forms
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));