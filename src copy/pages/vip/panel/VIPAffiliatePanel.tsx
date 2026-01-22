import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Diamond, Users, TrendingUp, Gift, Trophy, Bell,
  Star, Crown, Target, Zap, ChevronRight, Award,
  History, ShoppingBag, Medal, Flame, Wallet, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeTier } from '@/hooks/useRealtimeTier';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Tier configurations with metallic colors
const tierConfig = {
  bronze: {
    name: 'Bronze',
    color: 'from-amber-600 via-amber-500 to-amber-700',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-500',
    icon: Star,
    minPoints: 0,
    maxPoints: 499,
    commission: 10,
    benefits: ['Acesso à comunidade', 'Materiais básicos']
  },
  silver: {
    name: 'Prata',
    color: 'from-slate-400 via-slate-300 to-slate-500',
    bgColor: 'bg-slate-400/10',
    borderColor: 'border-slate-400/30',
    textColor: 'text-slate-400',
    icon: Star,
    minPoints: 500,
    maxPoints: 1999,
    commission: 12,
    benefits: ['Curso de Marketing Digital', 'Suporte prioritário']
  },
  gold: {
    name: 'Ouro',
    color: 'from-yellow-500 via-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-500',
    icon: Crown,
    minPoints: 2000,
    maxPoints: 4999,
    commission: 15,
    benefits: ['Mentoria mensal', 'E-books exclusivos', 'Slides Creator Premium']
  },
  diamond: {
    name: 'Diamante',
    color: 'from-cyan-400 via-cyan-300 to-blue-500',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/30',
    textColor: 'text-cyan-400',
    icon: Diamond,
    minPoints: 5000,
    maxPoints: 9999,
    commission: 18,
    benefits: ['Acesso antecipado a produtos', 'Grupo VIP Diamante', 'Comissão 18%']
  },
  platinum: {
    name: 'Platina',
    color: 'from-violet-400 via-purple-300 to-purple-500',
    bgColor: 'bg-violet-400/10',
    borderColor: 'border-violet-400/30',
    textColor: 'text-violet-400',
    icon: Diamond,
    minPoints: 10000,
    maxPoints: Infinity,
    commission: 20,
    benefits: ['Todas as mentorias', 'Convites para eventos', 'Comissão máxima 20%']
  }
};

// Points per action
const actionPoints = {
  new_affiliate: { points: 10, label: 'Novo Afiliado', icon: Users },
  sale: { points: 20, label: 'Venda Realizada', icon: ShoppingBag },
  monthly_goal: { points: 50, label: 'Meta Mensal', icon: Target },
  tier_upgrade: { points: 100, label: 'Subida de Nível', icon: TrendingUp },
  event: { points: 30, label: 'Participação em Evento', icon: Zap },
  share: { points: 5, label: 'Compartilhamento', icon: ChevronRight },
  first_sale: { points: 50, label: 'Primeira Venda', icon: Trophy },
  referral_bonus: { points: 15, label: 'Bônus de Indicação', icon: Gift }
};

export default function VIPAffiliatePanel() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Use the realtime tier hook for synchronized data
  const { 
    effectiveTier, 
    currentPoints, 
    totalPoints, 
    directReferrals, 
    totalSales,
    availableBalance,
    isLoading: tierLoading,
    refetch: refreshTier,
    syncWithStripe 
  } = useRealtimeTier();
  
  const [isLoading, setIsLoading] = useState(true);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [weeklyData, setWeeklyData] = useState<Array<{ name: string; views: number; points: number; sales: number }>>([]);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/panel');
      return;
    }
    if (user) {
      loadExtraData();
      loadWeeklyActivity();
      subscribeToNotifications();
    }
  }, [user, authLoading]);

  // Load real weekly activity data
  const loadWeeklyActivity = async () => {
    if (!user?.id) return;
    
    try {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      // Get affiliate data for this user
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const data: Array<{ name: string; views: number; points: number; sales: number }> = [];

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        // Get views for this day
        const { count: viewsCount } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());

        // Get sales for this day (from commissions if affiliate)
        let salesCount = 0;
        if (affiliate?.id) {
          const { count } = await supabase
            .from('affiliate_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id)
            .gte('created_at', dayStart.toISOString())
            .lt('created_at', dayEnd.toISOString());
          salesCount = count || 0;
        }

        data.push({
          name: days[i],
          views: viewsCount || 0,
          points: (viewsCount || 0) * 2 + salesCount * 20, // Estimated points
          sales: salesCount
        });
      }

      setWeeklyData(data);
    } catch (error) {
      console.error('Error loading weekly activity:', error);
      // Set empty data on error
      setWeeklyData([
        { name: 'Dom', views: 0, points: 0, sales: 0 },
        { name: 'Seg', views: 0, points: 0, sales: 0 },
        { name: 'Ter', views: 0, points: 0, sales: 0 },
        { name: 'Qua', views: 0, points: 0, sales: 0 },
        { name: 'Qui', views: 0, points: 0, sales: 0 },
        { name: 'Sex', views: 0, points: 0, sales: 0 },
        { name: 'Sáb', views: 0, points: 0, sales: 0 },
      ]);
    }
  };

  const loadExtraData = async () => {
    try {
      setIsLoading(true);
      
      // Get recent actions
      const { data: actions } = await supabase
        .from('vip_affiliate_actions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get unread notifications count
      const { count: unreadCount } = await supabase
        .from('vip_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setRecentActions(actions || []);
      setUnreadNotifications(unreadCount || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel(`vip-panel-realtime-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vip_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload: any) => {
          toast({
            title: payload.new.title,
            description: payload.new.message,
          });
          setUnreadNotifications(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRefresh = async () => {
    await Promise.all([refreshTier(), loadExtraData(), loadWeeklyActivity()]);
    toast({ title: 'Dados atualizados!' });
  };

  const currentTier = tierConfig[effectiveTier as keyof typeof tierConfig] || tierConfig.bronze;
  const nextTier = Object.values(tierConfig).find(t => t.minPoints > totalPoints);
  const progressToNextTier = nextTier 
    ? ((totalPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  if (authLoading || (isLoading && tierLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Carregando painel VIP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header with Tier Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Painel de Afiliados VIP</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo ao seu Painel VIP
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe seu progresso, conquistas e recompensas
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Card */}
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="font-bold text-emerald-500">R$ {availableBalance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`px-6 py-4 rounded-2xl bg-gradient-to-r ${currentTier.color} text-white flex items-center gap-3 shadow-xl`}
            >
              <currentTier.icon className="h-8 w-8" />
              <div>
                <p className="text-xs opacity-80">Nível Atual</p>
                <p className="text-xl font-bold">{currentTier.name}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Diamond, label: 'Pontos Disponíveis', value: currentPoints, color: 'text-primary' },
          { icon: TrendingUp, label: 'Total Acumulado', value: totalPoints, color: 'text-emerald-500' },
          { icon: Users, label: 'Afiliados Diretos', value: directReferrals, color: 'text-blue-500' },
          { icon: Trophy, label: 'Vendas Totais', value: totalSales, color: 'text-amber-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className={`${currentTier.bgColor} ${currentTier.borderColor} border`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-background/50">
                    <Target className={`h-6 w-6 ${currentTier.textColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Progresso para {nextTier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Faltam {(nextTier.minPoints - totalPoints).toLocaleString()} pontos
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${nextTier.color} text-white text-sm font-medium flex items-center gap-2`}>
                  <nextTier.icon className="h-4 w-4" />
                  {nextTier.name}
                </div>
              </div>
              <Progress value={progressToNextTier} className="h-4" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{totalPoints.toLocaleString()} pts</span>
                <span>{nextTier.minPoints.toLocaleString()} pts</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Next Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Próximos Benefícios
            </CardTitle>
            <CardDescription>
              Desbloqueie ao atingir o próximo nível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(nextTier?.benefits || currentTier.benefits).map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <Award className={`h-5 w-5 ${nextTier ? 'text-muted-foreground' : 'text-primary'}`} />
                  <span className={nextTier ? 'text-muted-foreground' : 'text-foreground'}>
                    {benefit}
                  </span>
                </div>
              ))}
              {nextTier && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-medium">
                    {nextTier.commission}% de comissão
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: History, label: 'Histórico', to: '/vip/panel/history', color: 'hover:border-blue-500' },
          { icon: ShoppingBag, label: 'Loja de Recompensas', to: '/vip/panel/store', color: 'hover:border-amber-500' },
          { icon: Medal, label: 'Ranking', to: '/vip/panel/ranking', color: 'hover:border-emerald-500' },
          { 
            icon: Bell, 
            label: 'Notificações', 
            to: '/vip/panel/notifications', 
            color: 'hover:border-violet-500',
            badge: unreadNotifications > 0 ? unreadNotifications : null
          }
        ].map((item) => (
          <Button
            key={item.label}
            variant="outline"
            className={`h-auto py-6 flex flex-col gap-2 ${item.color} transition-all relative`}
            onClick={() => navigate(item.to)}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-sm">{item.label}</span>
            {item.badge && (
              <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </motion.div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-6"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividade Semanal
            </CardTitle>
            <CardDescription>
              Visualizações e vendas dos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Points System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Como Ganhar Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(actionPoints).map(([key, action]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-primary">+{action.points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
