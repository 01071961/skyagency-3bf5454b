import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Send, Mail, Loader2, CheckCircle, Shield, Crown, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminInviteProps {
  onClose?: () => void;
}

type RoleType = 'editor' | 'admin' | 'owner';

const roleConfig: Record<RoleType, { label: string; icon: typeof Edit; description: string; color: string }> = {
  editor: {
    label: 'Editor',
    icon: Edit,
    description: 'Criar e editar conteúdo, acesso limitado ao dashboard',
    color: 'text-blue-400'
  },
  admin: {
    label: 'Administrador',
    icon: Shield,
    description: 'Gerenciar usuários, afiliados e visualizar transações',
    color: 'text-purple-400'
  },
  owner: {
    label: 'Proprietário',
    icon: Crown,
    description: 'Acesso total: configurações, API keys e convites de owner',
    color: 'text-amber-400'
  }
};

const AdminInvite = ({ onClose }: AdminInviteProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInvites, setSentInvites] = useState<Array<{ email: string; role: RoleType }>>([]);

  const handleSendInvite = async () => {
    if (!email || !name) {
      toast.error('Preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('E-mail inválido');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user's name for the invitation
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user?.id)
        .single();

      // Send invite via edge function with magic link
      const { data, error } = await supabase.functions.invoke('send-role-invite', {
        body: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role,
          inviterName: profile?.name || 'SKY BRASIL'
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Convite enviado com sucesso!', {
        description: `Link mágico enviado para ${email} como ${roleConfig[role].label}`,
      });

      setSentInvites(prev => [...prev, { email, role }]);
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Erro ao enviar convite', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RoleIcon = roleConfig[role].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Convidar Membro da Equipe
          </CardTitle>
          <CardDescription>
            Envie um magic link para adicionar um novo membro com permissões específicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome</Label>
            <Input
              id="invite-name"
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nível de Acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleType)}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleConfig) as RoleType[]).map((r) => {
                  const Icon = roleConfig[r].icon;
                  return (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${roleConfig[r].color}`} />
                        <span>{roleConfig[r].label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <RoleIcon className={`w-5 h-5 mt-0.5 ${roleConfig[role].color}`} />
              <div>
                <p className="font-medium text-foreground">{roleConfig[role].label}</p>
                <p className="text-sm text-muted-foreground">{roleConfig[role].description}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg text-sm">
            <p className="text-primary font-medium">🔐 Magic Link</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
              <li>Um link único será enviado por e-mail</li>
              <li>O convite expira em 7 dias</li>
              <li>Permissões aplicadas automaticamente ao aceitar</li>
            </ul>
          </div>

          <Button
            onClick={handleSendInvite}
            disabled={isSubmitting || !email || !name}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando convite...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Convite como {roleConfig[role].label}
              </>
            )}
          </Button>

          {sentInvites.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-2">Convites enviados:</p>
              <div className="flex flex-wrap gap-2">
                {sentInvites.map((invite, idx) => {
                  const Icon = roleConfig[invite.role].icon;
                  return (
                    <Badge 
                      key={`${invite.email}-${idx}`} 
                      variant="outline" 
                      className="text-green-500 border-green-500/30 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <Icon className={`w-3 h-3 ${roleConfig[invite.role].color}`} />
                      {invite.email}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminInvite;
