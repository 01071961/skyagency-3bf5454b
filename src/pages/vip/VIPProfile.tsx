import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Key, Save, Crown, Diamond,
  Shield, Bell, LogOut, Trash2, CheckCircle, Edit, 
  Briefcase, GraduationCap, TrendingUp, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useRealtimeProfile } from '@/hooks/useRealtimeProfile';
import InputMask from 'react-input-mask';

const tierConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  bronze: { color: 'from-amber-600 to-amber-800', bgColor: 'bg-amber-500/10', label: 'Bronze', icon: <Star className="h-5 w-5" /> },
  silver: { color: 'from-slate-400 to-slate-600', bgColor: 'bg-slate-400/10', label: 'Prata', icon: <Star className="h-5 w-5" /> },
  gold: { color: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-500/10', label: 'Ouro', icon: <Crown className="h-5 w-5" /> },
  diamond: { color: 'from-cyan-400 to-blue-600', bgColor: 'bg-cyan-400/10', label: 'Diamante', icon: <Diamond className="h-5 w-5" /> },
  platinum: { color: 'from-violet-400 to-purple-600', bgColor: 'bg-violet-400/10', label: 'Platinum', icon: <Diamond className="h-5 w-5" /> },
};

const tierProgress = {
  bronze: { min: 0, max: 500, next: 'silver' },
  silver: { min: 500, max: 2000, next: 'gold' },
  gold: { min: 2000, max: 5000, next: 'diamond' },
  diamond: { min: 5000, max: 10000, next: 'platinum' },
  platinum: { min: 10000, max: 999999, next: null },
};

export default function VIPProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile, tierInfo, displayName, isLoading: profileLoading, currentTierConfig, refetch } = useRealtimeProfile();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    headline: '',
    bio: '',
    location: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_marketing: true,
    email_orders: true,
    email_rewards: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/profile');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          headline: formData.headline,
          bio: formData.bio,
          location: formData.location,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      await refetch();
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email || user?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Calculate tier progress
  const currentTierProgress = tierProgress[tierInfo.tier as keyof typeof tierProgress] || tierProgress.bronze;
  const progressPercent = Math.min(100, ((tierInfo.totalPoints - currentTierProgress.min) / (currentTierProgress.max - currentTierProgress.min)) * 100);

  if (authLoading || profileLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with Tier */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações e preferências
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/vip/profile/edit')}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Perfil Avançado
          </Button>
          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${tierConfig[tierInfo.tier]?.color || tierConfig.bronze.color} text-white flex items-center gap-2`}>
            {tierConfig[tierInfo.tier]?.icon || tierConfig.bronze.icon}
            <span className="font-semibold capitalize">{tierConfig[tierInfo.tier]?.label || 'Bronze'}</span>
            <span className="text-white/80">• {tierInfo.points} pts</span>
          </div>
        </div>
      </div>
      
      {/* Quick Link to Advanced Profile */}
      <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Perfil Profissional Completo</p>
                <p className="text-sm text-muted-foreground">
                  Adicione experiências, formação e habilidades estilo LinkedIn
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/vip/profile/edit')}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Editar Perfil Completo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  value={profile.email || user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                'Salvando...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie sua senha e segurança da conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Senha</p>
                  <p className="text-sm text-muted-foreground">
                    Última alteração: desconhecido
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handlePasswordReset}>
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure suas preferências de comunicação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Emails de Marketing</p>
                <p className="text-sm text-muted-foreground">
                  Novidades, promoções e ofertas especiais
                </p>
              </div>
              <Switch
                checked={notifications.email_marketing}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_marketing: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Emails de Pedidos</p>
                <p className="text-sm text-muted-foreground">
                  Confirmações de compra e atualizações
                </p>
              </div>
              <Switch
                checked={notifications.email_orders}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_orders: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Emails de Recompensas</p>
                <p className="text-sm text-muted-foreground">
                  Alertas sobre pontos e resgates
                </p>
              </div>
              <Switch
                checked={notifications.email_rewards}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, email_rewards: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tier Progress */}
            {currentTierProgress.next && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso para {tierConfig[currentTierProgress.next]?.label || currentTierProgress.next}</span>
                  <span>{tierInfo.totalPoints}/{currentTierProgress.max} pts</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold text-primary">{tierInfo.points}</p>
                <p className="text-sm text-muted-foreground">Pontos Atuais</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold text-green-500">{tierInfo.totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Acumulado</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold text-foreground capitalize">{tierConfig[tierInfo.tier]?.label || 'Bronze'}</p>
                <p className="text-sm text-muted-foreground">Tier Atual</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold text-foreground">{tierInfo.referralCount}</p>
                <p className="text-sm text-muted-foreground">Indicações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis da conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sair da Conta</p>
                <p className="text-sm text-muted-foreground">
                  Encerrar sua sessão atual
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
