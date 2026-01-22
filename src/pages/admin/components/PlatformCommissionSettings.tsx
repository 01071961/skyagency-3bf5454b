import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Settings, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Percent, 
  CreditCard,
  RefreshCw,
  AlertCircle,
  Save,
  Calculator,
  ChevronRight,
  Crown,
  Layers,
  PieChart,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformSettings {
  platform_commission_rate: number;
  default_affiliate_commission: number;
  mlm_enabled: boolean;
  mlm_level1_rate: number;
  mlm_level2_rate: number;
  mlm_level3_rate: number;
  mlm_level4_rate: number;
  min_withdrawal_amount: number;
  withdrawal_fee_percent: number;
  auto_approve_commissions: boolean;
  payout_schedule: 'manual' | 'weekly' | 'biweekly' | 'monthly';
}

const defaultSettings: PlatformSettings = {
  platform_commission_rate: 5,
  default_affiliate_commission: 10,
  mlm_enabled: true,
  mlm_level1_rate: 5,
  mlm_level2_rate: 2,
  mlm_level3_rate: 1,
  mlm_level4_rate: 0.5,
  min_withdrawal_amount: 50,
  withdrawal_fee_percent: 0,
  auto_approve_commissions: false,
  payout_schedule: 'manual',
};

export default function PlatformCommissionSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [simulatorSaleValue, setSimulatorSaleValue] = useState(100);
  const [isFixingMLM, setIsFixingMLM] = useState(false);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_assistant_settings')
        .select('*')
        .eq('setting_key', 'platform_commission_settings')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.setting_value as unknown as PlatformSettings | null;
    }
  });

  // Fetch commission_settings table data
  const { data: commissionSettings } = useQuery({
    queryKey: ['commission_settings_table'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['platform-commission-stats'],
    queryFn: async () => {
      const [commissionsResult, affiliatesResult, ordersResult, platformCommResult] = await Promise.all([
        supabase.from('affiliate_commissions').select('commission_amount, status, commission_level'),
        supabase.from('vip_affiliates').select('id, status, parent_affiliate_id, direct_referrals_count'),
        supabase.from('orders').select('total, status').eq('status', 'paid'),
        supabase.from('platform_commissions').select('commission_amount'),
      ]);

      const totalCommissions = commissionsResult.data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const pendingCommissions = commissionsResult.data?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const paidCommissions = commissionsResult.data?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const mlmCommissions = commissionsResult.data?.filter(c => c.commission_level && c.commission_level > 0).reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const totalAffiliates = affiliatesResult.data?.filter(a => a.status === 'approved').length || 0;
      const affiliatesWithParent = affiliatesResult.data?.filter(a => a.parent_affiliate_id).length || 0;
      const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const platformEarnings = platformCommResult.data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      return {
        totalCommissions,
        pendingCommissions,
        paidCommissions,
        mlmCommissions,
        totalAffiliates,
        affiliatesWithParent,
        totalRevenue,
        platformEarnings,
      };
    }
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...savedSettings });
    }
  }, [savedSettings]);

  // Function to fix MLM structure
  const handleFixMLM = async () => {
    setIsFixingMLM(true);
    try {
      const { data, error } = await supabase.rpc('link_referrals_to_affiliates');
      
      if (error) throw error;
      
      toast.success(`MLM corrigido! ${data?.[0]?.linked_count || 0} links atualizados.`);
      queryClient.invalidateQueries({ queryKey: ['platform-commission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['mlm-affiliates'] });
    } catch (error) {
      console.error('Error fixing MLM:', error);
      toast.error('Erro ao corrigir estrutura MLM');
    } finally {
      setIsFixingMLM(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (newSettings: PlatformSettings) => {
      const { data: existing } = await supabase
        .from('ai_assistant_settings')
        .select('id')
        .eq('setting_key', 'platform_commission_settings')
        .single();
      
      const settingsJson = JSON.parse(JSON.stringify(newSettings));
      
      if (existing) {
        const { error } = await supabase
          .from('ai_assistant_settings')
          .update({
            setting_value: settingsJson,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'platform_commission_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_assistant_settings')
          .insert([{
            setting_key: 'platform_commission_settings',
            setting_value: settingsJson,
            updated_at: new Date().toISOString(),
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-commission-settings'] });
      toast.success('Configurações salvas com sucesso!');
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  // Simulator calculations
  const calculateDistribution = (saleValue: number) => {
    const platform = saleValue * (settings.platform_commission_rate / 100);
    const affiliate = saleValue * (settings.default_affiliate_commission / 100);
    const mlm1 = settings.mlm_enabled ? saleValue * (settings.mlm_level1_rate / 100) : 0;
    const mlm2 = settings.mlm_enabled ? saleValue * (settings.mlm_level2_rate / 100) : 0;
    const mlm3 = settings.mlm_enabled ? saleValue * (settings.mlm_level3_rate / 100) : 0;
    const mlm4 = settings.mlm_enabled ? saleValue * (settings.mlm_level4_rate / 100) : 0;
    const producer = saleValue - platform - affiliate - mlm1 - mlm2 - mlm3 - mlm4;
    
    return { platform, affiliate, mlm1, mlm2, mlm3, mlm4, producer };
  };

  const distribution = calculateDistribution(simulatorSaleValue);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Configurações de Comissões</h2>
          <p className="text-sm text-muted-foreground">Configure taxas da plataforma e sistema de afiliados MLM</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={handleFixMLM}
            disabled={isFixingMLM}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isFixingMLM && "animate-spin")} />
            {isFixingMLM ? 'Corrigindo...' : 'Corrigir MLM'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saveMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* MLM Health Status */}
      {stats && (
        <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="font-medium">Saúde MLM</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.affiliatesWithParent} de {stats.totalAffiliates} afiliados têm upline vinculado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={stats.affiliatesWithParent > 0 ? "default" : "secondary"}>
                  {Math.round((stats.affiliatesWithParent / Math.max(stats.totalAffiliates, 1)) * 100)}% vinculados
                </Badge>
                {stats.mlmCommissions > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    R$ {stats.mlmCommissions.toFixed(2)} MLM pago
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita Plataforma</p>
                <p className="text-lg sm:text-2xl font-bold text-primary">
                  R$ {stats?.platformEarnings.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Comissões</p>
                <p className="text-lg sm:text-2xl font-bold">R$ {stats?.totalCommissions.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold">R$ {stats?.pendingCommissions.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Afiliados Ativos</p>
                <p className="text-lg sm:text-2xl font-bold">{stats?.totalAffiliates || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Mobile Organization */}
      <Tabs defaultValue="commissions" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-auto">
          <TabsTrigger value="commissions" className="text-xs sm:text-sm py-2">
            <Percent className="h-4 w-4 mr-1 hidden sm:inline" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="mlm" className="text-xs sm:text-sm py-2">
            <Layers className="h-4 w-4 mr-1 hidden sm:inline" />
            MLM
          </TabsTrigger>
          <TabsTrigger value="simulator" className="text-xs sm:text-sm py-2">
            <Calculator className="h-4 w-4 mr-1 hidden sm:inline" />
            Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="mt-4 space-y-4">
          {/* Platform Commission Settings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Percent className="h-5 w-5 text-primary" />
                Taxa da Plataforma
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure a porcentagem que a plataforma retém de cada venda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <Label htmlFor="platform-rate" className="text-sm">Taxa da Plataforma</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.platform_commission_rate]}
                      onValueChange={([value]) => updateSetting('platform_commission_rate', value)}
                      max={30}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">0%</span>
                      <span className="font-bold text-primary">{settings.platform_commission_rate}%</span>
                      <span className="text-muted-foreground">30%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="default-affiliate" className="text-sm">Comissão Padrão Afiliados</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.default_affiliate_commission]}
                      onValueChange={([value]) => updateSetting('default_affiliate_commission', value)}
                      max={50}
                      min={1}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">1%</span>
                      <span className="font-bold text-green-500">{settings.default_affiliate_commission}%</span>
                      <span className="text-muted-foreground">50%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Distribution */}
              <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-3">Distribuição (Venda de R$ 100):</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-xs sm:text-sm">
                    Plataforma: R$ {settings.platform_commission_rate.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-xs sm:text-sm">
                    Afiliado: R$ {settings.default_affiliate_commission.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-xs sm:text-sm">
                    Produtor: R$ {(100 - settings.platform_commission_rate - settings.default_affiliate_commission).toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Settings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Configurações de Saque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-withdrawal" className="text-sm">Valor Mínimo (R$)</Label>
                  <Input
                    id="min-withdrawal"
                    type="number"
                    min="10"
                    step="10"
                    value={settings.min_withdrawal_amount}
                    onChange={(e) => updateSetting('min_withdrawal_amount', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawal-fee" className="text-sm">Taxa de Saque (%)</Label>
                  <Input
                    id="withdrawal-fee"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={settings.withdrawal_fee_percent}
                    onChange={(e) => updateSetting('withdrawal_fee_percent', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payout-schedule" className="text-sm">Agenda de Pagamento</Label>
                  <Select
                    value={settings.payout_schedule}
                    onValueChange={(value: 'manual' | 'weekly' | 'biweekly' | 'monthly') => 
                      updateSetting('payout_schedule', value)
                    }
                  >
                    <SelectTrigger id="payout-schedule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-approve" className="text-sm">Aprovação Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Aprova comissões automaticamente após confirmação do pagamento
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={settings.auto_approve_commissions}
                  onCheckedChange={(checked) => updateSetting('auto_approve_commissions', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mlm" className="mt-4 space-y-4">
          {/* MLM Settings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5 text-primary" />
                Comissões Multi-Nível (MLM)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Sistema de comissões para indicações em múltiplos níveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="mlm-enabled" className="text-sm font-medium">Ativar MLM</Label>
                  <p className="text-xs text-muted-foreground">
                    Afiliados ganham quando seus indicados fazem vendas
                  </p>
                </div>
                <Switch
                  id="mlm-enabled"
                  checked={settings.mlm_enabled}
                  onCheckedChange={(checked) => updateSetting('mlm_enabled', checked)}
                />
              </div>

              {settings.mlm_enabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { key: 'mlm_level1_rate' as const, label: 'Nível 1', color: 'bg-green-500' },
                      { key: 'mlm_level2_rate' as const, label: 'Nível 2', color: 'bg-blue-500' },
                      { key: 'mlm_level3_rate' as const, label: 'Nível 3', color: 'bg-purple-500' },
                      { key: 'mlm_level4_rate' as const, label: 'Nível 4', color: 'bg-orange-500' },
                    ].map((level) => (
                      <div key={level.key} className="space-y-2">
                        <Label className="text-xs sm:text-sm flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${level.color}`} />
                          {level.label}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="25"
                            step="0.5"
                            value={settings[level.key]}
                            onChange={(e) => updateSetting(level.key, Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MLM Visual Structure */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-4">Estrutura MLM Visual:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">
                          <Crown className="h-3 w-3 mr-1" />
                          Você (Upline)
                        </Badge>
                      </div>
                      {[
                        { rate: settings.mlm_level1_rate, level: 'Nível 1' },
                        { rate: settings.mlm_level2_rate, level: 'Nível 2' },
                        { rate: settings.mlm_level3_rate, level: 'Nível 3' },
                        { rate: settings.mlm_level4_rate, level: 'Nível 4' },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2" style={{ marginLeft: `${(index + 1) * 16}px` }}>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {item.level} • {item.rate}% bônus
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="mt-4">
          {/* Commission Simulator */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Simulador de Ganhos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Visualize como as comissões serão distribuídas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm">Valor da Venda</Label>
                <div className="space-y-2">
                  <Slider
                    value={[simulatorSaleValue]}
                    onValueChange={([value]) => setSimulatorSaleValue(value)}
                    max={1000}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">R$ 10</span>
                    <span className="text-2xl font-bold text-primary">R$ {simulatorSaleValue.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">R$ 1000</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Distribution Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground">Plataforma (SKY)</p>
                  <p className="text-xl font-bold text-primary">R$ {distribution.platform.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{settings.platform_commission_rate}%</p>
                </div>
                
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Afiliado Direto</p>
                  <p className="text-xl font-bold text-green-500">R$ {distribution.affiliate.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{settings.default_affiliate_commission}%</p>
                </div>

                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-muted-foreground">Produtor</p>
                  <p className="text-xl font-bold text-blue-500">R$ {distribution.producer.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Restante</p>
                </div>

                {settings.mlm_enabled && (
                  <>
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <p className="text-xs text-muted-foreground">MLM Nível 1</p>
                      <p className="text-xl font-bold text-yellow-500">R$ {distribution.mlm1.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{settings.mlm_level1_rate}%</p>
                    </div>
                    
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-xs text-muted-foreground">MLM Nível 2</p>
                      <p className="text-xl font-bold text-purple-500">R$ {distribution.mlm2.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{settings.mlm_level2_rate}%</p>
                    </div>

                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <p className="text-xs text-muted-foreground">MLM Níveis 3+4</p>
                      <p className="text-xl font-bold text-orange-500">R$ {(distribution.mlm3 + distribution.mlm4).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{settings.mlm_level3_rate + settings.mlm_level4_rate}%</p>
                    </div>
                  </>
                )}
              </div>

              {/* Visual Pie Representation */}
              <div className="flex flex-wrap gap-2 items-center justify-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs">Plataforma</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs">Afiliado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs">Produtor</span>
                </div>
                {settings.mlm_enabled && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs">MLM</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button - Mobile */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 sm:hidden z-50">
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            size="lg"
            className="shadow-lg rounded-full h-14 w-14 p-0"
          >
            <Save className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
