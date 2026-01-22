import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, DollarSign, Settings, Plus, Trash2, 
  Loader2, Link, Copy, Eye, TrendingUp, Percent,
  Image, FileText, Mail, Check
} from 'lucide-react';

interface AffiliateSettingsPanelProps {
  productId: string;
}

interface Material {
  id: string;
  type: string;
  title: string;
  content: string | null;
  file_url: string | null;
  dimensions: string | null;
  is_active: boolean;
}

const MATERIAL_TYPES = [
  { value: 'banner', label: 'Banner', icon: Image },
  { value: 'email_swipe', label: 'E-mail Swipe', icon: Mail },
  { value: 'copy', label: 'Copy/Texto', icon: FileText },
  { value: 'video', label: 'Vídeo', icon: Eye },
];

const COMMISSION_TIERS = [
  { min: 0, max: 10, label: 'Bronze', color: 'bg-amber-700' },
  { min: 10, max: 25, label: 'Prata', color: 'bg-gray-400' },
  { min: 25, max: 40, label: 'Ouro', color: 'bg-yellow-500' },
  { min: 40, max: 60, label: 'Platina', color: 'bg-cyan-400' },
  { min: 60, max: 100, label: 'Diamante', color: 'bg-purple-500' },
];

// Níveis VIP para acesso gratuito
const VIP_TIERS = [
  { value: 'bronze', label: 'Bronze', color: 'bg-amber-700', icon: '🥉', points: '0-499 pts' },
  { value: 'silver', label: 'Prata', color: 'bg-gray-400', icon: '🥈', points: '500-1.999 pts' },
  { value: 'gold', label: 'Ouro', color: 'bg-yellow-500', icon: '🥇', points: '2.000-4.999 pts' },
  { value: 'diamond', label: 'Diamante', color: 'bg-purple-500', icon: '💎', points: '5.000-9.999 pts' },
  { value: 'platinum', label: 'Platina', color: 'bg-cyan-400', icon: '👑', points: '10.000+ pts' },
];

export default function AffiliateSettingsPanel({ productId }: AffiliateSettingsPanelProps) {
  const queryClient = useQueryClient();
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [settings, setSettings] = useState({
    affiliate_enabled: true,
    affiliate_commission_rate: 50,
    affiliate_free: false,
    affiliate_free_tiers: [] as string[],
  });
  
  const [materialForm, setMaterialForm] = useState({
    type: 'banner',
    title: '',
    content: '',
    file_url: '',
    dimensions: '',
  });

  // Fetch product
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product-affiliate-settings', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch affiliate materials
  const { data: materials, isLoading: loadingMaterials } = useQuery({
    queryKey: ['affiliate-materials', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_materials')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Material[];
    }
  });

  // Fetch affiliate stats
  const { data: stats } = useQuery({
    queryKey: ['product-affiliate-stats', productId],
    queryFn: async () => {
      // Get referrals count
      const { count: referralsCount } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted');
      
      // Get total commissions for this product
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('commission_amount')
        .eq('status', 'paid');
      
      const totalCommissions = commissions?.reduce((acc, c) => acc + Number(c.commission_amount), 0) || 0;
      
      // Get active affiliates count
      const { count: affiliatesCount } = await supabase
        .from('vip_affiliates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      
      return {
        referrals: referralsCount || 0,
        totalCommissions,
        activeAffiliates: affiliatesCount || 0,
      };
    }
  });

  useEffect(() => {
    if (product) {
      // Parse affiliate_free_tiers - can be array or JSON string
      let tiers: string[] = [];
      if (product.affiliate_free_tiers) {
        if (Array.isArray(product.affiliate_free_tiers)) {
          tiers = product.affiliate_free_tiers;
        } else if (typeof product.affiliate_free_tiers === 'string') {
          try {
            tiers = JSON.parse(product.affiliate_free_tiers);
          } catch {
            tiers = [];
          }
        }
      }
      
      setSettings({
        affiliate_enabled: product.affiliate_enabled ?? true,
        affiliate_commission_rate: product.affiliate_commission_rate || 50,
        affiliate_free: product.affiliate_free ?? false,
        affiliate_free_tiers: tiers,
      });
    }
  }, [product]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const { error } = await supabase
        .from('products')
        .update({
          affiliate_enabled: data.affiliate_enabled,
          affiliate_commission_rate: data.affiliate_commission_rate,
          affiliate_free: data.affiliate_free,
          affiliate_free_tiers: data.affiliate_free_tiers,
        } as any)
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-affiliate-settings', productId] });
      toast.success('Configurações salvas!');
    },
    onError: (error: any) => toast.error(error.message)
  });

  // Create/Update material mutation
  const materialMutation = useMutation({
    mutationFn: async (data: typeof materialForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('affiliate_materials')
          .update({
            type: data.type,
            title: data.title,
            content: data.content || null,
            file_url: data.file_url || null,
            dimensions: data.dimensions || null,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('affiliate_materials')
          .insert({
            product_id: productId,
            type: data.type,
            title: data.title,
            content: data.content || null,
            file_url: data.file_url || null,
            dimensions: data.dimensions || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-materials', productId] });
      setMaterialDialogOpen(false);
      resetMaterialForm();
      toast.success(editingMaterial ? 'Material atualizado!' : 'Material criado!');
    },
    onError: (error: any) => toast.error(error.message)
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('affiliate_materials')
        .delete()
        .eq('id', materialId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-materials', productId] });
      toast.success('Material excluído!');
    }
  });

  const resetMaterialForm = () => {
    setMaterialForm({
      type: 'banner',
      title: '',
      content: '',
      file_url: '',
      dimensions: '',
    });
    setEditingMaterial(null);
  };

  const openEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialForm({
      type: material.type,
      title: material.title,
      content: material.content || '',
      file_url: material.file_url || '',
      dimensions: material.dimensions || '',
    });
    setMaterialDialogOpen(true);
  };

  const getCurrentTier = (rate: number) => {
    return COMMISSION_TIERS.find(tier => rate >= tier.min && rate < tier.max) || COMMISSION_TIERS[0];
  };

  const affiliateLink = product ? `${window.location.origin}/produto/${product.slug}?ref=CODIGO_AFILIADO` : '';

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeAffiliates || 0}</p>
              <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.referrals || 0}</p>
              <p className="text-sm text-muted-foreground">Vendas por Afiliados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <DollarSign className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                R$ {(stats?.totalCommissions || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">Comissões Pagas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Afiliação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Permitir Afiliados</Label>
              <p className="text-sm text-muted-foreground">
                Afiliados poderão promover e vender este produto
              </p>
            </div>
            <Switch
              checked={settings.affiliate_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, affiliate_enabled: checked })}
            />
          </div>

          {settings.affiliate_enabled && (
            <>
              {/* Grátis para Afiliados VIP - SECTION WITH TIER SELECTION */}
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold">Grátis para Afiliados VIP</Label>
                        <Badge variant="secondary" className="text-xs">Exclusivo</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ative para liberar acesso gratuito a afiliados VIP de níveis específicos.
                      </p>
                    </div>
                    <Switch
                      checked={settings.affiliate_free}
                      onCheckedChange={(checked) => {
                        setSettings({ 
                          ...settings, 
                          affiliate_free: checked,
                          affiliate_free_tiers: checked ? settings.affiliate_free_tiers : []
                        });
                      }}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  {/* Tier Selection Grid */}
                  {settings.affiliate_free && (
                    <div className="space-y-3 pt-3 border-t border-primary/20">
                      <Label className="text-sm font-medium">Selecione os níveis com acesso gratuito:</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {VIP_TIERS.map((tier) => {
                          const isSelected = settings.affiliate_free_tiers.includes(tier.value);
                          return (
                            <button
                              key={tier.value}
                              type="button"
                              onClick={() => {
                                const newTiers = isSelected
                                  ? settings.affiliate_free_tiers.filter(t => t !== tier.value)
                                  : [...settings.affiliate_free_tiers, tier.value];
                                setSettings({ ...settings, affiliate_free_tiers: newTiers });
                              }}
                              className={`
                                relative p-3 rounded-lg border-2 transition-all text-center
                                ${isSelected 
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="absolute top-1 right-1">
                                  <Check className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <span className="text-2xl block mb-1">{tier.icon}</span>
                              <span className="font-semibold text-sm block">{tier.label}</span>
                              <span className="text-[10px] text-muted-foreground">{tier.points}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {settings.affiliate_free_tiers.length > 0 && product && product.price > 0 && (
                        <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Níveis liberados: {settings.affiliate_free_tiers.map(t => 
                              VIP_TIERS.find(vt => vt.value === t)?.label
                            ).join(', ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Clientes normais pagam: R$ {product.price.toFixed(2)}
                          </p>
                        </div>
                      )}
                      
                      {settings.affiliate_free_tiers.length === 0 && (
                        <p className="text-sm text-amber-600 bg-amber-500/10 p-2 rounded-md">
                          ⚠️ Selecione pelo menos um nível VIP para liberar acesso gratuito
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Taxa de Comissão</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={getCurrentTier(settings.affiliate_commission_rate).color}>
                      {getCurrentTier(settings.affiliate_commission_rate).label}
                    </Badge>
                    <span className="text-2xl font-bold text-primary">
                      {settings.affiliate_commission_rate}%
                    </span>
                  </div>
                </div>
                
                <Slider
                  value={[settings.affiliate_commission_rate]}
                  onValueChange={(value) => setSettings({ ...settings, affiliate_commission_rate: value[0] })}
                  min={1}
                  max={80}
                  step={1}
                  className="py-4"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>20%</span>
                  <span>40%</span>
                  <span>60%</span>
                  <span>80%</span>
                </div>
              </div>

              {product && product.price > 0 && (
                <Card className="p-4 bg-green-500/10 border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Valor por venda para o afiliado:</p>
                      <p className="text-sm text-muted-foreground">
                        {settings.affiliate_commission_rate}% de R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      R$ {(product.price * settings.affiliate_commission_rate / 100).toFixed(2)}
                    </p>
                  </div>
                </Card>
              )}

              <div>
                <Label>Link de Afiliado (exemplo)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={affiliateLink} readOnly className="font-mono text-sm" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(affiliateLink);
                      toast.success('Link copiado!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada afiliado terá seu próprio código de referência
                </p>
              </div>
            </>
          )}

          <div className="pt-4 border-t">
            <Button 
              onClick={() => updateSettingsMutation.mutate(settings)}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials Section */}
      {settings.affiliate_enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Materiais de Divulgação</CardTitle>
                <CardDescription>
                  Banners, e-mail swipes e outros materiais para afiliados
                </CardDescription>
              </div>
              <Button onClick={() => { resetMaterialForm(); setMaterialDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Material
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMaterials ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : materials?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum material cadastrado</p>
                <p className="text-sm">Adicione banners e materiais para seus afiliados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Dimensões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials?.map((material) => {
                    const typeInfo = MATERIAL_TYPES.find(t => t.value === material.type);
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeInfo && <typeInfo.icon className="w-4 h-4 text-muted-foreground" />}
                            <span>{typeInfo?.label || material.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell>{material.dimensions || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={material.is_active ? 'default' : 'secondary'}>
                            {material.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditMaterial(material)}>
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Excluir este material?')) {
                                  deleteMaterialMutation.mutate(material.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Material</Label>
              <Select 
                value={materialForm.type} 
                onValueChange={(v) => setMaterialForm({ ...materialForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                value={materialForm.title}
                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                placeholder="Ex: Banner 728x90"
              />
            </div>

            {(materialForm.type === 'banner' || materialForm.type === 'video') && (
              <>
                <div>
                  <Label>URL do Arquivo</Label>
                  <Input
                    value={materialForm.file_url}
                    onChange={(e) => setMaterialForm({ ...materialForm, file_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Dimensões</Label>
                  <Input
                    value={materialForm.dimensions}
                    onChange={(e) => setMaterialForm({ ...materialForm, dimensions: e.target.value })}
                    placeholder="Ex: 728x90, 300x250, 1920x1080"
                  />
                </div>
              </>
            )}

            {(materialForm.type === 'email_swipe' || materialForm.type === 'copy') && (
              <div>
                <Label>Conteúdo</Label>
                <Textarea
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  placeholder="Cole aqui o texto do e-mail ou copy..."
                  rows={8}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => materialMutation.mutate({ ...materialForm, id: editingMaterial?.id })}
              disabled={materialMutation.isPending || !materialForm.title}
            >
              {materialMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingMaterial ? 'Salvar' : 'Criar Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
