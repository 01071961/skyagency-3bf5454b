import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Clock, CheckCircle, Search, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CommissionTracking() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['admin-commissions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_commissions')
        .select(`
          *,
          vip_affiliates:affiliate_id(referral_code, user_id),
          orders:order_id(order_number, customer_name)
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

  const { data: stats } = useQuery({
    queryKey: ['commission-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('status, commission_amount');
      
      if (error) throw error;

      const total = data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const pending = data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const approved = data?.filter(c => c.status === 'approved').reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const paid = data?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      return { total, pending, approved, paid, count: data?.length || 0 };
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, affiliateId, commissionAmount }: { id: string; status: string; affiliateId?: string; commissionAmount?: number }) => {
      // Update commission status
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;

      // If approving, add to affiliate's available balance
      if (status === 'approved' && affiliateId && commissionAmount) {
        const { data: affiliate } = await supabase
          .from('vip_affiliates')
          .select('available_balance')
          .eq('id', affiliateId)
          .single();
        
        if (affiliate) {
          await supabase
            .from('vip_affiliates')
            .update({ available_balance: (affiliate.available_balance || 0) + commissionAmount })
            .eq('id', affiliateId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      toast.success('Status atualizado e saldo do afiliado ajustado!');
    },
    onError: () => toast.error('Erro ao atualizar status')
  });

  const filteredCommissions = commissions?.filter(c => {
    if (!search) return true;
    const affiliate = c.vip_affiliates as any;
    const order = c.orders as any;
    return (
      affiliate?.referral_code?.toLowerCase().includes(search.toLowerCase()) ||
      order?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order?.order_number?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-blue-500/20 text-blue-400',
      paid: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    return <Badge className={styles[status] || 'bg-muted'}>{status}</Badge>;
  };

  const exportCSV = () => {
    if (!filteredCommissions?.length) return;
    const headers = ['Data', 'Afiliado', 'Pedido', 'Valor Total', 'Taxa', 'Comissão', 'Status'];
    const rows = filteredCommissions.map(c => {
      const affiliate = c.vip_affiliates as any;
      const order = c.orders as any;
      return [
        format(new Date(c.created_at || ''), 'dd/MM/yyyy', { locale: ptBR }),
        affiliate?.referral_code || '-',
        order?.order_number || '-',
        `R$ ${Number(c.order_total).toFixed(2)}`,
        `${Number(c.commission_rate)}%`,
        `R$ ${Number(c.commission_amount).toFixed(2)}`,
        c.status
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comissoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Rastreamento de Comissões</h2>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-2xl font-bold">R$ {stats?.total.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">R$ {stats?.pending.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">R$ {stats?.approved.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagas</p>
                <p className="text-2xl font-bold">R$ {stats?.paid.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por afiliado, pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commission Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Histórico de Comissões ({filteredCommissions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions?.map((commission) => {
                  const affiliate = commission.vip_affiliates as any;
                  const order = commission.orders as any;
                  return (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {format(new Date(commission.created_at || ''), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {affiliate?.referral_code || '-'}
                      </TableCell>
                      <TableCell>{order?.order_number || '-'}</TableCell>
                      <TableCell>R$ {Number(commission.order_total).toFixed(2)}</TableCell>
                      <TableCell>{Number(commission.commission_rate)}%</TableCell>
                      <TableCell className="font-semibold text-green-400">
                        R$ {Number(commission.commission_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(commission.status || 'pending')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {commission.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ 
                                id: commission.id, 
                                status: 'approved',
                                affiliateId: commission.affiliate_id,
                                commissionAmount: Number(commission.commission_amount)
                              })}
                            >
                              Aprovar
                            </Button>
                          )}
                          {commission.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: commission.id, status: 'paid' })}
                            >
                              Pagar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredCommissions?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma comissão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
