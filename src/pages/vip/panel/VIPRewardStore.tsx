import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Diamond, Gift, BookOpen, GraduationCap,
  Users, ArrowLeft, Star, Lock, Check, Sparkles, Trophy,
  Zap, Crown, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];

const rewardCategories = [
  { id: 'all', label: 'Todas', icon: Gift },
  { id: 'ebook', label: 'E-books', icon: BookOpen },
  { id: 'course', label: 'Cursos', icon: GraduationCap },
  { id: 'combo', label: 'Combos', icon: Sparkles },
  { id: 'mentoring', label: 'Mentorias', icon: Users },
  { id: 'discount', label: 'Descontos', icon: Target }
];

// Escala de pontos para recompensas
const pointRanges = [
  { min: 0, max: 100, label: 'Iniciante', description: 'E-books até R$50', icon: BookOpen, color: 'bg-slate-500' },
  { min: 101, max: 300, label: 'Avançado', description: 'Cursos até R$150', icon: GraduationCap, color: 'bg-blue-500' },
  { min: 301, max: 600, label: 'Expert', description: 'Combos e arquivos premium', icon: Sparkles, color: 'bg-purple-500' },
  { min: 601, max: 1000, label: 'Master', description: 'Mentorias + cursos até R$300', icon: Crown, color: 'bg-amber-500' },
  { min: 1001, max: Infinity, label: 'Elite', description: 'Mentorias VIP + acesso antecipado', icon: Trophy, color: 'bg-gradient-to-r from-amber-500 to-yellow-400' }
];

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: string;
  points_required: number;
  tier_required: string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
  cash_value: number | null;
  discount_percent: number | null;
}

interface PointRange {
  min: number;
  max: number;
  label: string;
  description: string;
}

export default function VIPRewardStore() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userTier, setUserTier] = useState('bronze');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [currentRange, setCurrentRange] = useState<PointRange | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/panel/store');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const getCurrentRange = (points: number) => {
    return pointRanges.find(r => points >= r.min && points <= r.max) || pointRanges[0];
  };

  const getNextRange = (points: number) => {
    const currentIndex = pointRanges.findIndex(r => points >= r.min && points <= r.max);
    return currentIndex < pointRanges.length - 1 ? pointRanges[currentIndex + 1] : null;
  };

  const getProgressToNextRange = (points: number) => {
    const range = getCurrentRange(points);
    const nextRange = getNextRange(points);
    if (!nextRange) return 100;
    const progressInRange = points - range.min;
    const rangeSize = range.max - range.min;
    return Math.min(100, (progressInRange / rangeSize) * 100);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get user points
      const { data: points } = await supabase
        .from('user_points')
        .select('current_balance, tier')
        .eq('user_id', user?.id)
        .single();

      const balance = points?.current_balance || 0;
      setUserPoints(balance);
      setUserTier(points?.tier || 'bronze');
      setCurrentRange(getCurrentRange(balance));

      // Get available rewards
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const canRedeem = (reward: Reward) => {
    if (reward.points_required > userPoints) return false;
    if (reward.stock !== null && reward.stock <= 0) return false;
    if (reward.tier_required) {
      const userTierIndex = tierOrder.indexOf(userTier);
      const requiredTierIndex = tierOrder.indexOf(reward.tier_required);
      if (userTierIndex < requiredTierIndex) return false;
    }
    return true;
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    try {
      setIsRedeeming(true);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        toast({ title: 'Erro', description: 'Sessão expirada', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('points-actions', {
        body: { 
          action: 'redeem_reward',
          reward_id: selectedReward.id
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: '🎁 Resgate realizado!',
          description: `Parabéns! Você trocou seus pontos por "${selectedReward.name}".`,
        });
        setUserPoints(data.new_balance);
        setCurrentRange(getCurrentRange(data.new_balance));
        setSelectedReward(null);
        loadData();
      } else {
        throw new Error(data?.error || 'Erro ao resgatar');
      }
    } catch (error: any) {
      toast({
        title: 'Erro no resgate',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'ebook': return BookOpen;
      case 'course': return GraduationCap;
      case 'mentoring': return Users;
      case 'discount': return Sparkles;
      default: return Gift;
    }
  };

  const filteredRewards = rewards.filter(r => 
    selectedCategory === 'all' || r.type === selectedCategory
  );

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
              <ShoppingBag className="h-7 w-7 text-primary" />
              Loja de Recompensas
            </h1>
            <p className="text-muted-foreground mt-1">
              Troque seus pontos por recompensas exclusivas
            </p>
          </div>

          <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Diamond className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Seus Pontos</p>
                <p className="text-2xl font-bold text-foreground">{userPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Escala de Pontos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Escala de Pontos
            </CardTitle>
            <CardDescription>
              Acumule pontos para desbloquear recompensas melhores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{currentRange?.label}</span>
                {getNextRange(userPoints) && (
                  <span className="text-muted-foreground">
                    Próximo: {getNextRange(userPoints)?.label} ({getNextRange(userPoints)?.min} pts)
                  </span>
                )}
              </div>
              <Progress value={getProgressToNextRange(userPoints)} className="h-3" />
            </div>

            {/* Range indicators */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {pointRanges.map((range, index) => {
                const RangeIcon = range.icon;
                const isActive = userPoints >= range.min;
                const isCurrent = currentRange?.label === range.label;

                return (
                  <div
                    key={range.label}
                    className={`p-3 rounded-lg border transition-all ${
                      isCurrent 
                        ? 'border-primary bg-primary/10' 
                        : isActive 
                          ? 'border-muted-foreground/30 bg-muted/50' 
                          : 'border-muted bg-muted/20 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded ${range.color} ${!isActive && 'grayscale'}`}>
                        <RangeIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                        {range.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {range.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {range.min}–{range.max === Infinity ? '∞' : range.max} pts
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
            {rewardCategories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <cat.icon className="h-4 w-4 mr-2" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma recompensa disponível
            </h3>
            <p className="text-muted-foreground">
              Novas recompensas serão adicionadas em breve!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward, index) => {
            const RewardIcon = getRewardIcon(reward.type);
            const isAvailable = canRedeem(reward);
            const needsMorePoints = reward.points_required > userPoints;
            const needsHigherTier = reward.tier_required && 
              tierOrder.indexOf(userTier) < tierOrder.indexOf(reward.tier_required);

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`h-full transition-all hover:shadow-lg ${!isAvailable ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    {/* Image or Icon */}
                    <div className="relative mb-4">
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-40 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                          <RewardIcon className="h-16 w-16 text-primary/50" />
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                          <Lock className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {reward.stock !== null && reward.stock < 10 && reward.stock > 0 && (
                        <Badge className="absolute top-2 right-2 bg-amber-500">
                          Últimas {reward.stock}!
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{reward.name}</h3>
                        <Badge variant="secondary" className="capitalize">
                          {reward.type}
                        </Badge>
                      </div>

                      {reward.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {reward.description}
                        </p>
                      )}

                      {/* Requirements */}
                      <div className="flex items-center gap-2">
                        <Diamond className="h-4 w-4 text-primary" />
                        <span className={`font-bold ${needsMorePoints ? 'text-muted-foreground' : 'text-primary'}`}>
                          {reward.points_required.toLocaleString()} pontos
                        </span>
                      </div>

                      {reward.tier_required && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className={`text-sm capitalize ${needsHigherTier ? 'text-muted-foreground' : 'text-foreground'}`}>
                            Nível {reward.tier_required} ou superior
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        className="w-full mt-4"
                        disabled={!isAvailable}
                        onClick={() => setSelectedReward(reward)}
                      >
                        {isAvailable ? (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Resgatar
                          </>
                        ) : needsMorePoints ? (
                          `Faltam ${(reward.points_required - userPoints).toLocaleString()} pts`
                        ) : needsHigherTier ? (
                          `Requer nível ${reward.tier_required}`
                        ) : (
                          'Indisponível'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Redeem Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Resgate</DialogTitle>
            <DialogDescription>
              Você está prestes a resgatar esta recompensa.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="p-3 rounded-xl bg-primary/10">
                  {(() => {
                    const RewardIcon = getRewardIcon(selectedReward.type);
                    return <RewardIcon className="h-6 w-6 text-primary" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{selectedReward.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReward.points_required.toLocaleString()} pontos
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-foreground">
                  <strong>Saldo atual:</strong> {userPoints.toLocaleString()} pontos
                </p>
                <p className="text-sm text-foreground">
                  <strong>Após resgate:</strong> {(userPoints - selectedReward.points_required).toLocaleString()} pontos
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRedeem} disabled={isRedeeming}>
              {isRedeeming ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Resgate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
