import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Copy, Share2, TrendingUp, Wallet,
  CheckCircle, Clock, AlertCircle, ArrowRight,
  DollarSign, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Affiliate {
  id: string;
  status: string;
  tier: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  available_balance: number;
  withdrawn_balance: number;
  pix_key: string | null;
}

interface Referral {
  id: string;
  status: string;
  referred_email: string | null;
  created_at: string;
  converted_at: string | null;
}

interface Commission {
  id: string;
  order_total: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
}

const tierConfig = {
  bronze: { min: 0, rate: 5, color: 'from-amber-600 to-amber-800' },
  silver: { min: 10, rate: 8, color: 'from-slate-400 to-slate-600' },
  gold: { min: 25, rate: 10, color: 'from-yellow-400 to-yellow-600' },
  diamond: { min: 50, rate: 15, color: 'from-cyan-400 to-blue-600' },
};

export default function VIPReferrals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/referrals');
      return;
    }

    if (user) {
      loadAffiliateData();
    }
  }, [user, authLoading, navigate]);

  const loadAffiliateData = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        console.log('[VIPReferrals] Sem token de autenticação');
        navigate('/auth?redirect=/vip/referrals');
        return;
      }

      const res = await supabase.functions.invoke('affiliate-actions', {
        body: { action: 'get_stats' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setAffiliate(res.data.affiliate);
        setReferrals(res.data.referrals || []);
        setCommissions(res.data.commissions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (affiliate?.referral_code) {
      const link = `${window.location.origin}/?ref=${affiliate.referral_code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com seus amigos.',
      });
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50) {
      toast({
        title: 'Valor inválido',
        description: 'O valor mínimo para saque é R$ 50,00.',
        variant: 'destructive',
      });
      return;
    }

    if (amount > (affiliate?.available_balance || 0)) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Você não tem saldo suficiente para este saque.',
        variant: 'destructive',
      });
      return;
    }

    const finalPixKey = pixKey || affiliate?.pix_key;
    if (!finalPixKey) {
      toast({
        title: 'Chave PIX obrigatória',
        description: 'Informe sua chave PIX para receber o pagamento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsWithdrawing(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (token) {
        const res = await supabase.functions.invoke('affiliate-actions', {
          body: { action: 'request_withdrawal', amount, pix_key: pixKey || affiliate?.pix_key },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          toast({
            title: 'Saque solicitado!',
            description: 'Seu saque será processado em até 24h úteis.',
          });
          setWithdrawDialogOpen(false);
          setWithdrawAmount('');
          setPixKey('');
          loadAffiliateData();
        } else {
          throw new Error(res.data?.error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar o saque.',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getNextTier = () => {
    if (!affiliate) return null;
    const tiers = Object.entries(tierConfig);
    const currentIndex = tiers.findIndex(([name]) => name === affiliate.tier);
    if (currentIndex < tiers.length - 1) {
      return { name: tiers[currentIndex + 1][0], ...tiers[currentIndex + 1][1] };
    }
    return null;
  };

  const getTierProgress = () => {
    if (!affiliate) return 0;
    const convertedCount = referrals.filter(r => r.status === 'converted').length;
    const currentTier = tierConfig[affiliate.tier as keyof typeof tierConfig];
    const nextTier = getNextTier();
    
    if (!nextTier) return 100;
    
    const progress = ((convertedCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Not an affiliate yet
  if (!affiliate) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Torne-se um Afiliado
            </h2>
            <p className="text-muted-foreground mb-6">
              Indique novos clientes e ganhe comissões de até 15% em cada venda!
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(tierConfig).map(([tier, config]) => (
                <div key={tier} className={`p-4 rounded-lg bg-gradient-to-br ${config.color} text-white`}>
                  <p className="text-2xl font-bold">{config.rate}%</p>
                  <p className="text-sm capitalize">{tier}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => navigate('/vip/affiliate/register')} size="lg">
              Quero ser Afiliado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending approval
  if (affiliate.status === 'pending') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Solicitação em Análise
            </h2>
            <p className="text-muted-foreground mb-6">
              Sua solicitação para se tornar afiliado está sendo analisada.
              Você receberá um email quando for aprovada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programa de Afiliados</h1>
          <p className="text-muted-foreground">
            Comissão atual: {affiliate.commission_rate}% • Tier: {affiliate.tier}
          </p>
        </div>
        <Button onClick={() => setWithdrawDialogOpen(true)} disabled={affiliate.available_balance < 50}>
          <Wallet className="mr-2 h-4 w-4" />
          Solicitar Saque
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {affiliate.available_balance.toFixed(2)}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ganho</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {affiliate.total_earnings.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-background border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Indicados</p>
                  <p className="text-3xl font-bold text-foreground">{referrals.length}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-background border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Convertidos</p>
                  <p className="text-3xl font-bold text-foreground">
                    {referrals.filter(r => r.status === 'converted').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Seu Link de Indicação
            </CardTitle>
            <CardDescription>
              Compartilhe este link para ganhar comissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
              <code className="flex-1 text-sm truncate">
                {`${window.location.origin}/?ref=${affiliate.referral_code}`}
              </code>
              <Button size="sm" variant="outline" onClick={copyReferralLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={copyReferralLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  if (affiliate?.referral_code) {
                    const link = `${window.location.origin}/?ref=${affiliate.referral_code}`;
                    const text = `Confira os melhores cursos e produtos digitais! Use meu link: ${link}`;
                    if (navigator.share) {
                      navigator.share({ title: 'SKY BRASIL', text, url: link });
                    } else {
                      navigator.clipboard.writeText(text);
                      toast({ title: 'Link copiado!', description: 'Texto para compartilhamento copiado.' });
                    }
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        {getNextTier() && (
          <Card>
            <CardHeader>
              <CardTitle>Progresso para Próximo Tier</CardTitle>
              <CardDescription>
                {getNextTier()!.min - referrals.filter(r => r.status === 'converted').length} vendas 
                para {getNextTier()!.name} ({getNextTier()!.rate}% comissão)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={getTierProgress()} className="h-3 mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(tierConfig).map(([tier, config]) => (
                  <div 
                    key={tier}
                    className={`text-center p-2 rounded-lg ${
                      tier === affiliate.tier 
                        ? `bg-gradient-to-br ${config.color} text-white` 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs font-medium capitalize">{tier}</p>
                    <p className="text-sm font-bold">{config.rate}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Commissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Últimas Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.slice(0, 5).map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Venda de R$ {commission.order_total.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(commission.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">
                        +R$ {commission.commission_amount.toFixed(2)}
                      </p>
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma comissão ainda. Compartilhe seu link para começar a ganhar!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
            <DialogDescription>
              Saldo disponível: R$ {affiliate.available_balance.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Valor do Saque</Label>
              <Input
                id="amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                min="50"
                max={affiliate.available_balance}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo: R$ 50,00
              </p>
            </div>
            <div>
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                type="text"
                value={pixKey || affiliate.pix_key || ''}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Informe sua chave PIX para receber o pagamento
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                O valor será depositado via PIX em até 24h úteis após aprovação.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={isWithdrawing || !withdrawAmount || (!pixKey && !affiliate?.pix_key)}
            >
              {isWithdrawing ? 'Processando...' : 'Confirmar Saque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
