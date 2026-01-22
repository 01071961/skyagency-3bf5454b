import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trophy, Star, Gift, Users, Plus, Edit, Trash2, Search, Award, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GamificationManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingReward, setEditingReward] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [awardData, setAwardData] = useState({
    email: '',
    amount: 100,
    description: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount',
    points_required: 100,
    tier_required: 'bronze',
    cash_value: 0,
    discount_percent: 0,
    stock: null as number | null,
    is_active: true
  });

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('points_required', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: async () => {
      const [pointsRes, redemptionsRes, badgesRes] = await Promise.all([
        supabase.from('user_points').select('current_balance, total_earned, tier'),
        supabase.from('reward_redemptions').select('status, points_spent'),
        supabase.from('user_badges').select('badge_type')
      ]);

      const totalPoints = pointsRes.data?.reduce((sum, p) => sum + (p.current_balance || 0), 0) || 0;
      const totalEarned = pointsRes.data?.reduce((sum, p) => sum + (p.total_earned || 0), 0) || 0;
      const pendingRedemptions = redemptionsRes.data?.filter(r => r.status === 'pending').length || 0;
      const completedRedemptions = redemptionsRes.data?.filter(r => r.status === 'completed').length || 0;
      const totalBadges = badgesRes.data?.length || 0;
      const tierCounts = {
        bronze: pointsRes.data?.filter(p => p.tier === 'bronze').length || 0,
        silver: pointsRes.data?.filter(p => p.tier === 'silver').length || 0,
        gold: pointsRes.data?.filter(p => p.tier === 'gold').length || 0,
        platinum: pointsRes.data?.filter(p => p.tier === 'platinum').length || 0,
        diamond: pointsRes.data?.filter(p => p.tier === 'diamond').length || 0
      };

      return { totalPoints, totalEarned, pendingRedemptions, completedRedemptions, totalBadges, tierCounts };
    }
  });

  const { data: redemptions, isLoading: loadingRedemptions } = useQuery({
    queryKey: ['admin-redemptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`*, rewards(name, type), profiles:user_id(email, name)`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('rewards').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('rewards').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast.success(editingReward ? 'Recompensa atualizada!' : 'Recompensa criada!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Erro ao salvar recompensa')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast.success('Recompensa removida!');
    },
    onError: () => toast.error('Erro ao remover recompensa')
  });

  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status')
  });

  const awardPointsMutation = useMutation({
    mutationFn: async (data: { email: string; amount: number; description: string }) => {
      // First find user by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.email)
        .single();
      
      if (!profile) throw new Error('Usuário não encontrado');

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      if (!token) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('points-actions', {
        body: {
          action: 'admin_award_points',
          params: {
            target_user_id: profile.user_id,
            amount: data.amount,
            type: data.amount > 0 ? 'bonus' : 'adjustment',
            description: data.description || 'Pontos atribuídos pelo admin'
          }
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro desconhecido');
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
      toast.success(`Pontos atribuídos com sucesso! Novo saldo: ${data.new_balance}`);
      setIsAwardDialogOpen(false);
      setAwardData({ email: '', amount: 100, description: '' });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Erro ao atribuir pontos')
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'discount',
      points_required: 100,
      tier_required: 'bronze',
      cash_value: 0,
      discount_percent: 0,
      stock: null,
      is_active: true
    });
    setEditingReward(null);
  };

  const openEditDialog = (reward: any) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      type: reward.type,
      points_required: reward.points_required,
      tier_required: reward.tier_required || 'bronze',
      cash_value: reward.cash_value || 0,
      discount_percent: reward.discount_percent || 0,
      stock: reward.stock,
      is_active: reward.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingReward) {
      saveMutation.mutate({ ...formData, id: editingReward.id });
    } else {
      saveMutation.mutate(formData);
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-600/20 text-amber-400',
      silver: 'bg-slate-400/20 text-slate-300',
      gold: 'bg-yellow-500/20 text-yellow-400',
      platinum: 'bg-cyan-400/20 text-cyan-300',
      diamond: 'bg-purple-500/20 text-purple-400'
    };
    return <Badge className={colors[tier] || 'bg-muted'}>{tier}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400'
    };
    return <Badge className={styles[status] || 'bg-muted'}>{status}</Badge>;
  };

  const filteredRewards = rewards?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Sistema de Gamificação</h2>
        <div className="flex gap-2">
          {/* Award Points Dialog */}
          <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Coins className="mr-2 h-4 w-4" />
                Atribuir Pontos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atribuir Pontos a Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email do Usuário</Label>
                  <Input 
                    type="email"
                    placeholder="usuario@email.com"
                    value={awardData.email} 
                    onChange={(e) => setAwardData({ ...awardData, email: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Quantidade de Pontos</Label>
                  <Input 
                    type="number"
                    value={awardData.amount} 
                    onChange={(e) => setAwardData({ ...awardData, amount: Number(e.target.value) })} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Use valores negativos para deduzir pontos</p>
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea 
                    placeholder="Motivo da atribuição..."
                    value={awardData.description} 
                    onChange={(e) => setAwardData({ ...awardData, description: e.target.value })} 
                  />
                </div>
                <Button 
                  onClick={() => awardPointsMutation.mutate(awardData)} 
                  className="w-full" 
                  disabled={!awardData.email || awardPointsMutation.isPending}
                >
                  {awardPointsMutation.isPending ? 'Processando...' : 'Atribuir Pontos'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* New Reward Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Recompensa
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Desconto</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="badge">Badge</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pontos Necessários</Label>
                  <Input type="number" value={formData.points_required} onChange={(e) => setFormData({ ...formData, points_required: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tier Mínimo</Label>
                  <Select value={formData.tier_required} onValueChange={(v) => setFormData({ ...formData, tier_required: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Prata</SelectItem>
                      <SelectItem value="gold">Ouro</SelectItem>
                      <SelectItem value="platinum">Platina</SelectItem>
                      <SelectItem value="diamond">Diamante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estoque (opcional)</Label>
                  <Input type="number" value={formData.stock || ''} onChange={(e) => setFormData({ ...formData, stock: e.target.value ? Number(e.target.value) : null })} placeholder="Ilimitado" />
                </div>
              </div>
              {formData.type === 'cash' && (
                <div>
                  <Label>Valor em Reais</Label>
                  <Input type="number" step="0.01" value={formData.cash_value} onChange={(e) => setFormData({ ...formData, cash_value: Number(e.target.value) })} />
                </div>
              )}
              {formData.type === 'discount' && (
                <div>
                  <Label>Porcentagem de Desconto</Label>
                  <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })} />
                </div>
              )}
              <Button onClick={handleSubmit} className="w-full" disabled={saveMutation.isPending}>
                {editingReward ? 'Salvar Alterações' : 'Criar Recompensa'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pontos</p>
                <p className="text-xl font-bold">{stats?.totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ganhos</p>
                <p className="text-xl font-bold">{stats?.totalEarned.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Gift className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resgates Pendentes</p>
                <p className="text-xl font-bold">{stats?.pendingRedemptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Trophy className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resgates Completos</p>
                <p className="text-xl font-bold">{stats?.completedRedemptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Badges Concedidas</p>
                <p className="text-xl font-bold">{stats?.totalBadges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribuição por Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats?.tierCounts || {}).map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2">
                {getTierBadge(tier)}
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catálogo de Recompensas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRewards ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Valor/Desconto</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards?.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">{reward.name}</TableCell>
                    <TableCell><Badge variant="outline">{reward.type}</Badge></TableCell>
                    <TableCell>{reward.points_required}</TableCell>
                    <TableCell>{getTierBadge(reward.tier_required || 'bronze')}</TableCell>
                    <TableCell>
                      {reward.type === 'cash' && `R$ ${reward.cash_value?.toFixed(2)}`}
                      {reward.type === 'discount' && `${reward.discount_percent}%`}
                      {!['cash', 'discount'].includes(reward.type) && '-'}
                    </TableCell>
                    <TableCell>{reward.stock ?? '∞'}</TableCell>
                    <TableCell>
                      <Badge className={reward.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {reward.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(reward)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(reward.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Redemptions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Resgates Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRedemptions ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Recompensa</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions?.map((redemption) => {
                  const reward = redemption.rewards as any;
                  const profile = redemption.profiles as any;
                  return (
                    <TableRow key={redemption.id}>
                      <TableCell>{format(new Date(redemption.created_at || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell>{profile?.name || profile?.email || '-'}</TableCell>
                      <TableCell>{reward?.name || '-'}</TableCell>
                      <TableCell>{redemption.points_spent}</TableCell>
                      <TableCell>{getStatusBadge(redemption.status || 'pending')}</TableCell>
                      <TableCell>
                        {redemption.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateRedemptionMutation.mutate({ id: redemption.id, status: 'completed' })}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateRedemptionMutation.mutate({ id: redemption.id, status: 'cancelled' })}>
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
