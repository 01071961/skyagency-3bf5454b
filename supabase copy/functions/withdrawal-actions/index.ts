/**
 * Withdrawal Actions Edge Function
 * Handles all withdrawal-related operations:
 * - Request withdrawal (affiliate)
 * - Approve/Reject withdrawal (admin only)
 * - Get withdrawal history
 * - Process Stripe payout
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const MIN_WITHDRAWAL = 50;
const WITHDRAWAL_FEE = 0; // R$ 0.00 fee (can be adjusted)
const OWNER_EMAILS = ['skyagencysc@gmail.com', 'elplinkedin@gmail.com'];

const logWithdrawal = (step: string, data?: Record<string, unknown>) => {
  console.log(`[WITHDRAWAL] ${step}`, data ? JSON.stringify(data) : '');
};

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), { 
    status, 
    headers: corsHeaders 
  });
}

function successResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...data }), { 
    headers: corsHeaders 
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Não autorizado', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Token inválido', 401);
    }

    const body = await req.json();
    const { action, ...params } = body;

    logWithdrawal('Action received', { action, userId: user.id.slice(0, 8) });

    switch (action) {
      // =========================================
      // REQUEST WITHDRAWAL (Affiliate)
      // =========================================
      case 'request': {
        const { amount } = params as { amount: number };

        if (!amount || amount < MIN_WITHDRAWAL) {
          return errorResponse(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL.toFixed(2)}`);
        }

        // Get affiliate data
        const { data: affiliate, error: affError } = await supabase
          .from('vip_affiliates')
          .select('*, profiles:user_id(name, email)')
          .eq('user_id', user.id)
          .single();

        if (affError || !affiliate) {
          return errorResponse('Você não é um afiliado');
        }

        if (affiliate.status !== 'approved') {
          return errorResponse('Sua conta de afiliado ainda não foi aprovada');
        }

        // Check if bank account is configured
        if (!affiliate.pix_key && !affiliate.stripe_account_id) {
          return successResponse({ 
            needsBankSetup: true,
            message: 'Configure sua conta bancária ou chave PIX antes de solicitar saque'
          });
        }

        const availableBalance = Number(affiliate.available_balance) || 0;
        if (amount > availableBalance) {
          return errorResponse(`Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`);
        }

        // Check for pending withdrawal
        const { data: pendingWithdrawal } = await supabase
          .from('withdrawals')
          .select('id')
          .eq('requested_by', user.id)
          .eq('status', 'pending')
          .single();

        if (pendingWithdrawal) {
          return errorResponse('Você já possui uma solicitação de saque pendente');
        }

        const fee = WITHDRAWAL_FEE;
        const netAmount = amount - fee;

        // Get profile info
        const profileData = affiliate.profiles as any;

        // Create withdrawal request
        const { data: withdrawal, error: wdError } = await supabase
          .from('withdrawals')
          .insert({
            requested_by: user.id,
            affiliate_id: affiliate.id,
            amount,
            fee,
            net_amount: netAmount,
            payment_method: affiliate.stripe_account_id ? 'stripe_connect' : 'pix',
            bank_info: { pix_key: affiliate.pix_key },
            status: 'pending',
            affiliate_name: profileData?.name || user.email,
            affiliate_email: profileData?.email || user.email,
          })
          .select()
          .single();

        if (wdError) {
          logWithdrawal('ERROR creating withdrawal', { error: wdError.message });
          return errorResponse('Erro ao criar solicitação de saque');
        }

        // Reserve balance (subtract from available)
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
          details: { amount, net_amount: netAmount, affiliate_id: affiliate.id },
        });

        logWithdrawal('Withdrawal created', { id: withdrawal.id });

        return successResponse({ 
          withdrawal,
          message: 'Sua solicitação foi enviada e aguarda aprovação do administrador'
        });
      }

      // =========================================
      // GET WITHDRAWAL HISTORY (Affiliate)
      // =========================================
      case 'history': {
        const { data: affiliate } = await supabase
          .from('vip_affiliates')
          .select('id, available_balance, pix_key, stripe_account_id, stripe_account_status')
          .eq('user_id', user.id)
          .single();

        if (!affiliate) {
          return successResponse({ withdrawals: [], affiliate: null });
        }

        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('requested_by', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        return successResponse({ 
          withdrawals: withdrawals || [],
          affiliate: {
            available_balance: affiliate.available_balance,
            pix_key: affiliate.pix_key,
            stripe_account_id: affiliate.stripe_account_id,
            stripe_account_status: affiliate.stripe_account_status,
          }
        });
      }

      // =========================================
      // ADMIN: LIST ALL WITHDRAWALS
      // =========================================
      case 'admin_list': {
        // Check if user is owner
        if (!OWNER_EMAILS.includes(user.email || '')) {
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin',
          });
          if (!isAdmin) {
            return errorResponse('Acesso negado', 403);
          }
        }

        const { status_filter } = params as { status_filter?: string };

        let query = supabase
          .from('withdrawals')
          .select(`
            *,
            vip_affiliates:affiliate_id(referral_code, pix_key, available_balance, user_id)
          `)
          .order('created_at', { ascending: false });

        if (status_filter && status_filter !== 'all') {
          query = query.eq('status', status_filter);
        }

        const { data: withdrawals, error } = await query.limit(100);

        if (error) {
          logWithdrawal('ERROR fetching withdrawals', { error: error.message });
          return errorResponse('Erro ao buscar solicitações');
        }

        // Get stats
        const { data: allWithdrawals } = await supabase
          .from('withdrawals')
          .select('amount, status');

        const stats = {
          pending_count: allWithdrawals?.filter(w => w.status === 'pending').length || 0,
          pending_amount: allWithdrawals?.filter(w => w.status === 'pending').reduce((s, w) => s + Number(w.amount), 0) || 0,
          completed_count: allWithdrawals?.filter(w => w.status === 'completed').length || 0,
          completed_amount: allWithdrawals?.filter(w => w.status === 'completed').reduce((s, w) => s + Number(w.amount), 0) || 0,
        };

        return successResponse({ withdrawals: withdrawals || [], stats });
      }

      // =========================================
      // ADMIN: APPROVE WITHDRAWAL
      // =========================================
      case 'approve': {
        // Check if user is owner
        if (!OWNER_EMAILS.includes(user.email || '')) {
          return errorResponse('Apenas proprietários podem aprovar saques', 403);
        }

        const { withdrawal_id, use_stripe } = params as { withdrawal_id: string; use_stripe?: boolean };

        if (!withdrawal_id) {
          return errorResponse('ID do saque obrigatório');
        }

        // Get withdrawal
        const { data: withdrawal, error: wdError } = await supabase
          .from('withdrawals')
          .select('*, vip_affiliates:affiliate_id(stripe_account_id, pix_key, user_id)')
          .eq('id', withdrawal_id)
          .single();

        if (wdError || !withdrawal) {
          return errorResponse('Solicitação de saque não encontrada');
        }

        if (withdrawal.status !== 'pending') {
          return errorResponse('Esta solicitação já foi processada');
        }

        let stripePayoutId = null;

        // Process Stripe payout if requested and account exists
        if (use_stripe && stripeKey) {
          const affiliateData = withdrawal.vip_affiliates as any;
          if (affiliateData?.stripe_account_id) {
            try {
              const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
              
              // Create payout to connected account
              const payout = await stripe.payouts.create({
                amount: Math.round(Number(withdrawal.net_amount) * 100), // Convert to cents
                currency: 'brl',
              }, {
                stripeAccount: affiliateData.stripe_account_id,
              });

              stripePayoutId = payout.id;
              logWithdrawal('Stripe payout created', { payoutId: payout.id });
            } catch (stripeError: any) {
              logWithdrawal('Stripe payout error', { error: stripeError.message });
              return errorResponse(`Erro no Stripe: ${stripeError.message}`);
            }
          }
        }

        // Update withdrawal status
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({
            status: 'completed',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            stripe_payout_id: stripePayoutId,
          })
          .eq('id', withdrawal_id);

        if (updateError) {
          logWithdrawal('ERROR updating withdrawal', { error: updateError.message });
          return errorResponse('Erro ao aprovar saque');
        }

        // Update affiliate withdrawn_balance
        const { data: affiliate } = await supabase
          .from('vip_affiliates')
          .select('withdrawn_balance')
          .eq('id', withdrawal.affiliate_id)
          .single();

        if (affiliate) {
          await supabase
            .from('vip_affiliates')
            .update({ 
              withdrawn_balance: Number(affiliate.withdrawn_balance || 0) + Number(withdrawal.amount)
            })
            .eq('id', withdrawal.affiliate_id);
        }

        // Audit log
        await supabase.from('admin_audit_log').insert({
          action: 'withdrawal_approved',
          admin_id: user.id,
          target_id: withdrawal_id,
          target_table: 'withdrawals',
          details: { amount: withdrawal.amount, stripe_payout_id: stripePayoutId },
        });

        // Create notification for affiliate
        const affiliateData = withdrawal.vip_affiliates as any;
        if (affiliateData?.user_id) {
          await supabase.from('notifications').insert({
            user_id: affiliateData.user_id,
            type: 'withdrawal_approved',
            title: 'Saque Aprovado!',
            message: `Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi aprovado e está sendo processado.`,
            action_url: '/vip/referrals',
          });
        }

        logWithdrawal('Withdrawal approved', { id: withdrawal_id });

        return successResponse({ 
          message: 'Saque aprovado com sucesso',
          stripe_payout_id: stripePayoutId 
        });
      }

      // =========================================
      // ADMIN: REJECT WITHDRAWAL
      // =========================================
      case 'reject': {
        // Check if user is owner
        if (!OWNER_EMAILS.includes(user.email || '')) {
          return errorResponse('Apenas proprietários podem rejeitar saques', 403);
        }

        const { withdrawal_id, reason } = params as { withdrawal_id: string; reason?: string };

        if (!withdrawal_id) {
          return errorResponse('ID do saque obrigatório');
        }

        // Get withdrawal
        const { data: withdrawal, error: wdError } = await supabase
          .from('withdrawals')
          .select('*, vip_affiliates:affiliate_id(user_id, available_balance)')
          .eq('id', withdrawal_id)
          .single();

        if (wdError || !withdrawal) {
          return errorResponse('Solicitação de saque não encontrada');
        }

        if (withdrawal.status !== 'pending') {
          return errorResponse('Esta solicitação já foi processada');
        }

        // Update withdrawal status
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({
            status: 'rejected',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            rejected_reason: reason || 'Rejeitado pelo administrador',
          })
          .eq('id', withdrawal_id);

        if (updateError) {
          logWithdrawal('ERROR updating withdrawal', { error: updateError.message });
          return errorResponse('Erro ao rejeitar saque');
        }

        // Restore balance to affiliate
        const affiliateData = withdrawal.vip_affiliates as any;
        if (affiliateData) {
          await supabase
            .from('vip_affiliates')
            .update({ 
              available_balance: Number(affiliateData.available_balance || 0) + Number(withdrawal.amount)
            })
            .eq('id', withdrawal.affiliate_id);
        }

        // Audit log
        await supabase.from('admin_audit_log').insert({
          action: 'withdrawal_rejected',
          admin_id: user.id,
          target_id: withdrawal_id,
          target_table: 'withdrawals',
          details: { amount: withdrawal.amount, reason },
        });

        // Create notification for affiliate
        if (affiliateData?.user_id) {
          await supabase.from('notifications').insert({
            user_id: affiliateData.user_id,
            type: 'withdrawal_rejected',
            title: 'Saque Rejeitado',
            message: `Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} foi rejeitado. ${reason ? `Motivo: ${reason}` : ''} O valor foi devolvido ao seu saldo.`,
            action_url: '/vip/referrals',
          });
        }

        logWithdrawal('Withdrawal rejected', { id: withdrawal_id, reason });

        return successResponse({ message: 'Saque rejeitado e saldo devolvido' });
      }

      default:
        return errorResponse('Ação não reconhecida');
    }
  } catch (error: any) {
    logWithdrawal('ERROR', { message: error.message });
    return errorResponse(error.message || 'Erro interno', 500);
  }
});
