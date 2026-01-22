import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, TrendingUp, Award, Search, Check, X, Eye, Edit, Wallet, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AffiliateProgramManager from './AffiliateProgramManager';

const VIPAffiliatesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);

  // Fetch affiliates with profiles
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ['admin-affiliates', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('vip_affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: affiliatesData, error } = await query;
      if (error) throw error;
      
      if (!affiliatesData || affiliatesData.length === 0) return [];
      
      // Fetch profiles separately to avoid join issues
      const userIds = affiliatesData.map(a => a.user_id).filter(Boolean);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, name')
        .in('user_id', userIds);
      
      // Map profiles to affiliates
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      return affiliatesData.map(affiliate => ({
        ...affiliate,
        profiles: profilesMap.get(affiliate.user_id) || null
      }));
    }
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-affiliate-stats'],
    queryFn: async () => {
      const [affiliatesRes, commissionsRes, referralsRes] = await Promise.all([
        supabase.from('vip_affiliates').select('status, total_earnings'),
        supabase.from('affiliate_commissions').select('commission_amount, status'),
        supabase.from('affiliate_referrals').select('status')
      ]);

      const totalAffiliates = affiliatesRes.data?.length || 0;
      const activeAffiliates = affiliatesRes.data?.filter(a => a.status === 'approved').length || 0;
      const totalEarnings = affiliatesRes.data?.reduce((sum, a) => sum + (a.total_earnings || 0), 0) || 0;
      const pendingCommissions = commissionsRes.data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const totalReferrals = referralsRes.data?.length || 0;
      const convertedReferrals = referralsRes.data?.filter(r => r.status === 'converted').length || 0;

      return {
        totalAffiliates,
        activeAffiliates,
        totalEarnings,
        pendingCommissions,
        totalReferrals,
        conversionRate: totalReferrals > 0 ? ((convertedReferrals / totalReferrals) * 100).toFixed(1) : 0
      };
    }
  });

  // Approve affiliate mutation - direct approval (no payment required)
  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' | 'suspend' }) => {
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
      const { error } = await supabase
        .from('vip_affiliates')
        .update({ 
          status,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
      return { action };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-stats'] });
      
      const messages: Record<string, { title: string; desc: string }> = {
        approve: { title: 'Afiliado aprovado/reintegrado!', desc: 'O afiliado pode começar a promover produtos.' },
        reject: { title: 'Afiliado rejeitado', desc: 'Status atualizado com sucesso.' },
        suspend: { title: 'Afiliado suspenso', desc: 'O afiliado foi suspenso e não pode promover produtos.' },
      };
      
      const msg = messages[result?.action || 'approve'];
      toast({ title: msg.title, description: msg.desc });
    }
  });

  // Update commission rate mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      const { error } = await supabase
        .from('vip_affiliates')
        .update({ commission_rate: rate })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      toast({
        title: 'Taxa atualizada!',
        description: 'Taxa de comissão atualizada com sucesso.',
      });
    }
  });

  const filteredAffiliates = affiliates?.filter(a => {
    const matchesSearch = !search || 
      a.referral_code.toLowerCase().includes(search.toLowerCase()) ||
      (a.profiles as any)?.email?.toLowerCase().includes(search.toLowerCase()) ||
      (a.profiles as any)?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'silver': return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      default: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'awaiting_payment': return 'bg-blue-500/20 text-blue-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'suspended': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'awaiting_payment': return 'Aguardando Pagamento';
      case 'rejected': return 'Rejeitado';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  return (
    <Tabs defaultValue="affiliates" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Afiliados VIP</h2>
          <p className="text-muted-foreground">Gerencie afiliados, programas, comissões e convites</p>
        </div>
        <TabsList>
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Programas
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="programs">
        <AffiliateProgramManager />
      </TabsContent>

      <TabsContent value="affiliates" className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Afiliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAffiliates || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeAffiliates || 0} ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ganhos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {(stats?.totalEarnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              R$ {(stats?.pendingCommissions || 0).toLocaleString('pt-BR')} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Indicações</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.conversionRate}% conversão</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              R$ {(stats?.pendingCommissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, email ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Lista de Afiliados</CardTitle>
          <CardDescription>Gerencie aprovações e taxas de comissão</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Ganhos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates?.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(affiliate.profiles as any)?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{(affiliate.profiles as any)?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{affiliate.referral_code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(affiliate.tier || 'bronze')}>
                        {affiliate.tier?.toUpperCase() || 'BRONZE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(affiliate.status || 'pending')}>
                        {getStatusLabel(affiliate.status || 'pending')}
                      </Badge>
                    </TableCell>
                    <TableCell>{affiliate.commission_rate}%</TableCell>
                    <TableCell className="text-green-400">
                      R$ {(affiliate.total_earnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {affiliate.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => approveMutation.mutate({ 
                                id: affiliate.id, 
                                action: 'approve'
                              })}
                              className="text-green-400 hover:text-green-300"
                              title="Aprovar afiliado"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => approveMutation.mutate({ id: affiliate.id, action: 'reject' })}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {affiliate.status === 'awaiting_payment' && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            PIX R$30 pendente
                          </Badge>
                        )}
                        {affiliate.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => approveMutation.mutate({ id: affiliate.id, action: 'suspend' })}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Suspender afiliado"
                          >
                            Suspender
                          </Button>
                        )}
                        {affiliate.status === 'suspended' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => approveMutation.mutate({ id: affiliate.id, action: 'approve' })}
                            className="text-green-400 hover:text-green-300"
                            title="Reintegrar afiliado"
                          >
                            Reintegrar
                          </Button>
                        )}
                        {affiliate.status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => approveMutation.mutate({ id: affiliate.id, action: 'approve' })}
                            className="text-green-400 hover:text-green-300"
                            title="Reaprovar afiliado"
                          >
                            Reaprovar
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedAffiliate(affiliate)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes do Afiliado</DialogTitle>
                              <DialogDescription>
                                {(affiliate.profiles as any)?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Código</p>
                                  <p className="font-mono">{affiliate.referral_code}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Tier</p>
                                  <Badge className={getTierColor(affiliate.tier || 'bronze')}>
                                    {affiliate.tier?.toUpperCase()}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Chave PIX</p>
                                  <p className="text-sm">{affiliate.pix_key || 'Não informada'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                                  <p className="text-green-400 font-bold">
                                    R$ {(affiliate.available_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Taxa de Comissão</p>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    defaultValue={affiliate.commission_rate}
                                    className="w-24"
                                    min={0}
                                    max={50}
                                    id={`commission-${affiliate.id}`}
                                  />
                                  <span>%</span>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const input = document.getElementById(`commission-${affiliate.id}`) as HTMLInputElement;
                                      updateCommissionMutation.mutate({ id: affiliate.id, rate: Number(input.value) });
                                    }}
                                  >
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
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
  );
};

export default VIPAffiliatesManager;
