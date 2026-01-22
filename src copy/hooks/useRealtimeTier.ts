import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';

export interface TierInfo {
  tier: string;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  effectiveTier: string;
  isGoldOrHigher: boolean;
  isPremium: boolean;
  stripeCustomerId: string | null;
  hasActiveSubscription: boolean;
  currentPoints: number;
  totalPoints: number;
  directReferrals: number;
  totalSales: number;
  availableBalance: number;
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'platinum'];
const TIER_ALIASES: Record<string, string> = {
  'ouro': 'gold',
  'prata': 'silver',
  'platina': 'platinum',
  'diamante': 'diamond'
};

const TIER_POINTS_THRESHOLD: Record<string, number> = {
  'bronze': 0,
  'silver': 500,
  'gold': 2000,
  'diamond': 5000,
  'platinum': 10000
};

const normalizeTier = (tier: string | null | undefined): string => {
  if (!tier) return 'bronze';
  const lower = tier.toLowerCase();
  return TIER_ALIASES[lower] || lower;
};

const getTierLevel = (tier: string): number => {
  const normalized = normalizeTier(tier);
  const index = TIER_ORDER.indexOf(normalized);
  return index >= 0 ? index : 0;
};

const calculateTierFromPoints = (points: number): string => {
  if (points >= 10000) return 'platinum';
  if (points >= 5000) return 'diamond';
  if (points >= 2000) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
};

export const useRealtimeTier = () => {
  const { user } = useAuth();
  const isSyncing = useRef(false);
  
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: 'bronze',
    subscriptionTier: null,
    subscriptionStatus: null,
    subscriptionEnd: null,
    effectiveTier: 'bronze',
    isGoldOrHigher: false,
    isPremium: false,
    stripeCustomerId: null,
    hasActiveSubscription: false,
    currentPoints: 0,
    totalPoints: 0,
    directReferrals: 0,
    totalSales: 0,
    availableBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch from all relevant tables in parallel
      const [profileRes, affiliateRes, pointsRes, commissionsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('subscription_tier, subscription_status, subscription_end, stripe_customer_id')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('vip_affiliates')
          .select('tier, direct_referrals_count, total_earnings, available_balance, status')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_points')
          .select('current_balance, total_earned, tier')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('affiliate_commissions')
          .select('id')
          .eq('affiliate_id', user.id)
          .eq('status', 'approved'),
      ]);

      const profileData = profileRes.data;
      const affiliateData = affiliateRes.data;
      const pointsData = pointsRes.data;

      // Get real values
      const currentPoints = pointsData?.current_balance || 0;
      const totalPoints = pointsData?.total_earned || 0;
      const directReferrals = affiliateData?.direct_referrals_count || 0;
      const totalSales = commissionsRes.data?.length || 0;
      const availableBalance = affiliateData?.available_balance || affiliateData?.total_earnings || 0;

      // Normalize tiers from all sources
      const affiliateTier = normalizeTier(affiliateData?.tier);
      const subscriptionTier = normalizeTier(profileData?.subscription_tier);
      const pointsTier = normalizeTier(pointsData?.tier) || calculateTierFromPoints(totalPoints);
      
      const subscriptionStatus = profileData?.subscription_status || null;
      const subscriptionEnd = profileData?.subscription_end || null;
      const stripeCustomerId = profileData?.stripe_customer_id || null;
      const hasActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

      // Determine effective tier (highest between affiliate, subscription, and points)
      let effectiveTier = 'bronze';
      const tiersToCompare = [affiliateTier, pointsTier];
      
      // Add subscription tier if subscription is active
      if (hasActiveSubscription && subscriptionTier) {
        tiersToCompare.push(subscriptionTier);
      }
      
      // Find the highest tier
      for (const t of tiersToCompare) {
        if (getTierLevel(t) > getTierLevel(effectiveTier)) {
          effectiveTier = t;
        }
      }

      const effectiveLevel = getTierLevel(effectiveTier);
      const goldLevel = getTierLevel('gold');

      setTierInfo({
        tier: affiliateTier,
        subscriptionTier: profileData?.subscription_tier || null,
        subscriptionStatus,
        subscriptionEnd,
        effectiveTier,
        isGoldOrHigher: effectiveLevel >= goldLevel,
        isPremium: effectiveLevel >= goldLevel,
        stripeCustomerId,
        hasActiveSubscription,
        currentPoints,
        totalPoints,
        directReferrals,
        totalSales,
        availableBalance,
      });
    } catch (error) {
      console.error('[useRealtimeTier] Error fetching tier:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Force sync with Stripe - useful when user just completed checkout
  const syncWithStripe = useCallback(async () => {
    if (!user?.id || isSyncing.current) return;
    
    isSyncing.current = true;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No session');
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) throw error;

      // Refetch tier after sync
      await fetchTier();
      
      if (data?.subscribed) {
        toast.success('Assinatura sincronizada!', {
          description: `Tier ${data.subscription_tier || 'premium'} ativado`
        });
      }
      
      return data;
    } catch (error) {
      console.error('[useRealtimeTier] Stripe sync error:', error);
      toast.error('Erro ao sincronizar assinatura');
      return null;
    } finally {
      isSyncing.current = false;
    }
  }, [user?.id, fetchTier]);

  // Initial fetch
  useEffect(() => {
    fetchTier();
  }, [fetchTier]);

  // Realtime subscriptions for ALL relevant tables
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`tier-sync-complete-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useRealtimeTier] Profile updated, refreshing...');
          fetchTier();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vip_affiliates',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useRealtimeTier] Affiliate updated, refreshing...');
          fetchTier();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useRealtimeTier] Points updated, refreshing...');
          fetchTier();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTier]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchTier, 30000);
    return () => clearInterval(interval);
  }, [fetchTier]);

  return {
    ...tierInfo,
    isLoading,
    refetch: fetchTier,
    syncWithStripe,
    isSyncing: isSyncing.current,
  };
};
