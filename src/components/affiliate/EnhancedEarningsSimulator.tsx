'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, TrendingUp, DollarSign, Target, Award, Sparkles, 
  Calculator, Crown, Diamond, Star, Coins, ArrowRight,
  ChevronDown, ChevronUp, Info, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TIER_CONFIG, 
  calculatePoints, 
  calculateTierFromCriteria, 
  calculateTierProgress,
  formatBRL,
  getTierConfig,
  TierKey 
} from '@/lib/affiliate/tierConfig';
import { EARNING_MILESTONES } from '@/lib/affiliate/badges';

interface EnhancedEarningsSimulatorProps {
  initialPrice?: number;
  initialCommissionRate?: number;
  className?: string;
  showTierInfo?: boolean;
  currentTier?: TierKey;
  currentPoints?: number;
  currentReferrals?: number;
  currentReferralSales?: number;
}

export function EnhancedEarningsSimulator({
  initialPrice = 297,
  initialCommissionRate = 10,
  className,
  showTierInfo = true,
  currentTier = 'bronze',
  currentPoints = 0,
  currentReferrals = 0,
  currentReferralSales = 0,
}: EnhancedEarningsSimulatorProps) {
  const [salesPerMonth, setSalesPerMonth] = useState(10);
  const [directSales, setDirectSales] = useState(5000);
  const [downlineSales, setDownlineSales] = useState(2000);
  const [referrals, setReferrals] = useState(currentReferrals);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Calcular com base no tier atual
  const tierConfig = getTierConfig(currentTier);
  const commissionRate = tierConfig.commissionRate;

  const calculations = useMemo(() => {
    // Cálculo de pontos híbrido
    const directPoints = Math.floor(directSales / 100);
    const downlinePoints = Math.floor(downlineSales / 100) * 0.5;
    const totalPoints = directPoints + downlinePoints;
    
    // Determinar tier projetado
    const projectedTier = calculateTierFromCriteria(
      referrals,
      directSales + downlineSales,
      currentPoints + totalPoints
    );
    const projectedTierConfig = getTierConfig(projectedTier);
    
    // Calcular comissões
    const commissionPerSale = initialPrice * (projectedTierConfig.commissionRate / 100);
    const monthlyEarnings = commissionPerSale * salesPerMonth;
    const yearlyEarnings = monthlyEarnings * 12;
    
    // Calcular comissões MLM (se tiver downline)
    const mlmRates = projectedTierConfig.mlmRates;
    const avgDownlineSale = downlineSales / (referrals || 1);
    const mlmEarnings = {
      level1: referrals * avgDownlineSale * (mlmRates[0] / 100),
      level2: Math.floor(referrals * 0.5) * avgDownlineSale * (mlmRates[1] / 100),
      level3: Math.floor(referrals * 0.25) * avgDownlineSale * (mlmRates[2] / 100),
      level4: Math.floor(referrals * 0.1) * avgDownlineSale * (mlmRates[3] / 100),
    };
    const totalMlmMonthly = mlmEarnings.level1 + mlmEarnings.level2 + mlmEarnings.level3 + mlmEarnings.level4;
    
    // Progresso para próximo tier
    const progress = calculateTierProgress(
      projectedTier,
      referrals,
      directSales + downlineSales,
      currentPoints + totalPoints
    );
    
    // Milestone atual
    const currentMilestone = EARNING_MILESTONES
      .filter(m => salesPerMonth >= m.sales)
      .pop() || EARNING_MILESTONES[0];
    
    const nextMilestone = EARNING_MILESTONES.find(m => m.sales > salesPerMonth);
    
    return {
      directPoints,
      downlinePoints,
      totalPoints,
      projectedTier,
      projectedTierConfig,
      commissionPerSale,
      monthlyEarnings,
      yearlyEarnings,
      mlmEarnings,
      totalMlmMonthly,
      progress,
      currentMilestone,
      nextMilestone,
      salesToNext: nextMilestone ? nextMilestone.sales - salesPerMonth : 0,
      totalMonthlyWithMlm: monthlyEarnings + totalMlmMonthly,
    };
  }, [initialPrice, salesPerMonth, directSales, downlineSales, referrals, currentPoints, currentTier]);

  const tierIcons: Record<string, React.ReactNode> = {
    bronze: <Star className="w-4 h-4" />,
    silver: <Star className="w-4 h-4" />,
    gold: <Crown className="w-4 h-4" />,
    diamond: <Diamond className="w-4 h-4" />,
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Simulador de Ganhos SKY
        </CardTitle>
        <CardDescription>
          Calcule seus ganhos potenciais como afiliado
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="earnings" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              Ganhos
            </TabsTrigger>
            <TabsTrigger value="points" className="text-xs">
              <Coins className="w-3 h-3 mr-1" />
              Pontos
            </TabsTrigger>
            <TabsTrigger value="mlm" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              MLM
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Ganhos */}
          <TabsContent value="earnings" className="space-y-4 mt-4">
            {/* Tier Atual e Projetado */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("border-0", TIER_CONFIG[currentTier].bgColor, TIER_CONFIG[currentTier].textColor)}>
                  {TIER_CONFIG[currentTier].emoji} {TIER_CONFIG[currentTier].labelPT}
                </Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <Badge className={cn("border-0 bg-gradient-to-r text-white", calculations.projectedTierConfig.gradient)}>
                  {calculations.projectedTierConfig.emoji} {calculations.projectedTierConfig.labelPT}
                </Badge>
              </div>
              <Badge variant="secondary">
                {calculations.projectedTierConfig.commissionRate}% comissão
              </Badge>
            </div>
            
            {/* Comissão por Venda */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground mb-1">Comissão por venda</p>
              <p className="text-3xl font-bold text-primary">
                {formatBRL(calculations.commissionPerSale)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Produto: {formatBRL(initialPrice)} • Taxa: {calculations.projectedTierConfig.commissionRate}%
              </p>
            </div>

            {/* Slider de Vendas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Vendas por mês</Label>
                <Badge variant="secondary" className="text-lg font-bold">
                  {salesPerMonth}
                </Badge>
              </div>
              <Slider
                value={[salesPerMonth]}
                onValueChange={([v]) => setSalesPerMonth(v)}
                min={1}
                max={200}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 venda</span>
                <span>200 vendas</span>
              </div>
            </div>

            {/* Grid de Ganhos */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-2 text-green-500 text-xs mb-1">
                  <DollarSign className="w-4 h-4" />
                  Mensal (Direto)
                </div>
                <p className="text-xl font-bold">{formatBRL(calculations.monthlyEarnings)}</p>
              </motion.div>

              <motion.div
                className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 text-blue-500 text-xs mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Anual (Direto)
                </div>
                <p className="text-xl font-bold">{formatBRL(calculations.yearlyEarnings)}</p>
              </motion.div>
            </div>

            {/* Total com MLM */}
            {calculations.totalMlmMonthly > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                  <Sparkles className="w-4 h-4" />
                  Total Mensal (Direto + MLM)
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {formatBRL(calculations.totalMonthlyWithMlm)}
                </p>
              </div>
            )}

            {/* Milestone */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{calculations.currentMilestone.icon}</span>
                  <span className="font-medium">Nível: {calculations.currentMilestone.name}</span>
                </div>
                {calculations.nextMilestone && (
                  <span className="text-muted-foreground text-xs">
                    Faltam {calculations.salesToNext} vendas para {calculations.nextMilestone.name}
                  </span>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Tab Pontos */}
          <TabsContent value="points" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-violet-500" />
                <span className="font-semibold">Sistema de Pontuação Híbrida</span>
              </div>
              <p className="text-xs text-muted-foreground">
                1 ponto por R$100 em vendas diretas + 0.5 pontos por R$100 em vendas de downline
              </p>
            </div>
            
            {/* Sliders de Vendas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Vendas Diretas (R$)</Label>
                  <span className="text-sm font-bold text-green-500">{formatBRL(directSales)}</span>
                </div>
                <Slider
                  value={[directSales]}
                  onValueChange={([v]) => setDirectSales(v)}
                  min={0}
                  max={100000}
                  step={500}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Vendas Downline (R$)</Label>
                  <span className="text-sm font-bold text-blue-500">{formatBRL(downlineSales)}</span>
                </div>
                <Slider
                  value={[downlineSales]}
                  onValueChange={([v]) => setDownlineSales(v)}
                  min={0}
                  max={200000}
                  step={1000}
                />
              </div>
            </div>
            
            {/* Cálculo de Pontos */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-muted-foreground">Direto</p>
                <p className="text-xl font-bold text-green-500">{calculations.directPoints}</p>
                <p className="text-[10px] text-muted-foreground">pts</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-muted-foreground">Downline</p>
                <p className="text-xl font-bold text-blue-500">{calculations.downlinePoints}</p>
                <p className="text-[10px] text-muted-foreground">pts (×0.5)</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">{calculations.totalPoints}</p>
                <p className="text-[10px] text-muted-foreground">pontos</p>
              </div>
            </div>
            
            {/* Exemplos */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs font-medium flex items-center gap-1">
                <Info className="w-3 h-3" />
                Exemplos de cálculo:
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• R$20k direto + R$10k downline = 200 + 50 = <span className="text-foreground font-medium">250 pts → Bronze</span></p>
                <p>• R$50k direto + R$40k downline = 500 + 200 = <span className="text-foreground font-medium">700 pts → Prata</span></p>
                <p>• R$200k direto + R$150k downline = 2.000 + 750 = <span className="text-foreground font-medium">2.750 pts → Ouro</span></p>
              </div>
            </div>
            
            {/* Progresso para próximo tier */}
            {calculations.progress.nextTier && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso para {getTierConfig(calculations.progress.nextTier).labelPT}</span>
                  <span className="font-bold">{Math.round(calculations.progress.overallProgress)}%</span>
                </div>
                <Progress value={calculations.progress.overallProgress} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p>Indicações: {Math.round(calculations.progress.referralsProgress)}%</p>
                    <p className="text-foreground">Faltam {calculations.progress.referralsNeeded}</p>
                  </div>
                  <div>
                    <p>Vendas: {Math.round(calculations.progress.salesProgress)}%</p>
                    <p className="text-foreground">Faltam {formatBRL(calculations.progress.salesNeeded)}</p>
                  </div>
                  <div>
                    <p>Pontos: {Math.round(calculations.progress.pointsProgress)}%</p>
                    <p className="text-foreground">Faltam {calculations.progress.pointsNeeded}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Rollover */}
            <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 text-amber-600 text-xs">
              <Zap className="w-4 h-4" />
              <span>50% dos pontos são transferidos para o próximo mês (rollover)</span>
            </div>
          </TabsContent>
          
          {/* Tab MLM */}
          <TabsContent value="mlm" className="space-y-4 mt-4">
            {/* Slider de Indicações */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Indicações Diretas</Label>
                <Badge variant="secondary">{referrals}</Badge>
              </div>
              <Slider
                value={[referrals]}
                onValueChange={([v]) => setReferrals(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>
            
            {/* Taxas MLM por Nível */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-3">Taxas MLM por Nível</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {calculations.projectedTierConfig.mlmRates.map((rate, index) => (
                  <div key={index} className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">Nível {index + 1}</p>
                    <p className="text-lg font-bold text-primary">{rate}%</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Projeção de Ganhos MLM */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Projeção de Ganhos MLM (mensal)</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-sm">Nível 1 ({referrals} afiliados)</span>
                  <span className="font-bold text-green-500">{formatBRL(calculations.mlmEarnings.level1)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-blue-500/10">
                  <span className="text-sm">Nível 2 (~{Math.floor(referrals * 0.5)} afiliados)</span>
                  <span className="font-bold text-blue-500">{formatBRL(calculations.mlmEarnings.level2)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-purple-500/10">
                  <span className="text-sm">Nível 3 (~{Math.floor(referrals * 0.25)} afiliados)</span>
                  <span className="font-bold text-purple-500">{formatBRL(calculations.mlmEarnings.level3)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-500/10">
                  <span className="text-sm">Nível 4 (~{Math.floor(referrals * 0.1)} afiliados)</span>
                  <span className="font-bold text-amber-500">{formatBRL(calculations.mlmEarnings.level4)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                <span className="font-semibold">Total MLM Mensal</span>
                <span className="text-xl font-bold text-primary">{formatBRL(calculations.totalMlmMonthly)}</span>
              </div>
            </div>
            
            {/* Aviso */}
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Info className="w-3 h-3" />
                Projeção baseada em média de vendas por afiliado. Resultados reais podem variar.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Tier Info */}
        {showTierInfo && (
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="text-sm">Ver requisitos dos tiers</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {Object.values(TIER_CONFIG).map((tier) => (
                      <div 
                        key={tier.key}
                        className={cn(
                          "p-3 rounded-lg text-center",
                          tier.bgColor,
                          tier.key === calculations.projectedTier && "ring-2 ring-primary"
                        )}
                      >
                        <span className="text-2xl">{tier.emoji}</span>
                        <p className="font-bold text-sm">{tier.labelPT}</p>
                        <p className="text-xs text-muted-foreground">{tier.commissionRate}% comissão</p>
                        <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                          <p>{tier.minReferrals}+ indicações</p>
                          <p>{formatBRL(tier.minReferralSales)}+ vendas</p>
                          <p>{tier.minPoints}-{tier.maxPoints === Infinity ? '∞' : tier.maxPoints} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
