import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award,
  Copy,
  Share2,
  Target,
  Star,
  Zap,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  TIER_CONFIG, 
  getTierConfig, 
  calculatePoints, 
  calculateTierProgress,
  formatBRL,
  normalizeTier 
} from '@/lib/affiliate/tierConfig';
import { EnhancedEarningsSimulator, BadgeDisplay, Leaderboard } from '@/components/affiliate';

export default function AffiliateDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch current user's affiliate data
  const { data: affiliate, isLoading } = useQuery({
    queryKey: ['my-affiliate'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('vip_affiliates')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch referrals
  const { data: referrals } = useQuery({
    queryKey: ['my-referrals', affiliate?.id],
    enabled: !!affiliate?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .select('*, referred_affiliate:referred_affiliate_id(referral_code, tier)')
        .eq('affiliate_id', affiliate!.id);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch commissions
  const { data: commissions } = useQuery({
    queryKey: ['my-commissions', affiliate?.id],
    enabled: !!affiliate?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliate!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Seja um Afiliado VIP
            </CardTitle>
            <CardDescription>
              Junte-se ao programa de afiliados SKY e comece a ganhar comissões!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="mt-4">
              Aplicar para Afiliado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierConfig = getTierConfig(affiliate.tier);
  const currentTier = normalizeTier(affiliate.tier);
  
  // Calculate points (simulated based on earnings)
  const directSales = Number(affiliate.total_earnings || 0);
  const downlineSales = 0; // team_earnings might not exist in schema
  const totalPoints = calculatePoints(directSales * 10, downlineSales * 10); // Multiply for demo
  
  const tierProgress = calculateTierProgress(
    currentTier,
    affiliate.direct_referrals_count || 0,
    directSales,
    totalPoints
  );

  const copyReferralLink = () => {
    const link = `${window.location.origin}/ref/${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            Painel do Afiliado
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu dashboard de afiliado SKY
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(tierConfig.bgColor, tierConfig.textColor, "text-sm px-3 py-1")}>
            {tierConfig.icon} {tierConfig.labelPT}
          </Badge>
          {affiliate.status === 'approved' && (
            <Badge className="bg-green-500/10 text-green-500">Ativo</Badge>
          )}
        </div>
      </div>

      {/* Referral Link Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Seu link de indicação</p>
              <code className="text-lg font-mono text-primary">
                {window.location.origin}/ref/{affiliate.referral_code}
              </code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyReferralLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ganhos Totais</p>
                <p className="text-xl font-bold text-green-500">
                  {formatBRL(directSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Indicações</p>
                <p className="text-xl font-bold">
                  {affiliate.direct_referrals_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pontos</p>
                <p className="text-xl font-bold">
                  {totalPoints.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comissão</p>
                <p className="text-xl font-bold">
                  {tierConfig.commissionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {tierProgress.nextTier && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progresso para {TIER_CONFIG[tierProgress.nextTier].labelPT}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Indicações</span>
                  <span>{affiliate.direct_referrals_count || 0}/{TIER_CONFIG[tierProgress.nextTier].minReferrals}</span>
                </div>
                <Progress value={tierProgress.referralsProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Vendas</span>
                  <span>{formatBRL(directSales)}/{formatBRL(TIER_CONFIG[tierProgress.nextTier].minReferralSales)}</span>
                </div>
                <Progress value={tierProgress.salesProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pontos</span>
                  <span>{totalPoints}/{TIER_CONFIG[tierProgress.nextTier].minPoints}</span>
                </div>
                <Progress value={tierProgress.pointsProgress} className="h-2" />
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Progresso geral: <span className="font-semibold text-primary">{tierProgress.overallProgress.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
          <TabsTrigger value="badges">Conquistas</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Commissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comissões Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {!commissions?.length ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma comissão ainda. Comece a indicar!
                </p>
              ) : (
                <div className="space-y-2">
                  {commissions.slice(0, 5).map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <DollarSign className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {commission.level === 1 ? 'Venda Direta' : `MLM Nível ${commission.level}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(commission.created_at || '').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">
                          {formatBRL(commission.commission_amount || 0)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {commission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MLM Structure Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taxas MLM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                {tierConfig.mlmRates.map((rate, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Nível {index + 1}</p>
                    <p className="text-lg font-bold text-primary">{rate}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator">
          <EnhancedEarningsSimulator 
            currentTier={currentTier}
            currentPoints={totalPoints}
          />
        </TabsContent>

        <TabsContent value="badges">
          <BadgeDisplay 
            earnedBadges={[]}
            stats={{
              referrals: affiliate.direct_referrals_count || 0,
              totalSales: directSales,
              currentTier: currentTier,
              streak: 0,
              completedChallenges: []
            }}
            showLocked={true}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard 
            currentUserId={affiliate.user_id}
            showCurrentUser={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
