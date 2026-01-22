'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Users, TrendingUp, DollarSign, Target, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateEarningsSimulatorProps {
  price: number;
  commissionRate: number;
  className?: string;
}

export function AffiliateEarningsSimulator({
  price,
  commissionRate,
  className
}: AffiliateEarningsSimulatorProps) {
  const [salesPerMonth, setSalesPerMonth] = useState(10);

  const calculations = useMemo(() => {
    const commissionPerSale = price * (commissionRate / 100);
    const monthlyEarnings = commissionPerSale * salesPerMonth;
    const yearlyEarnings = monthlyEarnings * 12;
    
    // Milestones
    const milestones = [
      { name: 'Iniciante', sales: 5, icon: Target },
      { name: 'Bronze', sales: 15, icon: Award },
      { name: 'Prata', sales: 30, icon: Award },
      { name: 'Ouro', sales: 50, icon: Sparkles },
      { name: 'Diamante', sales: 100, icon: Sparkles },
    ];
    
    const currentMilestone = milestones
      .filter(m => salesPerMonth >= m.sales)
      .pop() || milestones[0];
    
    const nextMilestone = milestones.find(m => m.sales > salesPerMonth);
    
    return {
      commissionPerSale,
      monthlyEarnings,
      yearlyEarnings,
      currentMilestone,
      nextMilestone,
      salesToNext: nextMilestone ? nextMilestone.sales - salesPerMonth : 0
    };
  }, [price, commissionRate, salesPerMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Simulador de Ganhos (Afiliado)
          <Badge variant="outline" className="ml-auto">
            {commissionRate}% comissão
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Per Sale */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <p className="text-xs text-muted-foreground mb-1">Comissão por venda</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(calculations.commissionPerSale)}
          </p>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Vendas por mês</Label>
            <Badge variant="secondary">{salesPerMonth} vendas</Badge>
          </div>
          <Slider
            value={[salesPerMonth]}
            onValueChange={([v]) => setSalesPerMonth(v)}
            min={1}
            max={150}
            step={1}
            className="py-2"
          />
        </div>

        {/* Earnings Grid */}
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-1 text-green-500 text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              Mensal
            </div>
            <p className="text-lg font-bold">{formatCurrency(calculations.monthlyEarnings)}</p>
          </motion.div>

          <motion.div
            className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-1 text-blue-500 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Anual
            </div>
            <p className="text-lg font-bold">{formatCurrency(calculations.yearlyEarnings)}</p>
          </motion.div>
        </div>

        {/* Milestone */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <calculations.currentMilestone.icon className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Nível: {calculations.currentMilestone.name}</span>
            </div>
            {calculations.nextMilestone && (
              <span className="text-muted-foreground">
                Faltam {calculations.salesToNext} vendas para {calculations.nextMilestone.name}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
