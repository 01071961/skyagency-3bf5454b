import { motion } from 'framer-motion';
import { 
  DollarSign, Users, TrendingUp, Award,
  ShoppingCart, Percent, Crown, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AffiliateStatsCardProps {
  tier: string;
  totalEarnings: number;
  pendingEarnings: number;
  referralCount: number;
  conversionRate: number;
  salesThisMonth: number;
  tierProgress: number;
  nextTier?: string;
}

const tierConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  bronze: { color: 'text-amber-600', bgColor: 'bg-amber-500', icon: <Star className="h-4 w-4" /> },
  silver: { color: 'text-slate-400', bgColor: 'bg-slate-400', icon: <Star className="h-4 w-4" /> },
  gold: { color: 'text-yellow-500', bgColor: 'bg-yellow-500', icon: <Crown className="h-4 w-4" /> },
  diamond: { color: 'text-cyan-500', bgColor: 'bg-cyan-500', icon: <Crown className="h-4 w-4" /> },
  platinum: { color: 'text-violet-500', bgColor: 'bg-violet-500', icon: <Crown className="h-4 w-4" /> }
};

const tierLabels: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  diamond: 'Diamante',
  platinum: 'Platinum'
};

export function AffiliateStatsCard({
  tier,
  totalEarnings,
  pendingEarnings,
  referralCount,
  conversionRate,
  salesThisMonth,
  tierProgress,
  nextTier
}: AffiliateStatsCardProps) {
  const tierInfo = tierConfig[tier.toLowerCase()] || tierConfig.bronze;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        {/* Tier Header */}
        <div className={`${tierInfo.bgColor} px-6 py-4`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {tierInfo.icon}
              </div>
              <div>
                <p className="text-sm opacity-80">Seu Nível</p>
                <p className="text-xl font-bold">{tierLabels[tier.toLowerCase()] || tier}</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/30">
              VIP
            </Badge>
          </div>
          
          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Progresso para {tierLabels[nextTier.toLowerCase()]}</span>
                <span>{tierProgress}%</span>
              </div>
              <Progress value={tierProgress} className="h-2 bg-white/20" />
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-xs">Total Ganho</span>
              </div>
              <p className="text-lg font-bold text-green-500">
                {formatCurrency(totalEarnings)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <span className="text-xs">Pendente</span>
              </div>
              <p className="text-lg font-bold text-yellow-500">
                {formatCurrency(pendingEarnings)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Indicações</span>
              </div>
              <p className="text-lg font-bold">{referralCount}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Percent className="h-4 w-4 text-purple-500" />
                <span className="text-xs">Conversão</span>
              </div>
              <p className="text-lg font-bold">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Vendas este mês</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {salesThisMonth}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
