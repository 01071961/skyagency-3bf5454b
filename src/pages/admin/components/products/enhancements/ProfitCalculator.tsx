'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, TrendingUp, Users, DollarSign, Percent, Info, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitCalculatorProps {
  price: number;
  originalPrice?: number | null;
  commissionRate: number;
  affiliateEnabled: boolean;
  maxInstallments: number;
  className?: string;
}

export function ProfitCalculator({
  price,
  originalPrice,
  commissionRate,
  affiliateEnabled,
  maxInstallments,
  className
}: ProfitCalculatorProps) {
  const [salesVolume, setSalesVolume] = useState(50);
  const [affiliateSalesPercent, setAffiliateSalesPercent] = useState(30);

  const calculations = useMemo(() => {
    // Stripe fees: 3.99% + R$ 0.39 por transação
    const stripeFeePercent = 3.99 / 100;
    const stripeFeeFixed = 0.39;
    const stripePerTransaction = price * stripeFeePercent + stripeFeeFixed;
    
    // Direct sales (without affiliate)
    const directSalesCount = Math.round(salesVolume * (1 - affiliateSalesPercent / 100));
    const directRevenue = directSalesCount * price;
    const directFees = directSalesCount * stripePerTransaction;
    const directProfit = directRevenue - directFees;

    // Affiliate sales
    const affiliateSalesCount = affiliateEnabled ? Math.round(salesVolume * (affiliateSalesPercent / 100)) : 0;
    const affiliateRevenue = affiliateSalesCount * price;
    const affiliateFees = affiliateSalesCount * stripePerTransaction;
    const affiliateCommissionTotal = affiliateSalesCount * price * (commissionRate / 100);
    const affiliateProfit = affiliateRevenue - affiliateFees - affiliateCommissionTotal;

    // Total
    const totalRevenue = directRevenue + affiliateRevenue;
    const totalProfit = directProfit + affiliateProfit;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Discount if original price exists
    const discountPercent = originalPrice && originalPrice > price 
      ? ((originalPrice - price) / originalPrice) * 100 
      : 0;

    return {
      directSalesCount,
      directRevenue,
      directProfit,
      affiliateSalesCount,
      affiliateRevenue,
      affiliateProfit,
      affiliateCommissionTotal,
      totalRevenue,
      totalProfit,
      profitMargin,
      stripePerTransaction,
      discountPercent
    };
  }, [price, originalPrice, commissionRate, affiliateEnabled, salesVolume, affiliateSalesPercent]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TooltipProvider>
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            Calculadora de Lucro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Preço de venda</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(price)}</p>
            </div>
            {calculations.discountPercent > 0 && (
              <Badge variant="destructive" className="text-xs">
                -{calculations.discountPercent.toFixed(0)}% OFF
              </Badge>
            )}
          </div>

          {/* Simulators */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Volume de vendas/mês</Label>
                <Badge variant="secondary">{salesVolume} vendas</Badge>
              </div>
              <Slider
                value={[salesVolume]}
                onValueChange={([v]) => setSalesVolume(v)}
                min={1}
                max={500}
                step={1}
                className="py-2"
              />
            </div>

            {affiliateEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    Vendas via afiliados
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Percentual de vendas geradas por afiliados</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Badge variant="outline">{affiliateSalesPercent}%</Badge>
                </div>
                <Slider
                  value={[affiliateSalesPercent]}
                  onValueChange={([v]) => setAffiliateSalesPercent(v)}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <motion.div
              className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-1 text-blue-500 mb-1">
                <DollarSign className="w-3 h-3" />
                <span>Faturamento</span>
              </div>
              <p className="font-semibold">{formatCurrency(calculations.totalRevenue)}</p>
            </motion.div>

            <motion.div
              className="p-2 rounded-lg bg-green-500/10 border border-green-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-1 text-green-500 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Lucro Líquido</span>
              </div>
              <p className="font-semibold">{formatCurrency(calculations.totalProfit)}</p>
            </motion.div>

            {affiliateEnabled && (
              <motion.div
                className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-1 text-purple-500 mb-1">
                  <Users className="w-3 h-3" />
                  <span>Comissões</span>
                </div>
                <p className="font-semibold">{formatCurrency(calculations.affiliateCommissionTotal)}</p>
              </motion.div>
            )}

            <motion.div
              className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-1 text-orange-500 mb-1">
                <Percent className="w-3 h-3" />
                <span>Margem</span>
              </div>
              <p className="font-semibold">{calculations.profitMargin.toFixed(1)}%</p>
            </motion.div>
          </div>

          {/* Fee Breakdown */}
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Taxa Stripe por transação: {formatCurrency(calculations.stripePerTransaction)}
              <span className="text-muted-foreground/60">(3.99% + R$ 0.39)</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
