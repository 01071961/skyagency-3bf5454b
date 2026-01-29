'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Crown, TrendingUp, Users, DollarSign, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getTierConfig, formatBRL } from '@/lib/affiliate/tierConfig';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar_url: string | null;
  tier: string;
  points: number;
  sales: number;
  referrals: number;
}

interface LeaderboardProps {
  period?: 'weekly' | 'monthly' | 'alltime';
  limit?: number;
  className?: string;
  showCurrentUser?: boolean;
  currentUserId?: string;
}

export function Leaderboard({
  period: initialPeriod = 'monthly',
  limit = 10,
  className,
  showCurrentUser = true,
  currentUserId,
}: LeaderboardProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [metric, setMetric] = useState<'points' | 'sales' | 'referrals'>('points');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['affiliate-leaderboard', period, metric, limit],
    queryFn: async () => {
      // Buscar dados de afiliados com perfis
      const { data: affiliates, error } = await supabase
        .from('vip_affiliates')
        .select(`
          id,
          user_id,
          tier,
          total_earnings,
          direct_referrals_count,
          profiles:user_id (name, avatar_url)
        `)
        .eq('status', 'approved')
        .order('total_earnings', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Buscar pontos dos usuários
      const userIds = affiliates?.map(a => a.user_id).filter(Boolean) || [];
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('user_id, total_earned, current_balance')
        .in('user_id', userIds);

      const pointsMap = new Map(pointsData?.map(p => [p.user_id, p]) || []);

      // Mapear para formato do leaderboard
      const entries: LeaderboardEntry[] = (affiliates || []).map((affiliate, index) => {
        const points = pointsMap.get(affiliate.user_id);
        return {
          rank: index + 1,
          id: affiliate.id,
          name: (affiliate.profiles as any)?.name || 'Afiliado',
          avatar_url: (affiliate.profiles as any)?.avatar_url || null,
          tier: affiliate.tier || 'bronze',
          points: points?.total_earned || 0,
          sales: affiliate.total_earnings || 0,
          referrals: affiliate.direct_referrals_count || 0,
        };
      });

      // Ordenar pelo métrico selecionado
      entries.sort((a, b) => b[metric] - a[metric]);

      // Reatribuir ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    },
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return 'bg-muted/50 border-border/50';
    }
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (metric) {
      case 'points':
        return `${entry.points.toLocaleString()} pts`;
      case 'sales':
        return formatBRL(entry.sales);
      case 'referrals':
        return `${entry.referrals} indicações`;
    }
  };

  const currentUserEntry = leaderboard?.find(e => e.id === currentUserId);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top afiliados do mês</CardDescription>
          </div>
          
          <Tabs value={metric} onValueChange={(v) => setMetric(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="points" className="text-xs px-2">
                <Flame className="w-3 h-3 mr-1" />
                Pontos
              </TabsTrigger>
              <TabsTrigger value="sales" className="text-xs px-2">
                <DollarSign className="w-3 h-3 mr-1" />
                Vendas
              </TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs px-2">
                <Users className="w-3 h-3 mr-1" />
                Indicações
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : leaderboard?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum afiliado no ranking ainda</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {leaderboard?.map((entry, index) => {
              const tierConfig = getTierConfig(entry.tier);
              const isCurrentUser = entry.id === currentUserId;
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    getRankBgColor(entry.rank),
                    isCurrentUser && "ring-2 ring-primary"
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2" style={{ borderColor: entry.rank <= 3 ? 'hsl(var(--primary))' : 'transparent' }}>
                    <AvatarImage src={entry.avatar_url || ''} />
                    <AvatarFallback className={cn("bg-gradient-to-br text-white", tierConfig.gradient)}>
                      {entry.name[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{entry.name}</p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                          Você
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs border-0", tierConfig.bgColor, tierConfig.textColor)}
                      >
                        {tierConfig.emoji} {tierConfig.labelPT}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Metric */}
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {getMetricValue(entry)}
                    </p>
                    {entry.rank <= 3 && (
                      <p className="text-xs text-muted-foreground">
                        {entry.rank === 1 ? '🏆 Top 1' : entry.rank === 2 ? '🥈 Top 2' : '🥉 Top 3'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        
        {/* Current user if not in top */}
        {showCurrentUser && currentUserId && currentUserEntry && currentUserEntry.rank > limit && (
          <>
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">Sua posição</span>
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border ring-2 ring-primary",
                "bg-primary/5"
              )}
            >
              <div className="w-8 flex justify-center">
                <span className="text-sm font-bold">{currentUserEntry.rank}º</span>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUserEntry.avatar_url || ''} />
                <AvatarFallback>{currentUserEntry.name[0]?.toUpperCase() || 'V'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{currentUserEntry.name}</p>
                <Badge variant="outline" className="text-xs">
                  {getTierConfig(currentUserEntry.tier).emoji} {getTierConfig(currentUserEntry.tier).labelPT}
                </Badge>
              </div>
              <p className="font-bold text-primary">
                {getMetricValue(currentUserEntry)}
              </p>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
