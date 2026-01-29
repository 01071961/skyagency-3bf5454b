'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Star, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BADGE_CONFIG, Badge as BadgeType, getRarityColor, getRarityLabel, checkBadgeEarned } from '@/lib/affiliate/badges';

interface BadgeDisplayProps {
  earnedBadges: string[];
  stats: {
    referrals: number;
    totalSales: number;
    currentTier: string;
    streak: number;
    completedChallenges: string[];
  };
  className?: string;
  showLocked?: boolean;
  compact?: boolean;
}

export function BadgeDisplay({
  earnedBadges,
  stats,
  className,
  showLocked = true,
  compact = false,
}: BadgeDisplayProps) {
  const categorizedBadges = useMemo(() => {
    const categories = {
      referral: { label: 'Indicações', badges: [] as (BadgeType & { earned: boolean })[] },
      sales: { label: 'Vendas', badges: [] as (BadgeType & { earned: boolean })[] },
      tier: { label: 'Tiers', badges: [] as (BadgeType & { earned: boolean })[] },
      challenge: { label: 'Desafios', badges: [] as (BadgeType & { earned: boolean })[] },
      special: { label: 'Especiais', badges: [] as (BadgeType & { earned: boolean })[] },
    };

    BADGE_CONFIG.forEach((badge) => {
      const earned = earnedBadges.includes(badge.id) || checkBadgeEarned(badge, stats);
      if (earned || showLocked) {
        categories[badge.category].badges.push({ ...badge, earned });
      }
    });

    return categories;
  }, [earnedBadges, stats, showLocked]);

  const totalEarned = Object.values(categorizedBadges).reduce(
    (sum, cat) => sum + cat.badges.filter(b => b.earned).length,
    0
  );

  const totalBadges = BADGE_CONFIG.length;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <TooltipProvider>
          {Object.values(categorizedBadges).flatMap((cat) =>
            cat.badges
              .filter((b) => b.earned)
              .map((badge) => (
                <Tooltip key={badge.id}>
                  <TooltipTrigger>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                        "bg-gradient-to-br shadow-lg",
                        getRarityColor(badge.rarity)
                      )}
                    >
                      {badge.icon}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {getRarityLabel(badge.rarity)} • +{badge.points} pts
                    </Badge>
                  </TooltipContent>
                </Tooltip>
              ))
          )}
        </TooltipProvider>
        {totalEarned < totalBadges && (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
            +{totalBadges - totalEarned}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Badges & Conquistas
          </CardTitle>
          <Badge variant="secondary">
            {totalEarned}/{totalBadges}
          </Badge>
        </div>
        <Progress value={(totalEarned / totalBadges) * 100} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categorizedBadges).map(([key, category]) => {
          if (category.badges.length === 0) return null;
          
          return (
            <div key={key}>
              <p className="text-sm font-medium mb-2">{category.label}</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                <TooltipProvider>
                  {category.badges.map((badge, index) => (
                    <Tooltip key={badge.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105",
                            badge.earned
                              ? cn("bg-gradient-to-br shadow-lg", getRarityColor(badge.rarity))
                              : "bg-muted/50 opacity-50"
                          )}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          {badge.earned && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {!badge.earned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-1">
                            {badge.icon} {badge.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                badge.earned && "bg-gradient-to-r text-white border-0",
                                badge.earned && getRarityColor(badge.rarity)
                              )}
                            >
                              {getRarityLabel(badge.rarity)}
                            </Badge>
                            <span className="text-xs text-primary font-medium">+{badge.points} pts</span>
                          </div>
                          {!badge.earned && (
                            <p className="text-xs text-amber-500 mt-1">
                              {badge.criteria.type === 'referrals' && `Necessário: ${badge.criteria.value} indicações`}
                              {badge.criteria.type === 'sales' && `Necessário: R$ ${badge.criteria.value} em vendas`}
                              {badge.criteria.type === 'tier' && `Alcance o tier ${badge.criteria.value}`}
                              {badge.criteria.type === 'streak' && `${badge.criteria.value} dias consecutivos`}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
