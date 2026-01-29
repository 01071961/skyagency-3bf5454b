import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  sponsor_id: string | null;
  tier: string;
  status: string;
  total_earnings: number;
  team_earnings?: number;
  direct_referrals_count: number;
  referral_sales?: number;
}

interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null;
  referred_affiliate_id: string | null;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[fix-mlm-structure] Starting MLM structure repair...');

    // 1. Fetch all affiliates (both 'approved' and 'active' status)
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('vip_affiliates')
      .select('*')
      .in('status', ['approved', 'active']);

    if (affiliatesError) {
      throw new Error(`Error fetching affiliates: ${affiliatesError.message}`);
    }

    console.log(`[fix-mlm-structure] Found ${affiliates?.length || 0} active affiliates`);

    // 2. Fetch all referral relationships
    const { data: referrals, error: referralsError } = await supabase
      .from('affiliate_referrals')
      .select('*');

    if (referralsError) {
      console.warn(`[fix-mlm-structure] Error fetching referrals: ${referralsError.message}`);
    }

    const referralsList = referrals || [];
    const affiliatesList = affiliates || [];

    // Create lookup maps
    const affiliateByUserId = new Map<string, Affiliate>();
    const affiliateById = new Map<string, Affiliate>();
    
    affiliatesList.forEach(a => {
      affiliateByUserId.set(a.user_id, a);
      affiliateById.set(a.id, a);
    });

    let fixedCount = 0;
    let updatedReferralsCount = 0;
    const results: string[] = [];

    // 3. Link affiliates to their parent based on referral records
    for (const referral of referralsList) {
      // If there's a referred_user_id, find the affiliate for that user
      if (referral.referred_user_id) {
        const referredAffiliate = affiliateByUserId.get(referral.referred_user_id);
        
        if (referredAffiliate && !referredAffiliate.sponsor_id) {
          // Find the parent affiliate
          const parentAffiliate = affiliateById.get(referral.affiliate_id);
          
          if (parentAffiliate && parentAffiliate.id !== referredAffiliate.id) {
            // Update the affiliate to link to parent (using sponsor_id)
            const { error: updateError } = await supabase
              .from('vip_affiliates')
              .update({ sponsor_id: parentAffiliate.id })
              .eq('id', referredAffiliate.id);

            if (!updateError) {
              fixedCount++;
              results.push(`Linked ${referredAffiliate.referral_code} to parent ${parentAffiliate.referral_code}`);
              console.log(`[fix-mlm-structure] Linked ${referredAffiliate.referral_code} → ${parentAffiliate.referral_code}`);
            }
          }
        }
      }

      // Also update the referral record if referred_affiliate_id is missing
      if (referral.referred_user_id && !referral.referred_affiliate_id) {
        const referredAffiliate = affiliateByUserId.get(referral.referred_user_id);
        
        if (referredAffiliate) {
          const { error: updateError } = await supabase
            .from('affiliate_referrals')
            .update({ referred_affiliate_id: referredAffiliate.id })
            .eq('id', referral.id);

          if (!updateError) {
            updatedReferralsCount++;
            console.log(`[fix-mlm-structure] Updated referral record for ${referredAffiliate.referral_code}`);
          }
        }
      }
    }

    // 4. Recalculate direct_referrals_count for all affiliates
    const referralCounts = new Map<string, number>();
    
    for (const affiliate of affiliatesList) {
      const count = affiliatesList.filter(a => a.sponsor_id === affiliate.id).length;
      referralCounts.set(affiliate.id, count);
    }

    let countsUpdated = 0;
    for (const [affiliateId, count] of referralCounts) {
      const affiliate = affiliateById.get(affiliateId);
      if (affiliate && affiliate.direct_referrals_count !== count) {
        const { error: updateError } = await supabase
          .from('vip_affiliates')
          .update({ direct_referrals_count: count })
          .eq('id', affiliateId);

        if (!updateError) {
          countsUpdated++;
          console.log(`[fix-mlm-structure] Updated referral count for ${affiliate.referral_code}: ${count}`);
        }
      }
    }

    // 5. Calculate statistics
    const affiliatesWithParent = affiliatesList.filter(a => a.sponsor_id !== null).length;
    const totalAffiliates = affiliatesList.length;
    const orphanCount = totalAffiliates - affiliatesWithParent;
    
    // Get tier distribution using normalized tiers
    const tierCounts: Record<string, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      diamond: 0,
    };
    
    for (const affiliate of affiliatesList) {
      const tier = (affiliate.tier || 'bronze').toLowerCase();
      const normalizedTier = tier === 'prata' ? 'silver' : 
                            tier === 'ouro' ? 'gold' : 
                            tier === 'diamante' ? 'diamond' : tier;
      if (tierCounts[normalizedTier] !== undefined) {
        tierCounts[normalizedTier]++;
      } else {
        tierCounts['bronze']++;
      }
    }

    const response = {
      success: true,
      message: `MLM structure repaired successfully`,
      stats: {
        totalAffiliates,
        affiliatesWithParent,
        orphanAffiliates: orphanCount,
        linksCreated: fixedCount,
        referralsUpdated: updatedReferralsCount,
        countsRecalculated: countsUpdated,
        tierDistribution: tierCounts,
        healthPercent: totalAffiliates > 0 ? Math.round((affiliatesWithParent / totalAffiliates) * 100) : 100,
      },
      details: results,
    };

    console.log('[fix-mlm-structure] Repair complete:', response.stats);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('[fix-mlm-structure] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
