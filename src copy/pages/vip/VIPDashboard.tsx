import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Diamond, Gift, Users, TrendingUp, Wallet, 
  Star, Crown, Copy, 
  CheckCircle,
  Link2, PlusCircle,
  ChevronRight, Target, Zap,
  FileText, Presentation, Edit, CreditCard, Activity,
  ArrowUpRight, Trophy, Flame, GraduationCap, BookOpen,
  Award, FolderOpen, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useRealtimeTier } from '@/hooks/useRealtimeTier';
import { useUserActivity } from '@/hooks/useUserActivity';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserPoints {
  current_balance: number;
  total_earned: number;
  total_spent: number;
  tier: string;
}

interface Affiliate {
  id: string;
  status: string;
  tier: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  available_balance: number;
}

interface Profile {
  name?: string;
  avatar_url?: string;
  subscription_tier?: string;
}

interface PresentationData {
  id: string;
  title: string;
  updated_at: string;
}

const tierColors: Record<string, { gradient: string; bg: string; text: string }> = {
  bronze: { gradient: 'from-amber-600 to-amber-800', bg: 'bg-amber-500/10', text: 'text-amber-500' },
  silver: { gradient: 'from-slate-400 to-slate-600', bg: 'bg-slate-400/10', text: 'text-slate-400' },
  gold: { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  ouro: { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  diamond: { gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
  platinum: { gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-400/10', text: 'text-violet-400' },
  platina: { gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-400/10', text: 'text-violet-400' },
};

const tierIcons: Record<string, React.ReactNode> = {
  bronze: <Star className="h-4 w-4" />,
  silver: <Star className="h-4 w-4" />,
  gold: <Crown className="h-4 w-4" />,
  ouro: <Crown className="h-4 w-4" />,
  diamond: <Diamond className="h-4 w-4" />,
  platinum: <Diamond className="h-4 w-4" />,
  platina: <Diamond className="h-4 w-4" />,
};

const tierThresholds = [
  { tier: 'bronze', min: 0, max: 499 },
  { tier: 'silver', min: 500, max: 1999 },
  { tier: 'gold', min: 2000, max: 4999 },
  { tier: 'diamond', min: 5000, max: 9999 },
  { tier: 'platinum', min: 10000, max: Infinity },
];

export default function VIPDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    effectiveTier, 
    isGoldOrHigher, 
    currentPoints: realtimePoints,
    totalPoints: realtimeTotalPoints,
    directReferrals: realtimeReferrals,
    availableBalance: realtimeBalance,
    isLoading: tierLoading,
    refetch: refreshTier 
  } = useRealtimeTier();
  
  // Use real activity data instead of mock
  const { data: weeklyData, isLoading: activityLoading, refresh: refreshActivity } = useUserActivity({ days: 7 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Merge realtime data with local state for best accuracy
  const mergedPoints = {
    current_balance: realtimePoints || points?.current_balance || 0,
    total_earned: realtimeTotalPoints || points?.total_earned || 0,
    total_spent: points?.total_spent || 0,
    tier: effectiveTier || points?.tier || 'bronze',
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/dashboard');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, navigate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        navigate('/auth?redirect=/vip/dashboard');
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url, subscription_tier')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Load points
      const pointsRes = await supabase.functions.invoke('points-actions', {
        body: { action: 'get_balance' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (pointsRes.data?.success) {
        setPoints(pointsRes.data.points);
      }

      // Load affiliate stats
      const affiliateRes = await supabase.functions.invoke('affiliate-actions', {
        body: { action: 'get_stats' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (affiliateRes.data?.success) {
        setAffiliate(affiliateRes.data.affiliate);
        setAffiliateStats(affiliateRes.data.stats);
      }

      // Load presentations
      const { data: presentationsData } = await supabase
        .from('vip_presentations')
        .select('id, title, updated_at')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (presentationsData) {
        setPresentations(presentationsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (affiliate?.referral_code) {
      const link = `${window.location.origin}/vendas?ref=${affiliate.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe com seus amigos para ganhar comissões.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getNextTier = () => {
    const currentTier = mergedPoints.tier || 'bronze';
    const currentIndex = tierThresholds.findIndex(t => t.tier === currentTier);
    if (currentIndex < tierThresholds.length - 1) {
      return tierThresholds[currentIndex + 1];
    }
    return null;
  };

  const getTierProgress = () => {
    const currentTierData = tierThresholds.find(t => t.tier === mergedPoints.tier);
    const nextTier = getNextTier();
    
    if (!nextTier || !currentTierData) return 100;
    
    const progress = ((mergedPoints.total_earned - currentTierData.min) / (nextTier.min - currentTierData.min)) * 100;
    return Math.min(progress, 100);
  };

  // Use effectiveTier from realtime hook, fallback to local data
  const displayTier = effectiveTier || mergedPoints.tier || profile?.subscription_tier || 'bronze';
  const tierStyle = tierColors[displayTier.toLowerCase()] || tierColors.bronze;

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header with User Info */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/50">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
              {(profile?.name || user?.email || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Bem-vindo, {profile?.name || user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas apresentações, pontos e recompensas
            </p>
          </div>
        </div>
        
        {/* Tier Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${tierStyle.gradient} text-white flex items-center gap-2 shadow-lg`}
        >
          {tierIcons[displayTier.toLowerCase()]}
          <div>
            <p className="text-[10px] opacity-80">Nível atual</p>
            <p className="font-bold capitalize">{displayTier}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Upgrade Banner for Bronze Users */}
      {!isGoldOrHigher && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-amber-500/30">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Faça Upgrade para Gold</h3>
                  <p className="text-sm text-muted-foreground">
                    Libere o Slides Creator ilimitado + temas premium exclusivos
                  </p>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 whitespace-nowrap"
                onClick={() => navigate('/vip/billing')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Agora
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            icon: Diamond,
            label: 'Pontos',
            value: mergedPoints.current_balance,
            gradient: 'from-primary/20 to-primary/5',
            iconBg: 'bg-primary/20',
            iconColor: 'text-primary',
          },
          {
            icon: TrendingUp,
            label: 'Total Acumulado',
            value: mergedPoints.total_earned,
            gradient: 'from-emerald-500/20 to-emerald-500/5',
            iconBg: 'bg-emerald-500/20',
            iconColor: 'text-emerald-500',
          },
          {
            icon: Users,
            label: 'Indicações',
            value: realtimeReferrals || affiliateStats?.total_referrals || 0,
            gradient: 'from-blue-500/20 to-blue-500/5',
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-500',
          },
          {
            icon: Wallet,
            label: 'Saldo',
            value: `R$ ${(affiliate?.available_balance || 0).toFixed(2)}`,
            gradient: 'from-amber-500/20 to-amber-500/5',
            iconBg: 'bg-amber-500/20',
            iconColor: 'text-amber-500',
            isText: true,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
          >
            <Card className={`bg-gradient-to-br ${stat.gradient} border-0 hover:shadow-lg transition-all hover:-translate-y-1`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {stat.isText ? stat.value : (stat.value as number).toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Acesso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-primary hover:bg-primary/5 group"
                onClick={() => navigate('/vip/slides')}
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Presentation className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Criar Slides</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-500/5 group"
                onClick={() => navigate('/vip/profile/edit')}
              >
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Edit className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-xs font-medium">Editar Perfil</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-amber-500 hover:bg-amber-500/5 group"
                onClick={() => navigate('/vip/billing')}
              >
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-medium">Assinatura</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-emerald-500 hover:bg-emerald-500/5 group"
                onClick={() => navigate('/vip/rewards')}
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Gift className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-xs font-medium">Recompensas</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-violet-500 hover:bg-violet-500/5 group"
                onClick={() => navigate('/members/certificates')}
              >
                <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                  <Award className="h-5 w-5 text-violet-500" />
                </div>
                <span className="text-xs font-medium">Certificados</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-cyan-500 hover:bg-cyan-500/5 group"
                onClick={() => navigate('/members/courses')}
              >
                <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <BookOpen className="h-5 w-5 text-cyan-500" />
                </div>
                <span className="text-xs font-medium">Meus Cursos</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-pink-500 hover:bg-pink-500/5 group"
                onClick={() => navigate('/members/exams')}
              >
                <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                  <GraduationCap className="h-5 w-5 text-pink-500" />
                </div>
                <span className="text-xs font-medium">Fazer Prova</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-orange-500 hover:bg-orange-500/5 group"
                onClick={() => navigate('/members/files')}
              >
                <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <FolderOpen className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-xs font-medium">Meus Arquivos</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-rose-500 hover:bg-rose-500/5 group"
                onClick={() => navigate('/vip/affiliate/products')}
              >
                <div className="p-2 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                  <PlusCircle className="h-5 w-5 text-rose-500" />
                </div>
                <span className="text-xs font-medium">Meus Produtos</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-indigo-500 hover:bg-indigo-500/5 group"
                onClick={() => navigate('/vip/withdrawals')}
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <Wallet className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="text-xs font-medium">Saques</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Affiliate Link Card */}
          {affiliate?.status === 'approved' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Link2 className="h-5 w-5 text-primary" />
                    Seu Link de Afiliado
                  </CardTitle>
                  <CardDescription>
                    Comissão de {affiliate.commission_rate}% em cada venda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/50 rounded-lg">
                    <code className="flex-1 text-sm truncate px-2 py-1">
                      {`${window.location.origin}/vendas?ref=${affiliate.referral_code}`}
                    </code>
                    <Button 
                      size="sm" 
                      onClick={copyReferralLink}
                      className={copied ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-foreground">
                        {affiliateStats?.conversion_rate || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-emerald-500">
                        R$ {(affiliateStats?.total_paid || 0).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Recebido</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Atividade Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tier Progress */}
          {mergedPoints.total_earned > 0 && getNextTier() && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Próximo Nível</h3>
                        <p className="text-sm text-muted-foreground">
                          Faltam {(getNextTier()!.min - mergedPoints.total_earned).toLocaleString()} pontos
                        </p>
                      </div>
                    </div>
                    <Badge className={`bg-gradient-to-r ${tierColors[getNextTier()!.tier]?.gradient || tierColors.gold.gradient} text-white border-0`}>
                      {tierIcons[getNextTier()!.tier]}
                      <span className="ml-1 capitalize">{getNextTier()!.tier}</span>
                    </Badge>
                  </div>
                  <Progress value={getTierProgress()} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    {getTierProgress().toFixed(0)}% completo
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Presentations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Presentation className="h-5 w-5 text-primary" />
                    Apresentações Recentes
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/vip/slides')}>
                    Ver todas
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {presentations.length === 0 ? (
                  <div className="text-center py-8">
                    <Presentation className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Nenhuma apresentação criada ainda
                    </p>
                    <Button size="sm" onClick={() => navigate('/vip/slides')}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Criar Primeira
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {presentations.map((pres) => (
                      <div
                        key={pres.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => navigate('/vip/slides')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{pres.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pres.updated_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Rewards Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Recompensas
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/vip/rewards')}>
                    Ver todas
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Desconto 10%', points: 500, available: mergedPoints.current_balance >= 500 },
                    { name: 'Tema Premium', points: 1000, available: mergedPoints.current_balance >= 1000 },
                    { name: 'Consultoria VIP', points: 2500, available: mergedPoints.current_balance >= 2500 },
                  ].map((reward, i) => (
                    <div 
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-lg ${reward.available ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Gift className={`h-4 w-4 ${reward.available ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${reward.available ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {reward.name}
                        </span>
                      </div>
                      <Badge variant={reward.available ? 'default' : 'secondary'} className="text-xs">
                        {reward.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/10">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Seu Desempenho</h3>
                    <p className="text-sm text-muted-foreground">Este mês</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{affiliateStats?.total_referrals || 0}</p>
                    <p className="text-xs text-muted-foreground">Indicações</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{presentations.length}</p>
                    <p className="text-xs text-muted-foreground">Apresentações</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{mergedPoints.total_earned}</p>
                    <p className="text-xs text-muted-foreground">Pontos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
