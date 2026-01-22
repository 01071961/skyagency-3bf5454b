-- Adicionar política de DELETE para moderação (admins, VIPs podem apagar qualquer mensagem, usuários suas próprias)
CREATE POLICY "Moderation delete messages"
ON public.live_chat_messages FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (p.plan = 'vip' OR p.plan = 'premium' OR p.plan = 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);