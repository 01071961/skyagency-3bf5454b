import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wallet, ArrowDownToLine, Clock, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, ArrowRight,
  BanknoteIcon, TrendingUp, History, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  payment_method: string;
  rejected_reason?: string;
  created_at: string;
  processed_at?: string;
}

interface AffiliateInfo {
  available_balance: number;
  pix_key: string | null;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
}

const MIN_WITHDRAWAL = 50;

export default function VIPWithdrawals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/withdrawals');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) return;

      const res = await supabase.functions.invoke('withdrawal-actions', {
        body: { action: 'history' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setWithdrawals(res.data.withdrawals || []);
        setAffiliate(res.data.affiliate);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < MIN_WITHDRAWAL) {
      toast({
        title: 'Valor inválido',
        description: `O valor mínimo para saque é R$ ${MIN_WITHDRAWAL.toFixed(2)}`,
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

    if (!affiliate?.pix_key && !affiliate?.stripe_account_id) {
      toast({
        title: 'Conta não configurada',
        description: 'Configure sua chave PIX antes de solicitar saque.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRequesting(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) return;

      const res = await supabase.functions.invoke('withdrawal-actions', {
        body: { action: 'request', amount },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        if (res.data.needsBankSetup) {
          toast({
            title: 'Configure sua conta',
            description: res.data.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Solicitação enviada!',
            description: res.data.message || 'Sua solicitação aguarda aprovação do administrador.',
          });
          setWithdrawDialogOpen(false);
          setWithdrawAmount('');
          loadData();
        }
      } else {
        throw new Error(res.data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Aprovação
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');
  const canWithdraw = (affiliate?.available_balance || 0) >= MIN_WITHDRAWAL && 
                      (affiliate?.pix_key || affiliate?.stripe_account_id) &&
                      !hasPendingWithdrawal;

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Você não é um afiliado</h2>
            <p className="text-muted-foreground mb-4">
              Cadastre-se como afiliado para solicitar saques de comissões.
            </p>
            <Button onClick={() => navigate('/vip/affiliate/register')}>
              Tornar-se Afiliado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Meus Saques
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas solicitações de saque
          </p>
        </div>
        <Button 
          onClick={loadData}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Balance Card - Hotmart Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#5e3bff]/20 via-[#a855f7]/10 to-[#ec4899]/10 border-[#5e3bff]/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ic3RhcnMiIHg9IjAiIHk9IjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3N0YXJzKSIvPjwvc3ZnPg==')] opacity-50" />
          <CardContent className="relative pt-6 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Saldo Disponível para Saque
                </p>
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#a855f7] to-[#5e3bff] bg-clip-text text-transparent">
                  R$ {affiliate.available_balance.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Mínimo para saque: R$ {MIN_WITHDRAWAL.toFixed(2)}
                </p>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Button 
                  onClick={() => setWithdrawDialogOpen(true)}
                  disabled={!canWithdraw}
                  size="lg"
                  className="bg-gradient-to-r from-[#5e3bff] to-[#a855f7] hover:from-[#4c2ed9] hover:to-[#9333ea] text-white shadow-lg shadow-[#5e3bff]/25"
                >
                  <ArrowDownToLine className="mr-2 h-5 w-5" />
                  Solicitar Saque
                </Button>
                
                {hasPendingWithdrawal && (
                  <p className="text-xs text-amber-400 text-center">
                    Você já tem uma solicitação pendente
                  </p>
                )}
                
                {!affiliate.pix_key && !affiliate.stripe_account_id && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/vip/bank-settings')}
                    className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    Configurar Chave PIX
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {withdrawals.filter(w => w.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sacado</p>
                  <p className="text-2xl font-bold text-foreground">
                    R$ {withdrawals
                      .filter(w => w.status === 'completed')
                      .reduce((sum, w) => sum + w.net_amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saques Aprovados</p>
                  <p className="text-2xl font-bold text-foreground">
                    {withdrawals.filter(w => w.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Withdrawal History */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Saques
          </CardTitle>
          <CardDescription>
            Acompanhe suas solicitações de saque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BanknoteIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não fez nenhum saque</p>
              <p className="text-sm">Quando solicitar um saque, ele aparecerá aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      withdrawal.status === 'completed' ? 'bg-emerald-500/10' :
                      withdrawal.status === 'rejected' ? 'bg-red-500/10' :
                      'bg-amber-500/10'
                    }`}>
                      {withdrawal.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : withdrawal.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Saque via {withdrawal.payment_method === 'pix' ? 'PIX' : 'Stripe'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(withdrawal.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {withdrawal.rejected_reason && (
                        <p className="text-xs text-red-400 mt-1">
                          Motivo: {withdrawal.rejected_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        R$ {withdrawal.net_amount.toFixed(2)}
                      </p>
                      {withdrawal.fee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Taxa: R$ {withdrawal.fee.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
              Solicitar Saque
            </DialogTitle>
            <DialogDescription>
              Seu saque será processado após aprovação do administrador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertDescription className="text-sm">
                Saldo disponível: <strong className="text-primary">R$ {affiliate.available_balance.toFixed(2)}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque (R$)</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Mínimo: R$ ${MIN_WITHDRAWAL.toFixed(2)}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={MIN_WITHDRAWAL}
                max={affiliate.available_balance}
                step="0.01"
                className="text-lg font-medium"
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor solicitado:</span>
                <span>R$ {parseFloat(withdrawAmount || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa:</span>
                <span className="text-emerald-500">Grátis</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-medium">
                <span>Você receberá:</span>
                <span className="text-primary text-lg">R$ {parseFloat(withdrawAmount || '0').toFixed(2)}</span>
              </div>
            </div>

            {affiliate.pix_key && (
              <div className="text-sm text-muted-foreground">
                <p>Pagamento via PIX para:</p>
                <p className="font-mono text-foreground">{affiliate.pix_key}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestWithdrawal}
              disabled={isRequesting || !withdrawAmount || parseFloat(withdrawAmount) < MIN_WITHDRAWAL}
              className="bg-gradient-to-r from-[#5e3bff] to-[#a855f7] hover:from-[#4c2ed9] hover:to-[#9333ea]"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Confirmar Saque
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
