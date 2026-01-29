import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Crown,
  Search,
  ChevronRight,
  Award,
  GitBranch,
  Layers,
  ArrowUp,
  ArrowDown,
  X,
  Star,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIER_CONFIG as BASE_TIER_CONFIG, calculatePoints, calculateTierProgress, getTierConfig, normalizeTier, TierKey } from '@/lib/affiliate/tierConfig';

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  tier: string;
  status: string;
  commission_rate: number;
  total_earnings: number;
  team_earnings: number;
  direct_referrals_count: number;
  sponsor_id: string | null;
  created_at: string;
  profile?: {
    name: string;
    email: string;
  };
}

interface PlatformCommission {
  id: string;
  order_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
}

// Use centralized tier config with visual enhancements for the panel
const TIER_VISUAL = {
  bronze: { 
    ...BASE_TIER_CONFIG.bronze,
    requirements: '0 indicações',
  },
  silver: { 
    ...BASE_TIER_CONFIG.silver,
    requirements: '5+ indicações, R$500+ vendas, 500+ pts',
  },
  gold: { 
    ...BASE_TIER_CONFIG.gold,
    requirements: '15+ indicações, R$2k+ vendas, 2k+ pts',
  },
  diamond: { 
    ...BASE_TIER_CONFIG.diamond,
    requirements: '50+ indicações, R$10k+ vendas, 10k+ pts',
  },
};

// Helper to calculate affiliate points
const getAffiliatePoints = (directSales: number, downlineSales: number) => {
  return calculatePoints(directSales, downlineSales);
};

// Get next tier progress using centralized function
const getNextTierProgressData = (currentTier: string, points: number, referrals: number, sales: number) => {
  const normalized = normalizeTier(currentTier);
  const progress = calculateTierProgress(normalized, referrals, sales, points);
  return progress;
};

export default function MLMStructurePanel() {
  const [search, setSearch] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);

  const { data: affiliates, isLoading: loadingAffiliates } = useQuery({
    queryKey: ['mlm-affiliates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vip_affiliates')
        .select(`
          *,
          profiles:user_id (name, email)
        `)
        .in('status', ['approved', 'active'])
        .order('total_earnings', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Affiliate[];
    }
  });

  const { data: platformCommissions } = useQuery({
    queryKey: ['platform-commissions'],
    queryFn: async () => {
      // Table platform_commissions doesn't exist - return empty array
      return [] as PlatformCommission[];
    }
  });

  // Fetch all affiliate commissions for detail view
  const { data: affiliateCommissions } = useQuery({
    queryKey: ['affiliate-commissions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliate:affiliate_id (
            referral_code,
            profiles:user_id (name, email)
          ),
          order:order_id (order_number, total)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate statistics
  const stats = {
    totalAffiliates: affiliates?.length || 0,
    totalEarnings: affiliates?.reduce((sum, a) => sum + Number(a.total_earnings), 0) || 0,
    totalTeamEarnings: affiliates?.reduce((sum, a) => sum + Number(a.team_earnings || 0), 0) || 0,
    platformEarnings: platformCommissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0,
    tierDistribution: {
      bronze: affiliates?.filter(a => a.tier === 'bronze').length || 0,
      silver: affiliates?.filter(a => a.tier === 'silver').length || 0,
      gold: affiliates?.filter(a => a.tier === 'gold').length || 0,
      diamond: affiliates?.filter(a => a.tier === 'diamond').length || 0,
    }
  };

  const filteredAffiliates = affiliates?.filter(a => 
    !search || 
    a.referral_code.toLowerCase().includes(search.toLowerCase()) ||
    a.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getDownline = (affiliateId: string) => {
    return affiliates?.filter(a => a.sponsor_id === affiliateId) || [];
  };

  const getUplineChain = (affiliate: Affiliate): Affiliate[] => {
    if (!affiliate.sponsor_id) return [];
    const parent = affiliates?.find(a => a.id === affiliate.sponsor_id);
    if (!parent) return [];
    return [parent, ...getUplineChain(parent)];
  };

  const renderTierBadge = (tier: string) => {
    const config = getTierConfig(tier);
    return (
      <Badge className={cn(config.bgColor, config.textColor, "border-0 text-xs")}>
        {config.icon} {config.labelPT}
      </Badge>
    );
  };

  const selectedAffiliateData = affiliates?.find(a => a.id === selectedAffiliate);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Estrutura MLM
        </h2>
        <p className="text-sm text-muted-foreground">
          Visualize a estrutura de afiliados e comissões
        </p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 shrink-0">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita SKY</p>
                <p className="text-lg sm:text-2xl font-bold text-primary truncate">
                  R$ {stats.platformEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Comissões Diretas</p>
                <p className="text-lg sm:text-2xl font-bold truncate">R$ {stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
                <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Comissões MLM</p>
                <p className="text-lg sm:text-2xl font-bold truncate">R$ {stats.totalTeamEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-violet-500/10 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Afiliados</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution - Horizontal Scroll on Mobile */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Award className="h-5 w-5 text-primary" />
            Distribuição por Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full pb-3">
            <div className="flex gap-3 min-w-max sm:grid sm:grid-cols-4 sm:min-w-0">
              {Object.entries(TIER_VISUAL).map(([key, config]) => (
                <div 
                  key={key} 
                  className={cn(
                    "p-3 sm:p-4 rounded-lg bg-gradient-to-br text-white text-center",
                    "min-w-[100px] sm:min-w-0",
                    config.gradient
                  )}
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{config.icon}</div>
                  <div className="font-bold text-sm sm:text-base">{config.labelPT}</div>
                  <div className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {stats.tierDistribution[key as keyof typeof stats.tierDistribution] || 0}
                  </div>
                  <div className="text-xs opacity-80 mt-1">{config.commissionRate}%</div>
                  <div className="text-[10px] sm:text-xs opacity-70">{config.requirements}</div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="sm:hidden" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Affiliates Table with MLM Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <GitBranch className="h-5 w-5 text-primary" />
            Estrutura de Afiliados
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Toque em um afiliado para ver sua rede
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="table" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="table" className="text-xs sm:text-sm">
                Afiliados
              </TabsTrigger>
              <TabsTrigger value="commissions" className="text-xs sm:text-sm">
                Comissões
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="text-xs sm:text-sm">
                Hierarquia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {loadingAffiliates ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : filteredAffiliates?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum afiliado encontrado</div>
                ) : (
                  filteredAffiliates?.slice(0, 20).map((affiliate) => {
                    const parent = affiliates?.find(a => a.id === affiliate.sponsor_id);
                    const downlineCount = getDownline(affiliate.id).length;
                    const isSelected = selectedAffiliate === affiliate.id;
                    
                    return (
                      <div 
                        key={affiliate.id}
                        className={cn(
                          "p-3 rounded-lg border transition-colors cursor-pointer",
                          isSelected ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/20"
                        )}
                        onClick={() => setSelectedAffiliate(isSelected ? null : affiliate.id)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {affiliate.profile?.name || 'Nome não disponível'}
                            </p>
                            <code className="text-xs text-muted-foreground">
                              {affiliate.referral_code}
                            </code>
                          </div>
                          {renderTierBadge(affiliate.tier)}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <p className="text-muted-foreground">Indicações</p>
                            <p className="font-semibold">{affiliate.direct_referrals_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Direto</p>
                            <p className="font-semibold text-green-500">R$ {Number(affiliate.total_earnings).toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">MLM</p>
                            <p className="font-semibold text-blue-500">R$ {Number(affiliate.team_earnings || 0).toFixed(0)}</p>
                          </div>
                        </div>

                        {parent ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowUp className="h-3 w-3" />
                            Upline: {parent.profile?.name || parent.referral_code}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            <Crown className="h-3 w-3 mr-1" />
                            Topo da Rede
                          </Badge>
                        )}
                        
                        {downlineCount > 0 && (
                          <Badge variant="outline" className="text-xs mt-2">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {downlineCount} na rede
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Indicações</TableHead>
                        <TableHead className="text-right">Ganhos Diretos</TableHead>
                        <TableHead className="text-right">Ganhos MLM</TableHead>
                        <TableHead>Upline</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAffiliates ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : filteredAffiliates?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhum afiliado encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAffiliates?.map((affiliate) => {
                          const parent = affiliates?.find(a => a.id === affiliate.sponsor_id);
                          const downlineCount = getDownline(affiliate.id).length;
                          
                          return (
                            <TableRow 
                              key={affiliate.id}
                              className={selectedAffiliate === affiliate.id ? 'bg-muted/50' : ''}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {affiliate.profile?.name || 'Nome não disponível'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {affiliate.profile?.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="px-2 py-1 bg-muted rounded text-sm">
                                  {affiliate.referral_code}
                                </code>
                              </TableCell>
                              <TableCell>{renderTierBadge(affiliate.tier)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-medium">
                                    {affiliate.direct_referrals_count || 0}
                                  </span>
                                  {downlineCount > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{downlineCount}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                R$ {Number(affiliate.total_earnings).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-blue-600">
                                R$ {Number(affiliate.team_earnings || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {parent ? (
                                  <div className="flex items-center gap-1">
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {parent.profile?.name || parent.referral_code}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    <Crown className="h-3 w-3 mr-1" />
                                    SKY
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAffiliate(
                                    selectedAffiliate === affiliate.id ? null : affiliate.id
                                  )}
                                >
                                  Ver Rede
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Selected Affiliate Network - Drawer Style on Mobile */}
              {selectedAffiliateData && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setSelectedAffiliate(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <h4 className="font-semibold flex items-center gap-2 mb-4 pr-8">
                    <GitBranch className="h-4 w-4" />
                    Rede de {selectedAffiliateData.profile?.name || selectedAffiliateData.referral_code}
                  </h4>
                  
                  {/* Upline Chain */}
                  {(() => {
                    const upline = getUplineChain(selectedAffiliateData);
                    const downline = getDownline(selectedAffiliateData.id);
                    
                    return (
                      <div className="space-y-4">
                        {upline.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <ArrowUp className="h-3 w-3" />
                              Linha Ascendente (Upline):
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="bg-primary/10 text-primary">
                                <Crown className="h-3 w-3 mr-1" />
                                SKY
                              </Badge>
                              {upline.reverse().map((up) => (
                                <div key={up.id} className="flex items-center gap-1">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant="outline" className="text-xs">
                                    {up.profile?.name || up.referral_code}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Current */}
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground">Selecionado</Badge>
                            <span className="font-medium">{selectedAffiliateData.profile?.name}</span>
                            {renderTierBadge(selectedAffiliateData.tier)}
                          </div>
                        </div>

                        {/* Downline */}
                        {downline.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <ArrowDown className="h-3 w-3" />
                              Rede Direta ({downline.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {downline.map((down) => (
                                <Badge 
                                  key={down.id} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-muted"
                                  onClick={() => setSelectedAffiliate(down.id)}
                                >
                                  {down.profile?.name || down.referral_code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                      <p className="text-2xl font-bold text-emerald-500">
                        R$ {affiliateCommissions
                          ?.filter(c => c.status === 'pending')
                          .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
                          .toFixed(2) || '0.00'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Comissões Aprovadas</p>
                      <p className="text-2xl font-bold text-blue-500">
                        R$ {affiliateCommissions
                          ?.filter(c => c.status === 'approved')
                          .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
                          .toFixed(2) || '0.00'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/10 border-primary/20">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {affiliateCommissions
                          ?.filter(c => c.status === 'paid')
                          .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
                          .toFixed(2) || '0.00'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Commissions List */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {!affiliateCommissions || affiliateCommissions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Nenhuma comissão registrada ainda</p>
                      </div>
                    ) : (
                      affiliateCommissions.map((commission: any) => (
                        <div
                          key={commission.id}
                          className="p-4 bg-muted/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              commission.commission_level === 0 ? "bg-emerald-500/10" :
                              commission.commission_level === 1 ? "bg-blue-500/10" : "bg-purple-500/10"
                            )}>
                              <Layers className={cn(
                                "h-4 w-4",
                                commission.commission_level === 0 ? "text-emerald-500" :
                                commission.commission_level === 1 ? "text-blue-500" : "text-purple-500"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {commission.affiliate?.profiles?.name || commission.affiliate?.referral_code || 'Afiliado'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {commission.commission_type === 'direct' ? 'Venda Direta' :
                                 commission.commission_type === 'mlm_level1' ? 'MLM Nível 1' :
                                 commission.commission_type === 'mlm_level2' ? 'MLM Nível 2' : commission.commission_type}
                                {commission.order?.order_number && ` • ${commission.order.order_number}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="font-bold text-lg text-foreground">
                                R$ {Number(commission.commission_amount || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Number(commission.commission_rate || 0).toFixed(0)}% de R$ {Number(commission.order_total || 0).toFixed(2)}
                              </p>
                            </div>
                            <Badge variant={
                              commission.status === 'pending' ? 'outline' :
                              commission.status === 'approved' ? 'default' : 'secondary'
                            } className={
                              commission.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                              commission.status === 'approved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            }>
                              {commission.status === 'pending' ? 'Pendente' :
                               commission.status === 'approved' ? 'Aprovada' : 'Paga'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="hierarchy" className="mt-4">
              {/* Visual Hierarchy by Tier */}
              <div className="space-y-4">
                {Object.entries(TIER_VISUAL).reverse().map(([tierKey, config]) => {
                  const tierAffiliates = filteredAffiliates?.filter(a => normalizeTier(a.tier) === tierKey) || [];
                  if (tierAffiliates.length === 0) return null;
                  
                  return (
                    <div key={tierKey} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className="font-semibold text-sm">{config.labelPT}</span>
                        <Badge variant="outline" className="text-xs">{tierAffiliates.length}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {tierAffiliates.slice(0, 10).map((affiliate) => (
                          <Badge 
                            key={affiliate.id}
                            variant="outline"
                            className={cn(
                              "cursor-pointer transition-colors text-xs",
                              config.bgColor, config.textColor
                            )}
                            onClick={() => setSelectedAffiliate(affiliate.id)}
                          >
                            {affiliate.profile?.name || affiliate.referral_code}
                          </Badge>
                        ))}
                        {tierAffiliates.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{tierAffiliates.length - 10} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
