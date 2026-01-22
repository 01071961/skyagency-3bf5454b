'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallmentSimulatorProps {
  price: number;
  maxInstallments: number;
  className?: string;
}

export function InstallmentSimulator({
  price,
  maxInstallments,
  className
}: InstallmentSimulatorProps) {
  const installments = useMemo(() => {
    const result = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      // Taxa de juros progressiva (simulando cartão de crédito)
      let interestRate = 0;
      if (i > 1 && i <= 3) interestRate = 0;
      else if (i > 3 && i <= 6) interestRate = 0.0199; // 1.99% ao mês
      else if (i > 6 && i <= 10) interestRate = 0.0249; // 2.49% ao mês
      else if (i > 10) interestRate = 0.0299; // 2.99% ao mês
      
      const totalWithInterest = interestRate > 0 
        ? price * Math.pow(1 + interestRate, i) 
        : price;
      
      const installmentValue = totalWithInterest / i;
      const isNoInterest = interestRate === 0;
      
      result.push({
        count: i,
        value: installmentValue,
        total: totalWithInterest,
        isNoInterest,
        interestRate: interestRate * 100
      });
    }
    
    return result;
  }, [price, maxInstallments]);

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
          <CreditCard className="w-4 h-4 text-primary" />
          Simulador de Parcelamento
          <Badge variant="secondary" className="ml-auto text-xs">
            até {maxInstallments}x
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2">
          {installments.map((inst) => (
            <div
              key={inst.count}
              className={cn(
                "flex items-center justify-between py-1.5 px-2 rounded text-xs",
                inst.isNoInterest ? "bg-green-500/10" : "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium w-6">{inst.count}x</span>
                <span className="font-semibold">{formatCurrency(inst.value)}</span>
              </div>
              <div className="flex items-center gap-2">
                {inst.isNoInterest ? (
                  <Badge variant="default" className="text-[10px] h-4 px-1 bg-green-600">
                    <Check className="w-2 h-2 mr-0.5" />
                    Sem juros
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-[10px]">
                    Total: {formatCurrency(inst.total)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          * Juros podem variar conforme bandeira do cartão
        </p>
      </CardContent>
    </Card>
  );
}
