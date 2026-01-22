import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Gift, DollarSign, Link2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import Layout from '@/components/Layout';

interface Invite {
  id: string;
  email: string;
  name: string | null;
  program_id: string | null;
  commission_rate: number;
  status: string;
  invited_by: string | null;
  program?: {
    name: string;
    description: string;
  };
}

export default function AffiliateAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState({ bank: '', agency: '', account: '' });
  const [accepted, setAccepted] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loadInvite();
    } else {
      setError('Token de convite não encontrado');
      setIsLoading(false);
    }
  }, [token]);

  const loadInvite = async () => {
    try {
      setIsLoading(true);
      
      const { data: inviteData, error: inviteError } = await supabase
        .from('affiliate_invites')
        .select(`
          *,
          program:program_id (name, description)
        `)
        .eq('token', token)
        .single();

      if (inviteError || !inviteData) {
        setError('Convite não encontrado ou inválido');
        return;
      }

      if (inviteData.status === 'accepted') {
        setError('Este convite já foi aceito');
        return;
      }

      if (inviteData.status === 'expired' || new Date(inviteData.expires_at) < new Date()) {
        setError('Este convite expirou');
        return;
      }

      setInvite(inviteData as Invite);
    } catch (err) {
      console.error('Erro ao carregar convite:', err);
      setError('Erro ao carregar convite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invite) return;

    // Check if user is logged in
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login ou crie uma conta para aceitar o convite.',
      });
      navigate(`/auth?redirect=/affiliate/accept?token=${token}`);
      return;
    }

    // Check email match
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    if (profile?.email !== invite.email) {
      toast({
        title: 'Email não corresponde',
        description: 'Faça login com o email que recebeu o convite.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAccepting(true);

      // Generate referral code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let referralCode = 'SKY-';
      for (let i = 0; i < 6; i++) {
        referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Create affiliate
      const { data: affiliate, error: affiliateError } = await supabase
        .from('vip_affiliates')
        .insert({
          user_id: user.id,
          referral_code: referralCode,
          commission_rate: invite.commission_rate,
          program_id: invite.program_id,
          invited_by: invite.invited_by,
          invite_id: invite.id,
          bank_info: bankInfo.bank ? bankInfo : null,
          status: 'approved', // Auto-approve invited affiliates
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (affiliateError) throw affiliateError;

      // Update invite status
      await supabase
        .from('affiliate_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', invite.id);

      setAccepted(true);
      toast({
        title: 'Convite aceito!',
        description: 'Você agora é um afiliado SKY BRASIL.',
      });

    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Não foi possível aceitar o convite.',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Convite Inválido</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (accepted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo!</h2>
                <p className="text-muted-foreground mb-6">
                  Você agora é um afiliado SKY BRASIL com <strong className="text-primary">{invite?.commission_rate}%</strong> de comissão!
                </p>
                <Button onClick={() => navigate('/vip/referrals')} className="w-full">
                  Acessar Painel de Afiliado
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Convite para Afiliado</CardTitle>
                <CardDescription>
                  Você foi convidado para se tornar um afiliado SKY BRASIL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-500">{invite?.commission_rate}%</p>
                    <p className="text-sm text-muted-foreground">Comissão por venda</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <Link2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-blue-500">Link Exclusivo</p>
                    <p className="text-sm text-muted-foreground">Para divulgação</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                    <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-purple-500">Relatórios</p>
                    <p className="text-sm text-muted-foreground">Em tempo real</p>
                  </div>
                </div>

                {invite?.program && (
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-semibold text-foreground mb-1">{invite.program.name}</h3>
                    {invite.program.description && (
                      <p className="text-sm text-muted-foreground">{invite.program.description}</p>
                    )}
                  </div>
                )}

                {user ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Dados Bancários (opcional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Para receber suas comissões. Pode adicionar depois.
                      </p>
                      <Input
                        placeholder="Banco (ex: Nubank, Itaú)"
                        value={bankInfo.bank}
                        onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Agência"
                          value={bankInfo.agency}
                          onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                        />
                        <Input
                          placeholder="Conta"
                          value={bankInfo.account}
                          onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleAccept}
                      disabled={isAccepting}
                      className="w-full"
                      size="lg"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Aceitar Convite'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-muted-foreground">
                      Faça login ou crie uma conta com o email <strong>{invite?.email}</strong> para aceitar o convite.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/auth?redirect=/affiliate/accept?token=${token}`)}
                        className="flex-1"
                      >
                        Fazer Login
                      </Button>
                      <Button
                        onClick={() => navigate(`/auth?tab=signup&redirect=/affiliate/accept?token=${token}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        Criar Conta
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
