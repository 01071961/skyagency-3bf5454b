'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SEOScoreIndicatorProps {
  name: string;
  shortDescription: string;
  slug: string;
  tags: string[];
  className?: string;
}

interface SEOCheck {
  label: string;
  passed: boolean;
  tip: string;
  weight: number;
}

export function SEOScoreIndicator({
  name,
  shortDescription,
  slug,
  tags,
  className
}: SEOScoreIndicatorProps) {
  const checks = useMemo<SEOCheck[]>(() => {
    return [
      {
        label: 'Título (3-60 chars)',
        passed: name.length >= 3 && name.length <= 60,
        tip: name.length < 3 ? 'Título muito curto' : name.length > 60 ? 'Título muito longo' : 'Tamanho ideal!',
        weight: 25
      },
      {
        label: 'Meta descrição',
        passed: shortDescription.length >= 50 && shortDescription.length <= 160,
        tip: !shortDescription ? 'Adicione uma descrição' : shortDescription.length < 50 ? 'Descrição muito curta (mín. 50 chars)' : shortDescription.length > 160 ? 'Descrição muito longa (máx. 160)' : 'Tamanho ideal!',
        weight: 25
      },
      {
        label: 'URL amigável',
        passed: slug.length >= 3 && !slug.includes('--') && !slug.startsWith('-'),
        tip: slug.length < 3 ? 'Slug muito curto' : 'URL otimizada para SEO',
        weight: 20
      },
      {
        label: 'Tags/palavras-chave',
        passed: tags.length >= 2 && tags.length <= 10,
        tip: tags.length < 2 ? 'Adicione pelo menos 2 tags' : tags.length > 10 ? 'Muitas tags (máx. 10)' : 'Quantidade ideal de tags',
        weight: 15
      },
      {
        label: 'Palavra-chave no título',
        passed: tags.length > 0 && tags.some(tag => name.toLowerCase().includes(tag.toLowerCase())),
        tip: 'Use uma palavra-chave principal no título',
        weight: 15
      }
    ];
  }, [name, shortDescription, slug, tags]);

  const score = useMemo(() => {
    return checks.reduce((acc, check) => acc + (check.passed ? check.weight : 0), 0);
  }, [checks]);

  const scoreColor = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  const progressColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <TooltipProvider>
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Score SEO</span>
          </div>
          <motion.span
            key={score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={cn("text-lg font-bold", scoreColor)}
          >
            {score}%
          </motion.span>
        </div>

        <Progress 
          value={score} 
          className="h-2"
          style={{
            '--progress-background': progressColor
          } as React.CSSProperties}
        />

        <div className="space-y-1.5">
          {checks.map((check, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between text-xs cursor-help">
                  <div className="flex items-center gap-1.5">
                    {check.passed ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                    )}
                    <span className={check.passed ? 'text-muted-foreground' : 'text-foreground'}>
                      {check.label}
                    </span>
                  </div>
                  <Badge 
                    variant={check.passed ? 'secondary' : 'outline'} 
                    className="text-[10px] h-4 px-1"
                  >
                    {check.weight}pts
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">{check.tip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
