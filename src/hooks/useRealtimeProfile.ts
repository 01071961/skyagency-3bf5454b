import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

export interface ProfileInfo {
  id: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  phone: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  profileViews: number;
  isPublic: boolean;
}

export interface TierInfo {
  tier: string;
  points: number;
  totalPoints: number;
  referralCount: number;
  availableBalance: number;
  totalEarnings: number;
}

const defaultProfile: ProfileInfo = {
  id: null,
  name: null,
  email: null,
  avatarUrl: null,
  coverImageUrl: null,
  bio: null,
  headline: null,
  location: null,
  phone: null,
  websiteUrl: null,
  linkedinUrl: null,
  twitterUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  subscriptionTier: null,
  subscriptionStatus: null,
  profileViews: 0,
  isPublic: false,
};

const defaultTierInfo: TierInfo = {
  tier: 'bronze',
  points: 0,
  totalPoints: 0,
  referralCount: 0,
  availableBalance: 0,
  totalEarnings: 0,
};

const TIER_ORDER = ['bronze', 'silver', 'prata', 'gold', 'ouro', 'platinum', 'platina', 'diamond', 'diamante'];

const normalizeTier = (tier: string | null | undefined): string => {
  if (!tier) return 'bronze';
  const t = tier.toLowerCase().trim();
  const aliases: Record<string, string> = {
    'ouro': 'gold',
    'prata': 'silver',
    'platina': 'platinum',
    'diamante': 'diamond',
  };
  return aliases[t] || t;
};

const getTierLevel = (tier: string): number => {
  const normalized = normalizeTier(tier);
  const idx = TIER_ORDER.indexOf(normalized);
  return idx >= 0 ? idx : 0;
};

export const useRealtimeProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileInfo>(defaultProfile);
  const [tierInfo, setTierInfo] = useState<TierInfo>(defaultTierInfo);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch VIP affiliate data for tier/points
      const { data: affiliateData } = await supabase
        .from('vip_affiliates')
        .select('tier, referral_count, available_balance, total_earnings')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('current_balance, total_earned, tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        // Determine effective tier (highest between profile and affiliate)
        const profileTier = profileData.subscription_tier;
        const affiliateTier = affiliateData?.tier;
        let effectiveTier = 'bronze';
        
        if (profileTier && affiliateTier) {
          effectiveTier = getTierLevel(profileTier) >= getTierLevel(affiliateTier) 
            ? normalizeTier(profileTier) 
            : normalizeTier(affiliateTier);
        } else if (profileTier) {
          effectiveTier = normalizeTier(profileTier);
        } else if (affiliateTier) {
          effectiveTier = normalizeTier(affiliateTier);
        }

        setProfile({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email || user.email || null,
          avatarUrl: profileData.avatar_url,
          coverImageUrl: profileData.cover_image_url,
          bio: profileData.bio,
          headline: profileData.headline,
          location: profileData.location,
          phone: profileData.phone,
          websiteUrl: profileData.website_url,
          linkedinUrl: profileData.linkedin_url,
          twitterUrl: profileData.twitter_url,
          instagramUrl: profileData.instagram_url,
          youtubeUrl: profileData.youtube_url,
          subscriptionTier: effectiveTier,
          subscriptionStatus: profileData.subscription_status,
          profileViews: profileData.profile_views || 0,
          isPublic: profileData.is_public || false,
        });

        setTierInfo({
          tier: effectiveTier,
          points: pointsData?.current_balance || 0,
          totalPoints: pointsData?.total_earned || 0,
          referralCount: affiliateData?.referral_count || 0,
          availableBalance: Number(affiliateData?.available_balance) || 0,
          totalEarnings: Number(affiliateData?.total_earnings) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Realtime subscription for profiles
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProfile();
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
          fetchProfile();
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
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchProfile]);

  const displayName = profile.name || user?.email?.split('@')[0] || 'Usuário';

  // Tier display helpers
  const tierConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    bronze: { label: 'Bronze', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: '🥉' },
    silver: { label: 'Prata', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🥈' },
    gold: { label: 'Ouro', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🥇' },
    platinum: { label: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '💎' },
    diamond: { label: 'Diamond', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '👑' },
  };

  const currentTierConfig = tierConfig[tierInfo.tier] || tierConfig.bronze;

  return {
    profile,
    tierInfo,
    displayName,
    isLoading,
    refetch: fetchProfile,
    currentTierConfig,
  };
};
