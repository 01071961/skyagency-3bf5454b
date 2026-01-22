/**
 * Affiliate Actions Edge Function - PRODUCTION READY
 * Version: 2.0.0 - Rebuilt with impeccable logic
 * 
 * Handles all affiliate-related operations:
 * - Registration (auto-approve for Bronze tier)
 * - Referral tracking
 * - Statistics and commissions
 * - Withdrawal requests
 * - Tier upgrades
 * - Admin operations
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ============= CONSTANTS =============
const TIER_COMMISSION_RATES: Record<string, number> = {
  bronze: 10,
  silver: 12,
  gold: 15,
  diamond: 20,
  platinum: 25,
};

// Requisitos MAIS RIGOROSOS para tiers
const TIER_REQUIREMENTS: Record<string, { minReferrals: number; minSales: number; minPoints: number }> = {
  bronze: { minReferrals: 0, minSales: 0, minPoints: 0 },
  silver: { minReferrals: 5, minSales: 500, minPoints: 1000 },
  gold: { minReferrals: 15, minSales: 2000, minPoints: 5000 },
  diamond: { minReferrals: 50, minSales: 10000, minPoints: 20000 },
  platinum: { minReferrals: 100, minSales: 50000, minPoints: 50000 },
};

const MIN_WITHDRAWAL = 50;
const VOLUME_BONUS_THRESHOLD = 10;
const VOLUME_BONUS_RATE = 5;
const MAX_COMMISSION_RATE = 35;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// ============= UTILITY FUNCTIONS =============
const logAffiliate = (step: string, data?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [AFFILIATE] ${step}${dataStr}`);
};

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SKY-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calculateCommissionRate(tier: string, monthlyReferrals: number): number {
  const baseRate = TIER_COMMISSION_RATES[tier] || 10;
  const volumeBonus = monthlyReferrals >= VOLUME_BONUS_THRESHOLD ? VOLUME_BONUS_RATE : 0;
  return Math.min(baseRate + volumeBonus, MAX_COMMISSION_RATE);
}

function determineTier(referrals: number, sales: number, points: number): { tier: string; rate: number } {
  // Ordem decrescente - verifica do mais alto para o mais baixo
  const tiers = ['platinum', 'diamond', 'gold', 'silver', 'bronze'];
  
  for (const tier of tiers) {
    const req = TIER_REQUIREMENTS[tier];
    if (referrals >= req.minReferrals && sales >= req.minSales && points >= req.minPoints) {
      return { tier, rate: TIER_COMMISSION_RATES[tier] };
    }
  }
  
  return { tier: 'bronze', rate: 10 };
}

async function getMonthlyReferralCount(supabase: SupabaseClient, affiliateId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count } = await supabase
    .from('affiliate_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', affiliateId)
    .gte('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

// ============= ERROR RESPONSE HELPER =============
function errorResponse(message: string, status: number = 400, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: false, error: message, ...extra }),
    { status, headers: corsHeaders }
  );
}

function successResponse(data: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { headers: corsHeaders }
  );
}

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== INITIALIZE SUPABASE ==========
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      logAffiliate('ERROR: No authorization header');
      return errorResponse('Não autorizado', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logAffiliate('ERROR: Invalid token', { error: authError?.message });
      return errorResponse('Token inválido', 401);
    }

    logAffiliate('User authenticated', { userId: user.id.slice(0, 8) + '...' });

    // ========== PARSE BODY ==========
    let body: { action: string; [key: string]: unknown };
    try {
      body = await req.json();
    } catch (e) {
      logAffiliate('ERROR: Invalid JSON body');
      return errorResponse('Corpo da requisição inválido');
    }

    const { action, ...params } = body;

    if (!action) {
      logAffiliate('ERROR: No action specified');
      return errorResponse('Ação não especificada');
    }

    logAffiliate('Action received', { action });

    // ========== ACTION HANDLERS ==========
    switch (action) {
      // =========================================
      // REGISTER NEW AFFILIATE
      // =========================================
      case 'register': {
        logAffiliate('Registering new affiliate', { userId: user.id.slice(0, 8) + '...' });
        
        // Check if already an affiliate
        const { data: existing } = await supabase
          .from('vip_affiliates')
          .select('id, status')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          logAffiliate('User already registered', { status: existing.status });
          return errorResponse('Você já é um afiliado', 400);
        }

        // Generate unique referral code with retry
        let referralCode = generateReferralCode();
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const { data: codeExists } = await supabase
            .from('vip_affiliates')
            .select('id')
            .eq('referral_code', referralCode)
            .single();

          if (!codeExists) break;
          referralCode = generateReferralCode();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          logAffiliate('ERROR: Could not generate unique code');
          return errorResponse('Erro ao gerar código de referência', 500);
        }

        // Check if user was referred by someone (MLM parent)
        let parentAffiliateId: string | null = null;
        const referrerCode = params.referrer_code as string | undefined;
        
        if (referrerCode) {
          const { data: parentAffiliate } = await supabase
            .from('vip_affiliates')
            .select('id, user_id')
            .eq('referral_code', referrerCode.toUpperCase().trim())
            .eq('status', 'approved')
            .single();
          
          if (parentAffiliate && parentAffiliate.user_id !== user.id) {
            parentAffiliateId = parentAffiliate.id;
            logAffiliate('Parent affiliate found for MLM', { parentId: parentAffiliate.id.slice(0, 8) + '...' });
          }
        }

        // Also check if there's a pending referral for this user (by user_id or email)
        if (!parentAffiliateId) {
          // First try by user_id
          const { data: existingReferral } = await supabase
            .from('affiliate_referrals')
            .select('referrer_id')
            .eq('referred_user_id', user.id)
            .single();
          
          if (existingReferral) {
            parentAffiliateId = existingReferral.referrer_id;
            logAffiliate('Parent affiliate found from referral (by user_id)', { parentId: existingReferral.referrer_id.slice(0, 8) + '...' });
          }
        }

        // Also try to find by email
        if (!parentAffiliateId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.email) {
            const { data: emailReferral } = await supabase
              .from('affiliate_referrals')
              .select('referrer_id')
              .eq('referred_email', profile.email)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (emailReferral) {
              parentAffiliateId = emailReferral.referrer_id;
              logAffiliate('Parent affiliate found from referral (by email)', { 
                parentId: emailReferral.referrer_id.slice(0, 8) + '...',
                email: profile.email 
              });
            }
          }
        }

        // Create affiliate - Auto-approved for Bronze tier
        const { data: affiliate, error: insertError } = await supabase
          .from('vip_affiliates')
          .insert({
            user_id: user.id,
            referral_code: referralCode,
            pix_key: params.pix_key as string || null,
            bank_info: params.bank_info || null,
            status: 'approved',
            tier: 'bronze',
            commission_rate: 10,
            approved_at: new Date().toISOString(),
            parent_affiliate_id: parentAffiliateId,
          })
          .select()
          .single();

        if (insertError) {
          logAffiliate('ERROR: Failed to create affiliate', { error: insertError.message });
          return errorResponse('Erro ao criar afiliado: ' + insertError.message, 500);
        }

        // Update parent's direct_referrals_count if parent exists
        if (parentAffiliateId) {
          await supabase.rpc('increment_direct_referrals', { affiliate_id: parentAffiliateId });
          logAffiliate('Updated parent referral count', { parentId: parentAffiliateId.slice(0, 8) + '...' });
        }

        // Award welcome bonus points
        await supabase.from('user_points').upsert({
          user_id: user.id,
          current_balance: 10,
          total_earned: 10,
          tier: 'bronze',
        }, { onConflict: 'user_id' });

        await supabase.from('point_transactions').insert({
          user_id: user.id,
          type: 'earn',
          amount: 10,
          balance_after: 10,
          description: 'Bônus de boas-vindas ao programa de afiliados',
        });

        logAffiliate('Affiliate created with MLM link', { 
          id: affiliate.id.slice(0, 8) + '...', 
          code: referralCode,
          parentId: parentAffiliateId?.slice(0, 8) + '...' || 'none'
        });
        
        return successResponse({ affiliate, autoApproved: true, parentAffiliateId });
      }

      // =========================================
      // TRACK REFERRAL
      // =========================================
      case 'track_referral': {
        const { referral_code, email } = params as { referral_code?: string; email?: string };

        if (!referral_code) {
          return errorResponse('Código de referência obrigatório');
        }

        const { data: affiliate } = await supabase
          .from('vip_affiliates')
          .select('id, status, user_id, referral_count')
          .eq('referral_code', referral_code.toUpperCase().trim())
          .single();

        if (!affiliate || affiliate.status !== 'approved') {
          return errorResponse('Código de referência inválido');
        }

        // Prevent self-referral
        if (affiliate.user_id === user.id) {
          return errorResponse('Você não pode usar seu próprio código de referência');
        }

        // Check for duplicate referral
        const { data: existingReferral } = await supabase
          .from('affiliate_referrals')
          .select('id')
          .eq('referrer_id', affiliate.id)
          .eq('referred_user_id', user.id)
          .single();

        if (existingReferral) {
          return successResponse({ referral: existingReferral, duplicate: true });
        }

        const { data: referral, error } = await supabase
          .from('affiliate_referrals')
          .insert({
            referrer_id: affiliate.id,
            referred_user_id: user.id,
            referred_email: email,
          })
          .select()
          .single();

        if (error) {
          logAffiliate('ERROR: Failed to create referral', { error: error.message });
          return errorResponse('Erro ao registrar referência', 500);
        }

        // Update referral_count on the affiliate
        const currentCount = Number(affiliate.referral_count) || 0;
        await supabase
          .from('vip_affiliates')
          .update({ referral_count: currentCount + 1 })
          .eq('id', affiliate.id);
        
        logAffiliate('Referral tracked', { 
          referrerId: affiliate.id.slice(0, 8) + '...', 
          referredUserId: user.id.slice(0, 8) + '...' 
        });

        return successResponse({ referral });
      }

      // =========================================
      // GET STATISTICS
      // =========================================
      case 'get_stats': {
        logAffiliate('Getting stats', { userId: user.id.slice(0, 8) + '...' });
        
        const { data: affiliate, error: affiliateError } = await supabase
          .from('vip_affiliates')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (affiliateError || !affiliate) {
          return successResponse({ notAffiliate: true });
        }

        // Get referrals
        const { data: referrals, count: totalReferrals } = await supabase
          .from('affiliate_referrals')
          .select('*', { count: 'exact' })
          .eq('referrer_id', affiliate.id);

        const convertedReferrals = referrals?.filter(r => r.status === 'converted').length || 0;

        // Get commissions
        const { data: commissions } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('affiliate_id', affiliate.id);

        const pendingCommissions = commissions?.filter(c => c.status === 'pending') || [];
        const paidCommissions = commissions?.filter(c => c.status === 'paid') || [];

        // Calculate dynamic commission rate
        const monthlyReferrals = await getMonthlyReferralCount(supabase, affiliate.id);
        const dynamicCommissionRate = calculateCommissionRate(affiliate.tier || 'bronze', monthlyReferrals);
        const hasVolumeBonus = monthlyReferrals >= VOLUME_BONUS_THRESHOLD;

        return successResponse({
          affiliate: {
            ...affiliate,
            effective_commission_rate: dynamicCommissionRate,
          },
          referrals,
          commissions,
          stats: {
            total_referrals: totalReferrals || 0,
            converted_referrals: convertedReferrals,
            conversion_rate: totalReferrals ? (convertedReferrals / totalReferrals * 100).toFixed(1) : '0',
            pending_commissions: pendingCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
            total_paid: paidCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
            monthly_referrals: monthlyReferrals,
            has_volume_bonus: hasVolumeBonus,
            effective_commission_rate: dynamicCommissionRate,
          },
        });
      }

      // =========================================
      // REQUEST WITHDRAWAL
      // =========================================
      case 'request_withdrawal': {
        const { amount, pix_key } = params as { amount?: number; pix_key?: string };
        logAffiliate('Withdrawal request', { amount, userId: user.id.slice(0, 8) + '...' });

        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return errorResponse('Valor de saque inválido');
        }

        const { data: affiliate, error: affiliateError } = await supabase
          .from('vip_affiliates')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (affiliateError || !affiliate) {
          return successResponse({ notAffiliate: true });
        }

        if (affiliate.status !== 'approved') {
          return successResponse({ notApproved: true });
        }

        const availableBalance = Number(affiliate.available_balance) || 0;
        if (availableBalance < amount) {
          return successResponse({ insufficientBalance: true, available: availableBalance });
        }

        if (amount < MIN_WITHDRAWAL) {
          return successResponse({ minAmount: MIN_WITHDRAWAL });
        }

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayWithdrawals } = await supabase
          .from('withdrawals')
          .select('*', { count: 'exact', head: true })
          .eq('requested_by', user.id)
          .gte('created_at', today.toISOString());

        if ((todayWithdrawals || 0) >= 1) {
          return successResponse({ dailyLimitReached: true });
        }

        // Create withdrawal request
        const { data: withdrawal, error: withdrawalError } = await supabase
          .from('withdrawals')
          .insert({
            requested_by: user.id,
            amount,
            net_amount: amount,
            payment_method: 'pix',
            bank_info: { pix_key: pix_key || affiliate.pix_key },
          })
          .select()
          .single();

        if (withdrawalError) {
          logAffiliate('ERROR: Withdrawal creation failed', { error: withdrawalError.message });
          return errorResponse('Erro ao criar solicitação de saque', 500);
        }

        // Reserve balance
        await supabase
          .from('vip_affiliates')
          .update({ available_balance: availableBalance - amount })
          .eq('id', affiliate.id);

        // Audit log
        await supabase.from('admin_audit_log').insert({
          action: 'withdrawal_requested',
          admin_id: user.id,
          target_id: withdrawal.id,
          target_table: 'withdrawals',
          details: { amount, affiliate_id: affiliate.id },
        });

        logAffiliate('Withdrawal created', { id: withdrawal.id.slice(0, 8) + '...' });
        return successResponse({ withdrawal });
      }

      // =========================================
      // UPGRADE TIER - Requisitos RIGOROSOS
      // =========================================
      case 'upgrade_tier': {
        // Buscar dados do afiliado
        const { data: affiliate } = await supabase
          .from('vip_affiliates')
          .select('id, direct_referrals_count, total_earnings')
          .eq('user_id', user.id)
          .single();

        if (!affiliate) {
          return errorResponse('Afiliado não encontrado');
        }

        const { data: points } = await supabase
          .from('user_points')
          .select('total_earned')
          .eq('user_id', user.id)
          .single();

        const totalPoints = points?.total_earned || 0;
        const referrals = affiliate.direct_referrals_count || 0;
        const sales = Number(affiliate.total_earnings) || 0;

        logAffiliate('Checking tier upgrade', { referrals, sales, totalPoints });

        const { tier: newTier, rate: newCommissionRate } = determineTier(referrals, sales, totalPoints);

        const { error } = await supabase
          .from('vip_affiliates')
          .update({ 
            tier: newTier,
            commission_rate: newCommissionRate,
          })
          .eq('user_id', user.id);

        if (error) {
          return errorResponse('Erro ao atualizar tier', 500);
        }

        // Atualizar tier em user_points também
        await supabase
          .from('user_points')
          .update({ tier: newTier })
          .eq('user_id', user.id);

        return successResponse({ tier: newTier, commission_rate: newCommissionRate });
      }

      // =========================================
      // ADMIN: APPROVE/REJECT AFFILIATE
      // =========================================
      case 'admin_approve': {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (!isAdmin) {
          return errorResponse('Não autorizado', 403);
        }

        const { affiliate_id, approved, tier, commission_rate } = params as {
          affiliate_id?: string;
          approved?: boolean;
          tier?: string;
          commission_rate?: number;
        };

        if (!affiliate_id) {
          return errorResponse('ID do afiliado obrigatório');
        }

        const updateData: Record<string, unknown> = {
          status: approved ? 'approved' : 'rejected',
          approved_at: approved ? new Date().toISOString() : null,
          approved_by: user.id,
        };

        if (tier) updateData.tier = tier;
        if (commission_rate) updateData.commission_rate = commission_rate;

        const { error } = await supabase
          .from('vip_affiliates')
          .update(updateData)
          .eq('id', affiliate_id);

        if (error) {
          return errorResponse('Erro ao atualizar afiliado', 500);
        }

        return successResponse({ action: approved ? 'approve' : 'reject' });
      }

      // =========================================
      // ADMIN: SUSPEND AFFILIATE
      // =========================================
      case 'admin_suspend': {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (!isAdmin) {
          return errorResponse('Não autorizado', 403);
        }

        const { affiliate_id, reason } = params as { affiliate_id?: string; reason?: string };

        if (!affiliate_id) {
          return errorResponse('ID do afiliado obrigatório');
        }

        const { error } = await supabase
          .from('vip_affiliates')
          .update({ 
            status: 'suspended',
            updated_at: new Date().toISOString(),
          })
          .eq('id', affiliate_id);

        if (error) {
          return errorResponse('Erro ao suspender afiliado', 500);
        }

        // Audit log
        await supabase.from('admin_audit_log').insert({
          action: 'affiliate_suspended',
          admin_id: user.id,
          target_id: affiliate_id,
          target_table: 'vip_affiliates',
          details: { reason },
        });

        return successResponse({ action: 'suspend' });
      }

      // =========================================
      // GET MARKETING MATERIALS
      // =========================================
      case 'get_marketing_materials': {
        const materials = {
          banners: [
            { id: '1', name: 'Banner 728x90', url: '/affiliate-banners/banner-728x90.jpg', size: '728x90' },
            { id: '2', name: 'Banner 300x250', url: '/affiliate-banners/banner-300x250.jpg', size: '300x250' },
            { id: '3', name: 'Banner 160x600', url: '/affiliate-banners/banner-160x600.jpg', size: '160x600' },
            { id: '4', name: 'Story/Reels', url: '/affiliate-banners/story-1080x1920.jpg', size: '1080x1920' },
          ],
          postTemplates: [
            {
              id: '1',
              title: 'Post de Apresentação',
              content: '🚀 Quer transformar sua live em um negócio de verdade? A SKY BRASIL ajuda streamers como você a monetizar e crescer! Use meu link e comece agora: {LINK}',
              platform: 'instagram',
            },
            {
              id: '2', 
              title: 'Post de Resultado',
              content: '💰 Sabia que streamers parceiros da SKY BRASIL estão ganhando até R$10.000/mês? Clica no meu link e descubra como: {LINK}',
              platform: 'facebook',
            },
            {
              id: '3',
              title: 'WhatsApp/Telegram',
              content: 'Ei, você faz lives? Conhece a SKY BRASIL? Eles ajudam streamers a monetizar de verdade. Dá uma olhada: {LINK}',
              platform: 'whatsapp',
            },
          ],
          tips: [
            'Compartilhe seu link em todas as suas redes sociais',
            'Mencione os benefícios específicos para streamers',
            'Use os stories para mostrar resultados',
            'Faça lives falando sobre oportunidades de monetização',
            'Crie conteúdo educativo sobre streaming',
          ],
        };

        return successResponse({ materials });
      }

      // =========================================
      // DEFAULT: UNKNOWN ACTION
      // =========================================
      default:
        logAffiliate('Unknown action', { action });
        return errorResponse(`Ação desconhecida: ${action}`);
    }

  } catch (error: unknown) {
    const err = error as Error;
    logAffiliate('CRITICAL ERROR', { message: err.message, stack: err.stack?.slice(0, 200) });
    return errorResponse(err.message || 'Erro interno', 500);
  }
});
