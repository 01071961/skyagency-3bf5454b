import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Wallet, DollarSign, Clock, CheckCircle, XCircle, Search, RefreshCw, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PayoutsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch pending commissions
  const { data: pendingCommissions, isLoading: loadingCommissions } = useQuery({
    queryKey: ['admin-pending-commissions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_commissions')
        .select(`
          *,
          vip_affiliates:affiliate_id(referral_code, pix_key)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch pending redemptions
  const { data: pendingRedemptions, isLoading: loadingRedemptions } = useQuery({
    queryKey: ['admin-pending-redemptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards:reward_id(name, type, cash_value)
        `)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch withdrawals
  const { data: withdrawals, isLoading: loadingWithdrawals } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-payout-stats'],
    queryFn: async () => {
      const [commissions, redemptions, withdrawalsData] = await Promise.all([
        supabase.from('affiliate_commissions').select('commission_amount, status'),
        supabase.from('reward_redemptions').select('points_spent, status'),
        supabase.from('withdrawals').select('amount, status')
      ]);

      const pendingCommission = commissions.data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const approvedCommission = commissions.data?.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const pendingRedemption = redemptions.data?.filter(r => r.status === 'pending').length || 0;
      const totalWithdrawals = withdrawalsData.data?.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0) || 0;

      return {
        pendingCommission,
        approvedCommission,
        pendingRedemption,
        totalWithdrawals
      };
    }
  });

  // Approve commission mutation - also adds to affiliate balance
  const approveCommissionMutation = useMutation({
    mutationFn: async ({ id, affiliateId, amount }: { id: string; affiliateId: string; amount: number }) => {
      // Update commission status
      const { error: commissionError } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'approved' })
        .eq('id', id);
      if (commissionError) throw commissionError;

      // Add to affiliate's available balance
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('available_balance')
        .eq('id', affiliateId)
        .single();

      if (affiliate) {
        const { error: balanceError } = await supabase
          .from('vip_affiliates')
          .update({ available_balance: (affiliate.available_balance || 0) + amount })
          .eq('id', affiliateId);
        if (balanceError) throw balanceError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payout-stats'] });
      toast({ title: 'Comissão aprovada!', description: 'O valor foi liberado para saque e adicionado ao saldo do afiliado.' });
    }
  });

  // Process redemption mutation
  const processRedemptionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const status = action === 'approve' ? 'completed' : 'cancelled';
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ 
          status,
          completed_at: action === 'approve' ? new Date().toISOString() : null,
          cancelled_reason: action === 'reject' ? 'Rejeitado pelo administrador' : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payout-stats'] });
      toast({
        title: action === 'approve' ? 'Resgate aprovado!' : 'Resgate rejeitado',
        description: action === 'approve' ? 'O resgate foi processado.' : 'Os pontos foram devolvidos.'
      });
    }
  });

  // Process withdrawal mutation
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'complete' | 'reject' }) => {
      const status = action === 'complete' ? 'completed' : 'rejected';
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status,
          processed_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payout-stats'] });
      toast({
        title: action === 'complete' ? 'Saque processado!' : 'Saque rejeitado',
        description: action === 'complete' ? 'O pagamento foi enviado.' : 'O saque foi cancelado.'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
      case 'approved': return <Badge className="bg-blue-500/20 text-blue-400">Aprovado</Badge>;
      case 'paid': case 'completed': return <Badge className="bg-green-500/20 text-green-400">Pago</Badge>;
      case 'cancelled': case 'rejected': return <Badge className="bg-red-500/20 text-red-400">Cancelado</Badge>;
      case 'processing': return <Badge className="bg-purple-500/20 text-purple-400">Processando</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">PIX & Pagamentos</h2>
          <p className="text-muted-foreground">Gerencie comissões, resgates e saques</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              R$ {(stats?.pendingCommission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comissões Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              R$ {(stats?.approvedCommission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Liberado para saque</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resgates Pendentes</CardTitle>
            <Wallet className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats?.pendingRedemption || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {(stats?.totalWithdrawals || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Saques processados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="redemptions">Resgates</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
        </TabsList>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Comissões de Afiliados</CardTitle>
              <CardDescription>Aprove ou rejeite comissões pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loadingCommissions ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Total Pedido</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCommissions?.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {(commission.vip_affiliates as any)?.profiles?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(commission.vip_affiliates as any)?.referral_code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {commission.order_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          R$ {commission.order_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-green-400 font-bold">
                          R$ {commission.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission.status || 'pending')}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(commission.created_at || ''), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {commission.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveCommissionMutation.mutate({
                                  id: commission.id,
                                  affiliateId: commission.affiliate_id,
                                  amount: Number(commission.commission_amount)
                                })}
                                disabled={approveCommissionMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemptions Tab */}
        <TabsContent value="redemptions">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Resgates de Pontos</CardTitle>
              <CardDescription>Processe resgates de recompensas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRedemptions ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recompensa</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRedemptions?.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-medium">
                          {(redemption.rewards as any)?.name}
                        </TableCell>
                        <TableCell className="text-primary font-bold">
                          {redemption.points_spent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-green-400">
                          {(redemption.rewards as any)?.cash_value 
                            ? `R$ ${(redemption.rewards as any).cash_value.toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(redemption.status || 'pending')}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(redemption.created_at || ''), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {redemption.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => processRedemptionMutation.mutate({ id: redemption.id, action: 'approve' })}
                                disabled={processRedemptionMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Processar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => processRedemptionMutation.mutate({ id: redemption.id, action: 'reject' })}
                                disabled={processRedemptionMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Histórico de Saques</CardTitle>
              <CardDescription>Saques processados e pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWithdrawals ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals?.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-mono text-xs">
                          {withdrawal.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          R$ {(withdrawal.fee || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-green-400 font-bold">
                          R$ {withdrawal.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{withdrawal.payment_method.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(withdrawal.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => processWithdrawalMutation.mutate({ id: withdrawal.id, action: 'complete' })}
                                disabled={processWithdrawalMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => processWithdrawalMutation.mutate({ id: withdrawal.id, action: 'reject' })}
                                disabled={processWithdrawalMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayoutsManager;
