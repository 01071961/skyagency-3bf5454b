import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Share2, Gift, CheckCircle, Clock, 
  ArrowRight, UserPlus, Sparkles, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Referral {
  id: string;
  status: string;
  referred_email: string | null;
  created_at: string;
  converted_at: string | null;
}

interface AffiliateData {
  id: string;
  referral_code: string;
  status: string;
}

const WELCOME_BONUS = 5; // Pontos que o convidado ganha
const CONVERSION_BONUS = 10; // Pontos que o afiliado ganha quando convidado compra

export default function VIPInvites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [emailToInvite, setEmailToInvite] = useState('');
  const [isSending, setIsSending] = useState(false);

  const inviteLink = affiliate?.referral_code 
    ? `${window.location.origin}/?ref=${affiliate.referral_code}`
    : '';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/invites');
      return;
    }
    if (user) loadData();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get affiliate data
      const { data: affiliateData } = await supabase
        .from('vip_affiliates')
        .select('id, referral_code, status')
        .eq('user_id', user!.id)
        .single();

      if (affiliateData) {
        setAffiliate(affiliateData);

        // Get referrals
        const { data: referralsData } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('referrer_id', affiliateData.id)
          .order('created_at', { ascending: false });

        setReferrals(referralsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Link copiado!',
      description: 'Compartilhe com seus amigos.',
    });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite SKY BRASIL',
          text: `Use meu link de convite e ganhe ${WELCOME_BONUS} pontos de bônus!`,
          url: inviteLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const sendEmailInvite = async () => {
    if (!emailToInvite || !emailToInvite.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user!.id)
        .single();

      // Send invite email
      await supabase.functions.invoke('referral-notifications', {
        body: {
          type: 'welcome_bonus',
          referrer_id: affiliate?.id,
          referred_email: emailToInvite,
          referred_name: 'Amigo',
          points_earned: WELCOME_BONUS,
        },
      });

      toast({
        title: 'Convite enviado!',
        description: `Email de convite enviado para ${emailToInvite}`,
      });
      setEmailToInvite('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o convite.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Not an affiliate
  if (!affiliate || affiliate.status !== 'approved') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Gift className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Programa de Convites
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Torne-se um afiliado para convidar amigos e ganhar pontos quando eles se cadastrarem e comprarem!
            </p>
            <Button onClick={() => navigate('/vip/affiliate/register')} size="lg">
              Quero ser Afiliado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const convertedReferrals = referrals.filter(r => r.status === 'converted');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Convide Amigos</h1>
        <p className="text-muted-foreground">
          Compartilhe seu link e ganhe pontos quando seus amigos se cadastrarem e comprarem
        </p>
      </div>

      {/* How it Works */}
      <Card className="mb-8 bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <Share2 className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">1. Compartilhe</h3>
              <p className="text-sm text-muted-foreground">
                Envie seu link de convite para amigos
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-7 w-7 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">2. Eles se cadastram</h3>
              <p className="text-sm text-muted-foreground">
                Ganham <strong className="text-purple-500">{WELCOME_BONUS} pontos</strong> de bônus
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Gift className="h-7 w-7 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">3. Você ganha</h3>
              <p className="text-sm text-muted-foreground">
                <strong className="text-green-500">{CONVERSION_BONUS} pontos</strong> + comissão na primeira compra
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Share Link */}
        <Card>
          <CardHeader>
            <CardTitle>Seu Link de Convite</CardTitle>
            <CardDescription>
              Compartilhe este link para convidar amigos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm truncate">{inviteLink}</code>
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button className="flex-1" onClick={shareLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Send Email Invite */}
        <Card>
          <CardHeader>
            <CardTitle>Convidar por Email</CardTitle>
            <CardDescription>
              Envie um convite diretamente para o email do seu amigo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={emailToInvite}
                onChange={(e) => setEmailToInvite(e.target.value)}
              />
              <Button onClick={sendEmailInvite} disabled={isSending}>
                {isSending ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Seu amigo receberá um email com seu link de convite
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
            <p className="text-sm text-muted-foreground">Total de Convites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{pendingReferrals.length}</p>
            <p className="text-sm text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{convertedReferrals.length}</p>
            <p className="text-sm text-muted-foreground">Convertidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{convertedReferrals.length * CONVERSION_BONUS}</p>
            <p className="text-sm text-muted-foreground">Pontos Ganhos</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Convites</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {referrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        referral.status === 'converted' 
                          ? 'bg-green-500/10' 
                          : 'bg-yellow-500/10'
                      }`}>
                        {referral.status === 'converted' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {referral.referred_email || 'Usuário Convidado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={referral.status === 'converted' ? 'default' : 'secondary'}>
                        {referral.status === 'converted' ? 'Convertido' : 'Pendente'}
                      </Badge>
                      {referral.status === 'converted' && (
                        <p className="text-sm text-green-500 font-medium mt-1">
                          +{CONVERSION_BONUS} pontos
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum convite ainda.</p>
              <p className="text-sm">Compartilhe seu link para começar a ganhar!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
