import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Users, TrendingUp, Diamond,
  ArrowLeft, Crown, Star, Flame, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';

const tierColors: Record<string, string> = {
  bronze: 'text-amber-600',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  diamond: 'text-cyan-400',
  platinum: 'text-violet-400'
};

const tierIcons: Record<string, any> = {
  bronze: Star,
  silver: Star,
  gold: Crown,
  diamond: Diamond,
  platinum: Diamond
};

interface RankingEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar?: string;
  tier: string;
  value: number;
  isCurrentUser: boolean;
}

export default function VIPRanking() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [rankingType, setRankingType] = useState<'affiliates' | 'sales' | 'points'>('points');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [userRank, setUserRank] = useState<RankingEntry | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/panel/ranking');
      return;
    }
    if (user) {
      loadRankings();
    }
  }, [user, authLoading, rankingType]);

  const loadRankings = async () => {
    try {
      setIsLoading(true);

      let data: any[] = [];
      let valueField: string;

      switch (rankingType) {
        case 'affiliates':
          // Rank by direct referrals count
          const { data: affiliatesData, error: affiliatesError } = await supabase
            .from('vip_affiliates')
            .select('id, user_id, tier, direct_referrals_count')
            .eq('status', 'approved')
            .order('direct_referrals_count', { ascending: false })
            .limit(50);

          if (affiliatesError) throw affiliatesError;
          data = affiliatesData || [];
          valueField = 'direct_referrals_count';
          break;

        case 'sales':
          // Rank by total earnings
          const { data: salesData, error: salesError } = await supabase
            .from('vip_affiliates')
            .select('id, user_id, tier, total_earnings')
            .eq('status', 'approved')
            .order('total_earnings', { ascending: false })
            .limit(50);

          if (salesError) throw salesError;
          data = salesData || [];
          valueField = 'total_earnings';
          break;

        case 'points':
        default:
          // Rank by points
          const { data: pointsData, error: pointsError } = await supabase
            .from('user_points')
            .select('user_id, tier, total_earned')
            .order('total_earned', { ascending: false })
            .limit(50);

          if (pointsError) throw pointsError;
          data = pointsData || [];
          valueField = 'total_earned';
          break;
      }

      if (!data || data.length === 0) {
        setRankings([]);
        setUserRank(null);
        return;
      }

      // Get user profiles for names
      const userIds = data.map(entry => entry.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p.name || 'Usuário'])
      );

      const formattedRankings: RankingEntry[] = data.map((entry: any, index: number) => ({
        rank: index + 1,
        user_id: entry.user_id,
        name: profilesMap.get(entry.user_id) || `Usuário ${index + 1}`,
        tier: entry.tier || 'bronze',
        value: Number(entry[valueField]) || 0,
        isCurrentUser: entry.user_id === user?.id
      }));

      setRankings(formattedRankings);
      setUserRank(formattedRankings.find(r => r.isCurrentUser) || null);
    } catch (error) {
      console.error('Error loading rankings:', error);
      // Show empty state instead of mock data
      setRankings([]);
      setUserRank(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state component
  const EmptyRankingState = () => (
    <div className="text-center py-12">
      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">Nenhum participante no ranking ainda</p>
      <p className="text-sm text-muted-foreground mt-2">
        Seja o primeiro a conquistar pontos e subir no ranking!
      </p>
    </div>
  );

  const formatValue = (value: number, type: string) => {
    if (type === 'sales') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vip/panel')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="h-7 w-7 text-amber-500" />
              Ranking VIP
            </h1>
            <p className="text-muted-foreground mt-1">
              Veja os melhores afiliados do programa
            </p>
          </div>

          {userRank && (
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Flame className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Sua Posição</p>
                  <p className="text-2xl font-bold text-foreground">#{userRank.rank}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Ranking Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Tabs value={rankingType} onValueChange={(v) => setRankingType(v as any)}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Diamond className="h-4 w-4" />
              Pontos
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Afiliados
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Vendas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Top 3 Podium - Only show if we have at least 3 entries */}
      {rankings.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* 2nd Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-slate-400">
                  <AvatarFallback className="bg-slate-400/20 text-slate-400 text-xl font-bold">
                    {rankings[1].name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <p className="font-medium text-foreground mt-4 text-center text-sm truncate max-w-full">
                {rankings[1].name}
              </p>
              <Badge variant="secondary" className="mt-1">
                {formatValue(rankings[1].value, rankingType)}
              </Badge>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
                <Avatar className="h-20 w-20 border-4 border-yellow-500 ring-4 ring-yellow-500/20">
                  <AvatarFallback className="bg-yellow-500/20 text-yellow-500 text-2xl font-bold">
                    {rankings[0].name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <p className="font-semibold text-foreground mt-4 text-center truncate max-w-full">
                {rankings[0].name}
              </p>
              <Badge className="mt-1 bg-yellow-500 hover:bg-yellow-600">
                {formatValue(rankings[0].value, rankingType)}
              </Badge>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center pt-12">
              <div className="relative">
                <Avatar className="h-14 w-14 border-4 border-amber-600">
                  <AvatarFallback className="bg-amber-600/20 text-amber-600 text-lg font-bold">
                    {rankings[2].name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <p className="font-medium text-foreground mt-4 text-center text-sm truncate max-w-full">
                {rankings[2].name}
              </p>
              <Badge variant="secondary" className="mt-1">
                {formatValue(rankings[2].value, rankingType)}
              </Badge>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state when no rankings */}
      {rankings.length === 0 && <EmptyRankingState />}

      {/* Full Ranking List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Classificação Completa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {rankings.map((entry, index) => {
                const TierIcon = tierIcons[entry.tier] || Star;
                
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      entry.isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className={`h-10 w-10 border-2 ${tierColors[entry.tier]?.replace('text-', 'border-') || 'border-border'}`}>
                      <AvatarFallback className="text-sm font-medium">
                        {entry.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Tier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="text-xs text-primary ml-2">(você)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <TierIcon className={`h-3 w-3 ${tierColors[entry.tier]}`} />
                        <span className={`text-xs capitalize ${tierColors[entry.tier]}`}>
                          {entry.tier}
                        </span>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {formatValue(entry.value, rankingType)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rankingType === 'points' ? 'pontos' : 
                         rankingType === 'affiliates' ? 'afiliados' : 'em vendas'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
