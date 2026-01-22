-- ==============================================
-- FIX: Corrige recursão infinita na tabela tenant_members
-- ==============================================

-- 1. Dropar funções existentes antes de recriar
DROP FUNCTION IF EXISTS public.is_tenant_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_tenant_admin_or_owner(uuid, uuid);

-- 2. Criar função SECURITY DEFINER para verificar membership
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_owner(p_tenant_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- 3. Criar função para verificar se usuário é membro de um tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
  )
$$;

-- 4. Drop das políticas problemáticas
DROP POLICY IF EXISTS "Tenant admins can manage members" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can view tenant members" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "Users can delete own memberships" ON public.tenant_members;

-- 5. Recriar políticas sem recursão usando as funções SECURITY DEFINER
-- Política para SELECT: usuários podem ver suas próprias memberships e membros de seus tenants
CREATE POLICY "tenant_members_select_policy"
ON public.tenant_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_tenant_member(tenant_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Política para INSERT: admins do tenant ou admins globais podem adicionar membros
CREATE POLICY "tenant_members_insert_policy"
ON public.tenant_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR public.is_tenant_admin_or_owner(tenant_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Política para UPDATE: usuários podem atualizar próprias memberships ou admins do tenant
CREATE POLICY "tenant_members_update_policy"
ON public.tenant_members
FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.is_tenant_admin_or_owner(tenant_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Política para DELETE: usuários podem deletar próprias memberships ou admins do tenant
CREATE POLICY "tenant_members_delete_policy"
ON public.tenant_members
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.is_tenant_admin_or_owner(tenant_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);