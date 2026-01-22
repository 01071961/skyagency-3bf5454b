import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles, ArrowUpCircle, Loader2, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { cn } from '@/lib/utils';

type RequiredTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier?: RequiredTier;
  requiredTiers?: RequiredTier[];
  featureName?: string;
  featureDescription?: string;
  benefits?: string[];
  showUpgradeButton?: boolean;
  upgradeRoute?: string;
  fallback?: ReactNode;
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];
const TIER_ALIASES: Record<string, string> = {
  'ouro': 'gold',
  'prata': 'silver',
  'platina': 'platinum',
  'diamante': 'diamond'
};

const TIER_INFO: Record<string, { label: string; icon: string; color: string }> = {
  bronze: { label: 'Bronze', icon: '🥉', color: 'text-orange-600' },
  silver: { label: 'Prata', icon: '🥈', color: 'text-gray-400' },
  gold: { label: 'Ouro', icon: '🥇', color: 'text-amber-500' },
  diamond: { label: 'Diamante', icon: '💎', color: 'text-blue-400' },
  platinum: { label: 'Platina', icon: '👑', color: 'text-purple-500' }
};

function normalizeTier(tier: string | null | undefined): string {
  if (!tier) return 'bronze';
  const lower = tier.toLowerCase();
  return TIER_ALIASES[lower] || lower;
}

function hasTierAccess(userTier: string | null, requiredTier: RequiredTier): boolean {
  const normalizedUser = normalizeTier(userTier);
  const userIndex = TIER_ORDER.indexOf(normalizedUser);
  const requiredIndex = TIER_ORDER.indexOf(requiredTier);
  
  if (userIndex === -1) return false;
  return userIndex >= requiredIndex;
}

function hasTierAccessMultiple(userTier: string | null, requiredTiers: RequiredTier[]): boolean {
  if (requiredTiers.length === 0) return true;
  return requiredTiers.some(tier => hasTierAccess(userTier, tier));
}

export function SubscriptionGate({
  children,
  requiredTier = 'gold',
  requiredTiers,
  featureName = 'Recurso Premium',
  featureDescription = 'Este recurso está disponível apenas para membros premium.',
  benefits = [],
  showUpgradeButton = true,
  upgradeRoute = '/vip/panel',
  fallback
}: SubscriptionGateProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      setLoading(false);
      setHasAccess(false);
      return;
    }

    try {
      const { data: affiliate, error } = await supabase
        .from('vip_affiliates')
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;

      const tier = affiliate?.tier || 'bronze';
      setUserTier(tier);

      const effectiveTiers = requiredTiers || [requiredTier];
      const access = hasTierAccessMultiple(tier, effectiveTiers);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking subscription access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const effectiveTiers = requiredTiers || [requiredTier];
  const minTier = effectiveTiers.reduce((min, tier) => 
    TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(min) ? tier : min
  , effectiveTiers[0]);
  const tierInfo = TIER_INFO[minTier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto py-12"
    >
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{featureName}</h2>
          <p className="text-muted-foreground">{featureDescription}</p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Required Tier */}
          <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Requer nível:</span>
            <Badge 
              variant="outline" 
              className={cn("gap-1 font-semibold", tierInfo.color)}
            >
              <span>{tierInfo.icon}</span>
              {tierInfo.label} ou superior
            </Badge>
          </div>

          {/* Current Tier */}
          {userTier && (
            <div className="text-center text-sm text-muted-foreground">
              Seu nível atual: 
              <span className={cn("font-semibold ml-1", TIER_INFO[normalizeTier(userTier)]?.color)}>
                {TIER_INFO[normalizeTier(userTier)]?.icon} {TIER_INFO[normalizeTier(userTier)]?.label}
              </span>
            </div>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">O que você terá acesso:</p>
              <ul className="space-y-2">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upgrade Button */}
          {showUpgradeButton && (
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              onClick={() => navigate(upgradeRoute)}
            >
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              Ver Como Subir de Nível
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Acumule pontos vendendo e indicando para desbloquear
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Hook for programmatic access check
export function useSubscriptionAccess(requiredTier: RequiredTier = 'gold') {
  const { user } = useAuth();
  const [state, setState] = useState({
    loading: true,
    hasAccess: false,
    userTier: null as string | null
  });

  useEffect(() => {
    async function check() {
      if (!user) {
        setState({ loading: false, hasAccess: false, userTier: null });
        return;
      }

      try {
        const { data: affiliate } = await supabase
          .from('vip_affiliates')
          .select('tier, status')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .maybeSingle();

        const tier = affiliate?.tier || 'bronze';
        const hasAccess = hasTierAccess(tier, requiredTier);
        setState({ loading: false, hasAccess, userTier: tier });
      } catch (error) {
        console.error('Error checking access:', error);
        setState({ loading: false, hasAccess: false, userTier: null });
      }
    }

    check();
  }, [user, requiredTier]);

  return state;
}

export default SubscriptionGate;
