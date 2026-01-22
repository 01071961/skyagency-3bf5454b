import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Gift, Diamond, Star, Crown, ArrowLeft, 
  ShoppingCart, CheckCircle, Lock, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  points_required: number;
  cash_value: number | null;
  discount_percent: number | null;
  image_url: string | null;
  stock: number | null;
  tier_required: string;
}

const tierColors: Record<string, string> = {
  bronze: 'border-amber-600',
  silver: 'border-slate-400',
  gold: 'border-yellow-400',
  diamond: 'border-cyan-400',
  platinum: 'border-violet-400',
};

const tierIcons: Record<string, React.ReactNode> = {
  bronze: <Star className="h-4 w-4" />,
  silver: <Star className="h-4 w-4" />,
  gold: <Crown className="h-4 w-4" />,
  diamond: <Diamond className="h-4 w-4" />,
  platinum: <Diamond className="h-4 w-4" />,
};

export default function VIPRewards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [userTier, setUserTier] = useState('bronze');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [bankInfo, setBankInfo] = useState({ bank: '', agency: '', account: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/rewards');
      return;
    }

    if (user) {
      loadRewards();
    }
  }, [user, authLoading, navigate]);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        console.log('[VIPRewards] Sem token de autenticação');
        navigate('/auth?redirect=/vip/rewards');
        return;
      }

      const res = await supabase.functions.invoke('points-actions', {
        body: { action: 'get_rewards' },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setRewards(res.data.rewards || []);
        setUserBalance(res.data.user_balance || 0);
        setUserTier(res.data.user_tier || 'bronze');
      }
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    try {
      setIsRedeeming(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado.',
          variant: 'destructive',
        });
        return;
      }

      const res = await supabase.functions.invoke('points-actions', {
        body: {
          action: 'redeem_reward',
          reward_id: selectedReward.id,
          payout_method: payoutMethod,
          payout_details: payoutMethod === 'bank_transfer' ? { bank_info: bankInfo } : {},
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast({
          title: 'Resgate realizado!',
          description: `Você resgatou ${selectedReward.name}. ${
            selectedReward.type === 'cash' 
              ? 'O valor será enviado em até 24h.' 
              : 'Verifique seu email para mais detalhes.'
          }`,
        });
        setSelectedReward(null);
        setUserBalance(res.data.new_balance);
        loadRewards();
      } else {
        throw new Error(res.data?.error || 'Erro ao resgatar');
      }
    } catch (error: any) {
      toast({
        title: 'Erro no resgate',
        description: error.message || 'Não foi possível completar o resgate.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const canRedeem = (reward: Reward) => {
    const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const rewardTierIndex = tierOrder.indexOf(reward.tier_required);
    
    return userBalance >= reward.points_required && 
           userTierIndex >= rewardTierIndex &&
           (reward.stock === null || reward.stock > 0);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/vip/dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Recompensas</h1>
              <p className="text-muted-foreground mt-1">
                Use seus pontos para resgatar recompensas exclusivas
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Diamond className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">{userBalance} pontos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {rewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward, index) => {
              const available = canRedeem(reward);
              const tierLocked = (() => {
                const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];
                return tierOrder.indexOf(userTier) < tierOrder.indexOf(reward.tier_required);
              })();

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden ${tierColors[reward.tier_required]} border-2 ${!available ? 'opacity-75' : ''}`}>
                    {/* Tier Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="capitalize flex items-center gap-1">
                        {tierIcons[reward.tier_required]}
                        {reward.tier_required}
                      </Badge>
                    </div>

                    {reward.image_url && (
                      <div className="h-40 bg-muted">
                        <img 
                          src={reward.image_url} 
                          alt={reward.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {reward.type === 'cash' && <Wallet className="h-5 w-5 text-green-500" />}
                        {reward.type === 'product' && <ShoppingCart className="h-5 w-5 text-blue-500" />}
                        {reward.type === 'discount' && <Gift className="h-5 w-5 text-purple-500" />}
                        {reward.type === 'feature' && <Star className="h-5 w-5 text-yellow-500" />}
                        {reward.type === 'badge' && <Crown className="h-5 w-5 text-amber-500" />}
                        {reward.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{reward.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <Diamond className="h-4 w-4" />
                          {reward.points_required} pts
                        </div>
                        {reward.cash_value && (
                          <span className="text-green-500 font-semibold">
                            R$ {reward.cash_value.toFixed(2)}
                          </span>
                        )}
                        {reward.discount_percent && (
                          <span className="text-purple-500 font-semibold">
                            {reward.discount_percent}% OFF
                          </span>
                        )}
                      </div>

                      {reward.stock !== null && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {reward.stock > 0 ? `${reward.stock} disponíveis` : 'Esgotado'}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter>
                      {tierLocked ? (
                        <Button className="w-full" disabled>
                          <Lock className="mr-2 h-4 w-4" />
                          Requer {reward.tier_required}
                        </Button>
                      ) : !available ? (
                        <Button className="w-full" disabled>
                          {reward.stock === 0 ? 'Esgotado' : 'Pontos insuficientes'}
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => setSelectedReward(reward)}>
                          <Gift className="mr-2 h-4 w-4" />
                          Resgatar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma recompensa disponível</h3>
              <p className="text-muted-foreground">
                Novas recompensas serão adicionadas em breve!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Redeem Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Resgate</DialogTitle>
            <DialogDescription>
              Você está resgatando: {selectedReward?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-muted-foreground">Custo</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <Diamond className="h-4 w-4" />
                {selectedReward?.points_required} pontos
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-muted-foreground">Seu saldo atual</span>
              <span className="font-bold text-foreground">{userBalance} pontos</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
              <span className="text-muted-foreground">Saldo após resgate</span>
              <span className="font-bold text-green-500">
                {userBalance - (selectedReward?.points_required || 0)} pontos
              </span>
            </div>

            {selectedReward?.type === 'cash' && (
              <div className="space-y-4">
                <Label>Como deseja receber?</Label>
                <RadioGroup value={payoutMethod} onValueChange={setPayoutMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer">Transferência Bancária</Label>
                  </div>
                </RadioGroup>

                {payoutMethod === 'bank_transfer' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bank">Banco</Label>
                      <Input
                        id="bank"
                        value={bankInfo.bank}
                        onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                        placeholder="Ex: Nubank, Itaú"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="agency">Agência</Label>
                        <Input
                          id="agency"
                          value={bankInfo.agency}
                          onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                          placeholder="0001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account">Conta</Label>
                        <Input
                          id="account"
                          value={bankInfo.account}
                          onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                          placeholder="12345-6"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRedeem} 
              disabled={isRedeeming || (selectedReward?.type === 'cash' && (!bankInfo.bank || !bankInfo.account))}
            >
              {isRedeeming ? (
                'Processando...'
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
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
