import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Gift, Plus, Edit, Trash2, DollarSign, Percent, Award, Star } from 'lucide-react';

const RewardsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'cash',
    points_required: 100,
    cash_value: 0,
    discount_percent: 0,
    tier_required: 'bronze',
    stock: null as number | null,
    is_active: true
  });

  // Fetch rewards
  const { data: rewards, isLoading } = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('type', { ascending: true })
        .order('points_required', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch redemptions stats
  const { data: redemptionStats } = useQuery({
    queryKey: ['admin-redemption-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('status, points_spent, reward_id');
      if (error) throw error;

      const total = data?.length || 0;
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const totalPoints = data?.reduce((sum, r) => sum + r.points_spent, 0) || 0;

      return { total, pending, completed, totalPoints };
    }
  });

  // Create/Update reward mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(data)
          .eq('id', editingReward.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast({
        title: editingReward ? 'Recompensa atualizada!' : 'Recompensa criada!',
        description: 'As alterações foram salvas com sucesso.',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a recompensa.',
        variant: 'destructive'
      });
    }
  });

  // Delete reward mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast({
        title: 'Recompensa excluída!',
        description: 'A recompensa foi removida do catálogo.',
      });
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'cash',
      points_required: 100,
      cash_value: 0,
      discount_percent: 0,
      tier_required: 'bronze',
      stock: null,
      is_active: true
    });
    setEditingReward(null);
  };

  const handleEdit = (reward: any) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      type: reward.type,
      points_required: reward.points_required,
      cash_value: reward.cash_value || 0,
      discount_percent: reward.discount_percent || 0,
      tier_required: reward.tier_required || 'bronze',
      stock: reward.stock,
      is_active: reward.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      points_required: formData.points_required,
      tier_required: formData.tier_required,
      stock: formData.stock,
      is_active: formData.is_active
    };

    if (formData.type === 'cash') {
      payload.cash_value = formData.cash_value;
    } else if (formData.type === 'discount') {
      payload.discount_percent = formData.discount_percent;
    }

    saveMutation.mutate(payload);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return <DollarSign className="h-4 w-4 text-green-400" />;
      case 'discount': return <Percent className="h-4 w-4 text-blue-400" />;
      case 'badge': return <Award className="h-4 w-4 text-yellow-400" />;
      case 'feature': return <Star className="h-4 w-4 text-purple-400" />;
      default: return <Gift className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Dinheiro';
      case 'discount': return 'Desconto';
      case 'badge': return 'Badge';
      case 'feature': return 'Feature';
      case 'product': return 'Produto';
      default: return type;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-cyan-500/20 text-cyan-400';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400';
      case 'silver': return 'bg-gray-400/20 text-gray-300';
      default: return 'bg-orange-500/20 text-orange-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recompensas</h2>
          <p className="text-muted-foreground">Gerencie o catálogo de recompensas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Recompensa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}</DialogTitle>
              <DialogDescription>
                {editingReward ? 'Atualize os dados da recompensa' : 'Adicione uma nova recompensa ao catálogo'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PIX R$50"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a recompensa..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro (PIX)</SelectItem>
                      <SelectItem value="discount">Desconto</SelectItem>
                      <SelectItem value="badge">Badge</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pontos Necessários</Label>
                  <Input
                    type="number"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              {formData.type === 'cash' && (
                <div>
                  <Label>Valor em R$</Label>
                  <Input
                    type="number"
                    value={formData.cash_value}
                    onChange={(e) => setFormData({ ...formData, cash_value: Number(e.target.value) })}
                    min={0}
                    step={0.01}
                  />
                </div>
              )}
              {formData.type === 'discount' && (
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tier Mínimo</Label>
                  <Select value={formData.tier_required} onValueChange={(v) => setFormData({ ...formData, tier_required: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estoque (vazio = ilimitado)</Label>
                  <Input
                    type="number"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value ? Number(e.target.value) : null })}
                    min={0}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recompensas</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {rewards?.filter(r => r.is_active).length || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resgates</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redemptionStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {redemptionStats?.pending || 0} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pontos Resgatados</CardTitle>
            <Award className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(redemptionStats?.totalPoints || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total distribuído</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Sucesso</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {redemptionStats?.total ? ((redemptionStats.completed / redemptionStats.total) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{redemptionStats?.completed || 0} completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Catálogo de Recompensas</CardTitle>
          <CardDescription>Gerencie as recompensas disponíveis para resgate</CardDescription>
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
                  <TableHead>Recompensa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Valor/Benefício</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards?.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(reward.type)}
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {reward.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(reward.type)}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {reward.points_required.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {reward.type === 'cash' && (
                        <span className="text-green-400">R$ {reward.cash_value?.toFixed(2)}</span>
                      )}
                      {reward.type === 'discount' && (
                        <span className="text-blue-400">{reward.discount_percent}% OFF</span>
                      )}
                      {(reward.type === 'badge' || reward.type === 'feature') && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(reward.tier_required || 'bronze')}>
                        {reward.tier_required?.toUpperCase() || 'BRONZE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reward.stock !== null ? reward.stock : '∞'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={reward.is_active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: reward.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(reward)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
                              deleteMutation.mutate(reward.id);
                            }
                          }}
                        >
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
    </div>
  );
};

export default RewardsManager;
