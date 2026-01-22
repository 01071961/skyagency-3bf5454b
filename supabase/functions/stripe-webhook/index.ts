/**
 * Stripe Webhook Handler Edge Function - PRODUCTION READY
 * Version: 2.0.0 - Rebuilt with impeccable logic
 * 
 * Handles webhook events from Stripe including:
 * - Payment completion (checkout.session.completed, payment_intent.succeeded)
 * - Async payments (Pix, Boleto)
 * - Subscription events (created, updated, deleted)
 * - Invoice events (paid, payment_failed)
 * - Commission tracking for affiliates
 * - Points awarding for purchases
 * - Transactional emails via Resend
 * 
 * IMPORTANT: Uses STRIPE_WEBHOOK_SECRET for signature verification
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import {
  paymentSuccessEmail,
  paymentFailedEmail,
  subscriptionRenewalEmail,
  subscriptionCanceledEmail,
  refundProcessedEmail,
  affiliateCommissionEmail,
} from "../_shared/email-templates.ts";

// ============= CONSTANTS =============
const STRIPE_API_VERSION = "2025-08-27.basil" as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Content-Type": "application/json",
};

// ============= UTILITY FUNCTIONS =============

// Security: Mask sensitive data in logs
const maskEmail = (email: string | undefined | null): string => {
  if (!email) return "[no-email]";
  const [user, domain] = email.split("@");
  if (!user || !domain) return "[masked]";
  return `${user.slice(0, 2)}***@${domain}`;
};

const maskId = (id: string | undefined | null): string => {
  if (!id) return "[no-id]";
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
};

// Enhanced logging with timestamp and structured data
const logWebhook = (event: string, data?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` - ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] ${event}${dataStr}`);
};

// Safe email sender with error handling
const sendTransactionalEmail = async (
  resend: Resend | null,
  to: string,
  emailContent: { subject: string; html: string }
): Promise<boolean> => {
  if (!resend || !to) return false;
  
  try {
    const { error } = await resend.emails.send({
      from: "SKY BRASIL <noreply@skystreamer.online>",
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });
    
    if (error) {
      console.error("[STRIPE-WEBHOOK] Email send error:", error);
      return false;
    }
    
    logWebhook("Email sent", { to: maskEmail(to), subject: emailContent.subject });
    return true;
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Email send exception:", err);
    return false;
  }
};

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  logWebhook("Request received", { method: req.method });

  try {
    // ========== CONFIGURATION VALIDATION ==========
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logWebhook("CRITICAL: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error - missing Stripe key" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logWebhook("CRITICAL: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Validate webhook secret format
    if (!webhookSecret.startsWith("whsec_")) {
      logWebhook("WARNING: STRIPE_WEBHOOK_SECRET format may be incorrect");
    }

    const keyMode = stripeKey.startsWith("sk_live") ? "LIVE" : "TEST";
    const secretPrefix = webhookSecret.slice(0, 10);
    logWebhook("Configuration OK", { mode: keyMode, webhookSecretPrefix: secretPrefix + "..." });

    // Initialize services
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;

    const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========== SIGNATURE VERIFICATION ==========
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logWebhook("ERROR: Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const sigParts = signature.split(",").map(p => p.split("=")[0]);
    logWebhook("Signature header received", { parts: sigParts });

    const body = await req.text();
    logWebhook("Request body size", { bytes: body.length });

    let event: Stripe.Event;

    try {
      // CRITICAL: Use constructEventAsync for Deno/Edge runtime
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logWebhook("✅ Signature verified successfully", { 
        eventId: event.id, 
        eventType: event.type 
      });
    } catch (err: unknown) {
      const error = err as Error;
      logWebhook("❌ Signature verification FAILED", {
        error: error.message,
        signaturePrefix: signature.slice(0, 50) + "...",
        bodyPreview: body.slice(0, 100) + "...",
      });
      
      // Provide helpful debugging hints
      if (error.message?.includes("No signatures found")) {
        logWebhook("HINT: Webhook secret may be from wrong endpoint - check Stripe Dashboard");
      } else if (error.message?.includes("timestamp")) {
        logWebhook("HINT: Clock skew issue or stale webhook event");
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Webhook signature verification failed",
          hint: "Ensure STRIPE_WEBHOOK_SECRET matches the endpoint in Stripe Dashboard"
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ========== HELPER FUNCTIONS ==========
    
    // Create in-app notification for user
    const createNotification = async (
      userId: string,
      type: 'success' | 'info' | 'warning' | 'error' | 'commission',
      title: string,
      message: string,
      actionUrl?: string,
      data?: Record<string, unknown>
    ): Promise<void> => {
      if (!userId) return;
      
      try {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type,
            title,
            message,
            action_url: actionUrl,
            data: data || {},
          });
        
        if (error) {
          logWebhook("Error creating notification", { error: error.message });
        } else {
          logWebhook("Notification created", { userId: maskId(userId), type, title });
        }
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Notification error:", err);
      }
    };

    // Process Creator product commissions (70/20/10 split)
    const processCreatorProductCommission = async (
      orderId: string,
      creatorId: string,
      orderTotal: number,
      creatorRate: number,
      platformRate: number,
      affiliateRate: number,
      affiliateCode?: string,
      customerEmail?: string
    ): Promise<void> => {
      logWebhook("Processing creator product commission", { 
        orderId: maskId(orderId), 
        creatorId: maskId(creatorId),
        total: orderTotal,
        rates: { creator: creatorRate, platform: platformRate, affiliate: affiliateRate }
      });

      try {
        // Check for duplicate payout
        const { data: existingPayout } = await supabase
          .from('creator_payouts')
          .select('id')
          .eq('order_id', orderId)
          .single();

        if (existingPayout) {
          logWebhook("Creator payout already exists", { orderId: maskId(orderId) });
          return;
        }

        const creatorAmount = Math.round(orderTotal * (creatorRate / 100) * 100) / 100;
        const platformAmount = Math.round(orderTotal * (platformRate / 100) * 100) / 100;
        let affiliateAmount = 0;
        let affiliateId: string | null = null;

        // Process affiliate commission if code provided
        if (affiliateCode?.trim()) {
          const { data: affiliate } = await supabase
            .from('vip_affiliates')
            .select('id, profiles:user_id(email, name)')
            .eq('referral_code', affiliateCode.trim().toUpperCase())
            .eq('status', 'approved')
            .single();

          if (affiliate) {
            affiliateId = affiliate.id;
            affiliateAmount = Math.round(orderTotal * (affiliateRate / 100) * 100) / 100;

            // Create affiliate commission
            await supabase.from('affiliate_commissions').insert({
              affiliate_id: affiliate.id,
              order_id: orderId,
              order_total: orderTotal,
              commission_rate: affiliateRate,
              commission_amount: affiliateAmount,
              status: 'pending',
              commission_type: 'creator_product',
            });

            // Update affiliate earnings directly
            const { data: currentAffiliate } = await supabase
              .from('vip_affiliates')
              .select('total_earnings, available_balance')
              .eq('id', affiliate.id)
              .single();

            if (currentAffiliate) {
              await supabase.from('vip_affiliates').update({
                total_earnings: (currentAffiliate.total_earnings || 0) + affiliateAmount,
                available_balance: (currentAffiliate.available_balance || 0) + affiliateAmount,
              }).eq('id', affiliate.id);
            }

            logWebhook("Affiliate commission for creator product", { 
              affiliateId: maskId(affiliate.id), 
              amount: affiliateAmount 
            });
          }
        }

        // Create creator payout record
        const { error: payoutError } = await supabase.from('creator_payouts').insert({
          creator_id: creatorId,
          order_id: orderId,
          gross_amount: orderTotal,
          creator_amount: creatorAmount,
          platform_amount: platformAmount,
          affiliate_amount: affiliateAmount,
          affiliate_id: affiliateId,
          status: 'pending',
        });

        if (payoutError) {
          logWebhook("Error creating creator payout", { error: payoutError.message });
          return;
        }

        logWebhook("Creator payout created", { 
          creatorId: maskId(creatorId),
          creatorAmount,
          platformAmount,
          affiliateAmount 
        });

        // Notify creator
        const { data: creator } = await supabase
          .from('vip_affiliates')
          .select('user_id, profiles:user_id(email, name)')
          .eq('id', creatorId)
          .single();

        if (creator?.user_id) {
          await supabase.from('vip_notifications').insert({
            user_id: creator.user_id,
            type: 'sale',
            title: '💰 Nova Venda!',
            message: `Você vendeu um produto! Comissão: R$ ${creatorAmount.toFixed(2)}`,
            action_url: '/vip/creator',
            icon: 'dollar-sign',
            metadata: { orderId, amount: creatorAmount }
          });
        }
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Creator commission error:", err);
      }
    };

    // Process affiliate commission with MLM multi-level support
    const processAffiliateCommission = async (
      orderId: string,
      affiliateCode: string,
      orderTotal: number,
      userId: string | null,
      customerEmail?: string,
      isCreatorProduct: boolean = false,
      creatorId?: string
    ): Promise<void> => {
      if (!affiliateCode?.trim()) return;

      logWebhook("Processing affiliate commission with MLM", { code: affiliateCode, total: orderTotal, isCreatorProduct });

      try {
        // Fetch commission settings
        const { data: settingsData } = await supabase
          .from('commission_settings')
          .select('*')
          .eq('setting_type', isCreatorProduct ? 'creator' : 'platform')
          .eq('is_active', true)
          .single();

        const settings = settingsData || {
          platform_rate: isCreatorProduct ? 15 : 85,
          affiliate_rate: 10,
          mlm_level1_rate: 5,
          mlm_level2_rate: isCreatorProduct ? 5 : 2,
        };

        const { data: affiliate, error: affiliateError } = await supabase
          .from('vip_affiliates')
          .select('*, profiles:user_id(email, name)')
          .eq('referral_code', affiliateCode.trim().toUpperCase())
          .eq('status', 'approved')
          .single();

        if (affiliateError || !affiliate) {
          logWebhook("Affiliate not found or not approved", { code: affiliateCode, error: affiliateError?.message });
          return;
        }

        // Check for duplicate commission at level 0
        const { data: existingCommission } = await supabase
          .from('affiliate_commissions')
          .select('id')
          .eq('order_id', orderId)
          .eq('affiliate_id', affiliate.id)
          .eq('commission_level', 0)
          .single();

        if (existingCommission) {
          logWebhook("Level 0 commission already exists", { orderId: maskId(orderId), affiliateId: maskId(affiliate.id) });
          return;
        }

        // Calculate amounts
        const affiliateRate = Number(settings.affiliate_rate) || Number(affiliate.commission_rate) || 10;
        const mlmLevel1Rate = Number(settings.mlm_level1_rate) || 5;
        const mlmLevel2Rate = Number(settings.mlm_level2_rate) || 2;
        const platformRate = Number(settings.platform_rate) || 15;

        const affiliateAmount = Math.round(orderTotal * (affiliateRate / 100) * 100) / 100;
        const platformAmount = Math.round(orderTotal * (platformRate / 100) * 100) / 100;
        const mlmLevel1Amount = Math.round(orderTotal * (mlmLevel1Rate / 100) * 100) / 100;
        const mlmLevel2Amount = Math.round(orderTotal * (mlmLevel2Rate / 100) * 100) / 100;

        // Register platform commission
        await supabase.from('platform_commissions').insert({
          order_id: orderId,
          order_total: orderTotal,
          commission_rate: platformRate,
          commission_amount: platformAmount,
          affiliate_id: affiliate.id,
        });

        logWebhook("Platform commission registered", { amount: platformAmount, rate: platformRate });

        // Create Level 0 commission (direct affiliate)
        await supabase.from('affiliate_commissions').insert({
          affiliate_id: affiliate.id,
          order_id: orderId,
          order_total: orderTotal,
          commission_rate: affiliateRate,
          commission_amount: affiliateAmount,
          status: 'pending',
          commission_level: 0,
          commission_type: 'direct',
        });

        // Update affiliate earnings
        await supabase.from('vip_affiliates').update({ 
          total_earnings: (Number(affiliate.total_earnings) || 0) + affiliateAmount,
          available_balance: (Number(affiliate.available_balance) || 0) + affiliateAmount,
        }).eq('id', affiliate.id);

        logWebhook("Level 0 commission created", { 
          amount: affiliateAmount, 
          rate: affiliateRate,
          affiliateId: maskId(affiliate.id) 
        });

        // Send commission notification email
        const affiliateEmail = affiliate.profiles?.email;
        if (resend && affiliateEmail) {
          const affiliateName = affiliate.profiles?.name || 'Afiliado';
          await sendTransactionalEmail(
            resend,
            affiliateEmail,
            affiliateCommissionEmail(affiliateName, affiliateAmount, orderId, affiliateRate, customerEmail)
          );
        }

        // Create VIP notification for direct affiliate
        if (affiliate.user_id) {
          await supabase.from('vip_notifications').insert({
            user_id: affiliate.user_id,
            type: 'commission',
            title: '💰 Nova Comissão!',
            message: `Você ganhou R$ ${affiliateAmount.toFixed(2)} de comissão por uma venda!`,
            action_url: '/vip/commissions',
            icon: 'dollar-sign',
            metadata: { orderId, amount: affiliateAmount, level: 0 }
          });
        }

        // Process MLM Level 1 (parent of direct affiliate)
        if (affiliate.parent_affiliate_id) {
          const { data: upline1 } = await supabase
            .from('vip_affiliates')
            .select('*, profiles:user_id(email, name)')
            .eq('id', affiliate.parent_affiliate_id)
            .eq('status', 'approved')
            .single();

          if (upline1) {
            await supabase.from('affiliate_commissions').insert({
              affiliate_id: upline1.id,
              order_id: orderId,
              order_total: orderTotal,
              commission_rate: mlmLevel1Rate,
              commission_amount: mlmLevel1Amount,
              status: 'pending',
              commission_level: 1,
              commission_type: 'mlm_level1',
            });

            await supabase.from('vip_affiliates').update({
              team_earnings: (Number(upline1.team_earnings) || 0) + mlmLevel1Amount,
            }).eq('id', upline1.id);

            logWebhook("MLM Level 1 commission created", { 
              uplineId: maskId(upline1.id), 
              amount: mlmLevel1Amount 
            });

            // VIP notification for upline 1
            if (upline1.user_id) {
              await supabase.from('vip_notifications').insert({
                user_id: upline1.user_id,
                type: 'mlm',
                title: '🌟 Comissão de Rede Nível 1!',
                message: `Você ganhou R$ ${mlmLevel1Amount.toFixed(2)} da sua rede de afiliados!`,
                action_url: '/vip/commissions',
                icon: 'users',
                metadata: { orderId, amount: mlmLevel1Amount, level: 1 }
              });
            }

            // Process MLM Level 2 (parent of level 1)
            if (upline1.parent_affiliate_id) {
              const { data: upline2 } = await supabase
                .from('vip_affiliates')
                .select('*, profiles:user_id(email, name)')
                .eq('id', upline1.parent_affiliate_id)
                .eq('status', 'approved')
                .single();

              if (upline2) {
                await supabase.from('affiliate_commissions').insert({
                  affiliate_id: upline2.id,
                  order_id: orderId,
                  order_total: orderTotal,
                  commission_rate: mlmLevel2Rate,
                  commission_amount: mlmLevel2Amount,
                  status: 'pending',
                  commission_level: 2,
                  commission_type: 'mlm_level2',
                });

                await supabase.from('vip_affiliates').update({
                  team_earnings: (Number(upline2.team_earnings) || 0) + mlmLevel2Amount,
                }).eq('id', upline2.id);

                logWebhook("MLM Level 2 commission created", { 
                  uplineId: maskId(upline2.id), 
                  amount: mlmLevel2Amount 
                });

                // VIP notification for upline 2
                if (upline2.user_id) {
                  await supabase.from('vip_notifications').insert({
                    user_id: upline2.user_id,
                    type: 'mlm',
                    title: '✨ Comissão de Rede Nível 2!',
                    message: `Você ganhou R$ ${mlmLevel2Amount.toFixed(2)} da sua rede de afiliados!`,
                    action_url: '/vip/commissions',
                    icon: 'layers',
                    metadata: { orderId, amount: mlmLevel2Amount, level: 2 }
                  });
                }
              }
            }
          }
        }

        // Update referral status if exists
        if (userId) {
          await supabase
            .from('affiliate_referrals')
            .update({
              status: 'converted',
              converted_at: new Date().toISOString(),
              order_id: orderId,
            })
            .eq('referrer_id', affiliate.id)
            .eq('referred_user_id', userId)
            .eq('status', 'pending');
        }
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] MLM Commission processing error:", err);
      }
    };

    // Award points with validation
    const awardPoints = async (
      userId: string, 
      orderId: string, 
      orderTotal: number, 
      orderNumber: string
    ): Promise<void> => {
      if (!userId) return;
      
      const pointsToAward = Math.floor(orderTotal);
      if (pointsToAward <= 0) return;

      try {
        // Check for duplicate points transaction
        const { data: existingTransaction } = await supabase
          .from('point_transactions')
          .select('id')
          .eq('order_id', orderId)
          .eq('user_id', userId)
          .eq('type', 'earn')
          .single();

        if (existingTransaction) {
          logWebhook("Points already awarded for this order", { orderId: maskId(orderId) });
          return;
        }

        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', userId)
          .single();

        const newBalance = (existingPoints?.current_balance || 0) + pointsToAward;
        const newTotalEarned = (existingPoints?.total_earned || 0) + pointsToAward;

        if (existingPoints) {
          await supabase
            .from('user_points')
            .update({
              current_balance: newBalance,
              total_earned: newTotalEarned,
              last_activity: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase.from('user_points').insert({
            user_id: userId,
            current_balance: pointsToAward,
            total_earned: pointsToAward,
            tier: 'bronze',
          });
        }

        await supabase.from('point_transactions').insert({
          user_id: userId,
          order_id: orderId,
          type: 'earn',
          amount: pointsToAward,
          balance_after: newBalance,
          description: `Pontos por compra - Pedido ${orderNumber}`,
        });

        logWebhook("Points awarded", { userId: maskId(userId), points: pointsToAward });
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Points awarding error:", err);
      }
    };

    // Update order status with validation
    const updateOrderStatus = async (
      orderId: string, 
      paymentId: string, 
      status: string = 'paid'
    ): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status,
            paid_at: new Date().toISOString(),
            payment_id: paymentId,
          })
          .eq('id', orderId);
        
        if (error) {
          logWebhook("Error updating order", { orderId: maskId(orderId), error: error.message });
          return false;
        }
        
        logWebhook("Order updated", { orderId: maskId(orderId), status });
        return true;
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Order update error:", err);
        return false;
      }
    };

    // Generate temporary password for auto-created users
    const generateTempPassword = (): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    // Auto-create user when guest makes a purchase
    const ensureUserExists = async (
      email: string,
      name: string
    ): Promise<string | null> => {
      if (!email) return null;
      
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (existingUser) {
          logWebhook("User already exists", { email: maskEmail(email), userId: maskId(existingUser.id) });
          return existingUser.id;
        }

        // Create new user with temporary password
        const tempPassword = generateTempPassword();
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: name || email.split('@')[0] },
        });

        if (createError) {
          logWebhook("Error creating user", { error: createError.message, email: maskEmail(email) });
          return null;
        }

        logWebhook("User auto-created", { email: maskEmail(email), userId: maskId(newUser.user.id) });

        // Create profile for the new user
        await supabase.from('profiles').upsert({
          id: newUser.user.id,
          name: name || email.split('@')[0],
          email: email,
        }, { onConflict: 'id' });

        // Send password reset email so user can set their own password
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${Deno.env.get('SITE_URL') || 'https://skystreamer.online'}/members/courses`,
          },
        });

        if (resetError) {
          logWebhook("Error generating login link", { error: resetError.message });
        }

        return newUser.user.id;
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] User creation error:", err);
        return null;
      }
    };

    // Associate user with order and create enrollments
    const associateUserWithOrder = async (
      orderId: string,
      userId: string
    ): Promise<void> => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ user_id: userId })
          .eq('id', orderId);
        
        if (error) {
          logWebhook("Error associating user with order", { error: error.message });
        } else {
          logWebhook("User associated with order", { orderId: maskId(orderId), userId: maskId(userId) });
        }
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Order user association error:", err);
      }
    };

    // ========== EVENT PROCESSING ==========
    logWebhook("Processing event", { type: event.type, id: maskId(event.id) });

    switch (event.type) {
      // ===========================================
      // CHECKOUT SESSION EVENTS
      // ===========================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logWebhook("Checkout session completed", {
          id: maskId(session.id),
          email: maskEmail(session.customer_email),
          amount: session.amount_total,
          mode: session.mode,
          paymentStatus: session.payment_status,
        });

        const orderId = session.metadata?.order_id;
        const affiliateCode = session.metadata?.affiliate_code || session.metadata?.referral_code;
        const orderTotal = (session.amount_total || 0) / 100;
        const customerEmail = session.customer_email;
        const customerName = session.customer_details?.name || session.metadata?.customer_name || 'Cliente';

        // For async payment methods (Pix), wait for async_payment_succeeded
        if (session.payment_status === 'unpaid') {
          logWebhook("Async payment pending (PIX/Boleto)", { sessionId: maskId(session.id) });
          break;
        }

        if (orderId) {
          await updateOrderStatus(orderId, session.payment_intent as string || session.subscription as string || session.id);

          const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

          if (order) {
            let userId = order.user_id;

            // Auto-create user if guest purchase (no user_id)
            if (!userId && customerEmail) {
              logWebhook("Guest purchase detected, creating user account", { email: maskEmail(customerEmail) });
              userId = await ensureUserExists(customerEmail, customerName);
              
              if (userId) {
                // Associate user with order
                await associateUserWithOrder(orderId, userId);
                
                // Trigger enrollment creation manually since order was updated after initial save
                // The trigger fires on UPDATE but we need to ensure user_id is set first
                const { data: orderItems } = await supabase
                  .from('order_items')
                  .select('product_id')
                  .eq('order_id', orderId);
                
                if (orderItems && orderItems.length > 0) {
                  for (const item of orderItems) {
                    // Get product access_days
                    const { data: product } = await supabase
                      .from('products')
                      .select('access_days')
                      .eq('id', item.product_id)
                      .single();
                    
                    const expiresAt = product?.access_days 
                      ? new Date(Date.now() + product.access_days * 24 * 60 * 60 * 1000).toISOString()
                      : null;
                    
                    await supabase.from('enrollments').upsert({
                      user_id: userId,
                      product_id: item.product_id,
                      order_id: orderId,
                      status: 'active',
                      enrolled_at: new Date().toISOString(),
                      expires_at: expiresAt,
                    }, { onConflict: 'user_id,product_id' });
                    
                    logWebhook("Enrollment created for auto-registered user", { 
                      userId: maskId(userId), 
                      productId: maskId(item.product_id) 
                    });
                  }
                }

                // Send welcome email with access instructions
                if (resend && customerEmail) {
                  await sendTransactionalEmail(resend, customerEmail, {
                    subject: '🎉 Acesso Liberado - SKY BRASIL',
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #10b981;">Olá ${customerName}! 🎉</h1>
                        <p>Sua compra foi processada com sucesso e seu acesso está <strong>liberado</strong>!</p>
                        <p>Criamos automaticamente uma conta para você com o email <strong>${customerEmail}</strong>.</p>
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                          <p style="margin: 0;"><strong>Para acessar seu conteúdo:</strong></p>
                          <ol style="margin: 10px 0;">
                            <li>Acesse nosso site</li>
                            <li>Clique em "Entrar"</li>
                            <li>Use a opção "Esqueci minha senha" para definir sua senha</li>
                            <li>Acesse sua área de cursos</li>
                          </ol>
                        </div>
                        <a href="https://skystreamer.online/auth" 
                           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                          Acessar Minha Conta
                        </a>
                        <p style="margin-top: 20px; color: #666;">
                          Pedido: ${order.order_number}<br>
                          Valor: R$ ${orderTotal.toFixed(2)}
                        </p>
                      </div>
                    `,
                  });
                }
              }
            }

            if (affiliateCode) {
              await processAffiliateCommission(orderId, affiliateCode, orderTotal, userId, customerEmail || undefined);
            }
            if (userId) {
              await awardPoints(userId, orderId, orderTotal, order.order_number);
              
              // Create in-app notification for successful payment
              const productName = order.order_items?.[0]?.product_name || 'Produto';
              await createNotification(
                userId,
                'success',
                '✓ Pagamento Confirmado!',
                `Seu pagamento de R$ ${orderTotal.toFixed(2)} foi processado. ${productName} já está disponível.`,
                '/members/courses',
                { orderId, orderNumber: order.order_number, amount: orderTotal }
              );
            }
            if (customerEmail) {
              const productName = order.order_items?.[0]?.product_name;
              await sendTransactionalEmail(
                resend,
                customerEmail,
                paymentSuccessEmail(customerName, orderTotal, order.order_number, productName)
              );
            }
          }
        }

        // Handle subscription creation
        if (session.mode === "subscription" && session.subscription) {
          logWebhook("Subscription created via checkout", { subId: maskId(session.subscription as string) });
          
          await supabase.from('analytics_events').insert({
            event_name: 'subscription_created',
            event_properties: {
              subscription_id: session.subscription,
              customer_email: customerEmail,
              amount: orderTotal,
              source: 'checkout_session',
            },
          });
        }
        break;
      }

      // ===========================================
      // ASYNC PAYMENT SUCCESS (PIX, Boleto)
      // ===========================================
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        logWebhook("Async payment succeeded (PIX/Boleto)", {
          id: maskId(session.id),
          email: maskEmail(session.customer_email),
        });

        const orderId = session.metadata?.order_id;
        const affiliateCode = session.metadata?.affiliate_code || session.metadata?.referral_code;
        const orderTotal = (session.amount_total || 0) / 100;
        const customerEmail = session.customer_email;
        const customerName = session.customer_details?.name || 'Cliente';

        if (orderId) {
          await updateOrderStatus(orderId, session.payment_intent as string || session.id);

          const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

          if (order) {
            let userId = order.user_id;

            // Auto-create user if guest purchase (no user_id)
            if (!userId && customerEmail) {
              logWebhook("Guest PIX purchase detected, creating user account", { email: maskEmail(customerEmail) });
              userId = await ensureUserExists(customerEmail, customerName);
              
              if (userId) {
                await associateUserWithOrder(orderId, userId);
                
                // Create enrollments for auto-registered user
                const { data: orderItems } = await supabase
                  .from('order_items')
                  .select('product_id')
                  .eq('order_id', orderId);
                
                if (orderItems && orderItems.length > 0) {
                  for (const item of orderItems) {
                    const { data: product } = await supabase
                      .from('products')
                      .select('access_days')
                      .eq('id', item.product_id)
                      .single();
                    
                    const expiresAt = product?.access_days 
                      ? new Date(Date.now() + product.access_days * 24 * 60 * 60 * 1000).toISOString()
                      : null;
                    
                    await supabase.from('enrollments').upsert({
                      user_id: userId,
                      product_id: item.product_id,
                      order_id: orderId,
                      status: 'active',
                      enrolled_at: new Date().toISOString(),
                      expires_at: expiresAt,
                    }, { onConflict: 'user_id,product_id' });
                    
                    logWebhook("Enrollment created for PIX auto-registered user", { 
                      userId: maskId(userId), 
                      productId: maskId(item.product_id) 
                    });
                  }
                }

                // Send welcome email
                if (resend && customerEmail) {
                  await sendTransactionalEmail(resend, customerEmail, {
                    subject: '🎉 PIX Confirmado - Acesso Liberado!',
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #10b981;">PIX Confirmado! 🎉</h1>
                        <p>Olá ${customerName}, seu pagamento PIX foi confirmado!</p>
                        <p>Criamos automaticamente uma conta para você com o email <strong>${customerEmail}</strong>.</p>
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                          <p><strong>Para acessar seu conteúdo:</strong></p>
                          <ol>
                            <li>Acesse nosso site</li>
                            <li>Clique em "Entrar"</li>
                            <li>Use "Esqueci minha senha" para definir sua senha</li>
                          </ol>
                        </div>
                        <a href="https://skystreamer.online/auth" 
                           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                          Acessar Minha Conta
                        </a>
                      </div>
                    `,
                  });
                }
              }
            }

            if (affiliateCode) {
              await processAffiliateCommission(orderId, affiliateCode, orderTotal, userId, customerEmail || undefined);
            }
            if (userId) {
              await awardPoints(userId, orderId, orderTotal, order.order_number);
              
              // Create in-app notification for PIX payment
              await createNotification(
                userId,
                'success',
                '✓ PIX Confirmado!',
                `Pagamento PIX de R$ ${orderTotal.toFixed(2)} recebido. Conteúdo liberado!`,
                '/members/courses',
                { orderId, orderNumber: order.order_number, amount: orderTotal, method: 'pix' }
              );
            }
            if (customerEmail) {
              await sendTransactionalEmail(
                resend,
                customerEmail,
                paymentSuccessEmail(customerName, orderTotal, order.order_number, 'Pagamento via PIX')
              );
            }
          }
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logWebhook("Async payment failed", { id: maskId(session.id) });

        const orderId = session.metadata?.order_id;
        const orderAmount = (session.amount_total || 0) / 100;
        
        if (orderId) {
          await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
          
          // Get order to notify user
          const { data: order } = await supabase
            .from('orders')
            .select('user_id, order_number')
            .eq('id', orderId)
            .single();
          
          if (order?.user_id) {
            await createNotification(
              order.user_id,
              'error',
              '⚠️ Pagamento Falhou',
              `Seu pagamento PIX de R$ ${orderAmount.toFixed(2)} expirou ou falhou. Tente novamente.`,
              '/vip/checkout',
              { orderId, orderNumber: order.order_number, amount: orderAmount }
            );
          }
        }

        if (session.customer_email) {
          await sendTransactionalEmail(
            resend,
            session.customer_email,
            paymentFailedEmail(session.customer_details?.name || 'Cliente', orderAmount)
          );
        }
        break;
      }

      // ===========================================
      // PAYMENT INTENT EVENTS
      // ===========================================
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logWebhook("Payment Intent succeeded", {
          id: maskId(paymentIntent.id),
          amount: paymentIntent.amount,
          paymentMethod: paymentIntent.payment_method_types?.join(', '),
        });

        const metadata = paymentIntent.metadata || {};
        let orderId = metadata.order_id;
        const orderNumber = metadata.order_number;
        const affiliateCode = metadata.affiliate_code || metadata.referral_code;
        const affiliateActivationId = metadata.affiliate_activation_id;
        const orderTotal = paymentIntent.amount / 100;

        const customerName = metadata.customer_name || 'Cliente';
        const customerEmail = metadata.customer_email || paymentIntent.receipt_email || '';
        const customerPhone = metadata.customer_phone || '';
        const customerCpf = metadata.customer_cpf || '';
        const userId = metadata.user_id || null;
        const productName = metadata.product_name || '';
        const itemsJson = metadata.items_json || '';

        // Handle affiliate activation payment
        if (affiliateActivationId) {
          logWebhook("Activating affiliate", { id: maskId(affiliateActivationId) });

          const { error: activationError } = await supabase
            .from('vip_affiliates')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
            })
            .eq('id', affiliateActivationId);

          if (!activationError) {
            logWebhook("Affiliate activated successfully");
          }
          break;
        }

        // Create order if it doesn't exist (server-side secure creation)
        if (!orderId && orderNumber && customerEmail) {
          logWebhook("Creating order server-side", { orderNumber });

          const { data: newOrder, error: createOrderError } = await supabase
            .from('orders')
            .insert({
              order_number: orderNumber,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              customer_cpf: customerCpf,
              subtotal: orderTotal,
              total: orderTotal,
              payment_method: 'stripe',
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_id: paymentIntent.id,
              user_id: userId || null,
            })
            .select('id')
            .single();

          if (!createOrderError && newOrder) {
            orderId = newOrder.id;
            logWebhook("Order created", { orderId: maskId(orderId) });

            // Create order items
            if (itemsJson) {
              try {
                const items = JSON.parse(itemsJson);
                if (Array.isArray(items) && items.length > 0) {
                  await supabase.from('order_items').insert(
                    items.map((item: { id?: string; name?: string; price?: number }) => ({
                      order_id: orderId,
                      product_id: String(item.id || 'direct-purchase'),
                      product_name: item.name || productName,
                      price: item.price || orderTotal,
                    }))
                  );
                }
              } catch (e) {
                logWebhook("Failed to parse items_json", { error: String(e) });
              }
            } else if (productName) {
              await supabase.from('order_items').insert({
                order_id: orderId,
                product_id: 'direct-purchase',
                product_name: productName,
                price: orderTotal,
              });
            }
          }
        }

        // Update existing order if found
        if (orderId) {
          await updateOrderStatus(orderId, paymentIntent.id);

          const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

          if (order) {
            if (affiliateCode) {
              await processAffiliateCommission(orderId, affiliateCode, orderTotal, order.user_id, customerEmail);
            }
            if (order.user_id) {
              await awardPoints(order.user_id, orderId, orderTotal, order.order_number);
            }
          }
        }

        // Send payment success email
        if (customerEmail) {
          await sendTransactionalEmail(
            resend,
            customerEmail,
            paymentSuccessEmail(customerName, orderTotal, orderNumber || orderId || '', productName)
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logWebhook("Payment failed", {
          id: maskId(paymentIntent.id),
          error: paymentIntent.last_payment_error?.message,
        });

        const orderId = paymentIntent.metadata?.order_id;
        if (orderId) {
          await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
        }

        const customerEmail = paymentIntent.metadata?.customer_email || paymentIntent.receipt_email;
        if (customerEmail) {
          await sendTransactionalEmail(
            resend,
            customerEmail,
            paymentFailedEmail(paymentIntent.metadata?.customer_name || 'Cliente', paymentIntent.amount / 100)
          );
        }
        break;
      }

      // ===========================================
      // SUBSCRIPTION EVENTS
      // ===========================================
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logWebhook("Subscription event", {
          type: event.type,
          id: maskId(subscription.id),
          status: subscription.status,
        });

        try {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          const customerEmail = (customer as Stripe.Customer).email;
          
          if (customerEmail) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('email', customerEmail)
              .single();
            
            if (profile) {
              const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
              const priceItem = subscription.items.data[0];
              const productId = priceItem?.price?.product as string;
              
              let subscriptionTier = 'premium';
              let isCreatorSubscription = false;
              
              if (productId) {
                try {
                  const product = await stripe.products.retrieve(productId);
                  subscriptionTier = product.metadata?.tier || product.name || 'premium';
                  isCreatorSubscription = product.metadata?.type === 'creator_subscription';
                  logWebhook("Product retrieved", { 
                    productId, 
                    tier: subscriptionTier, 
                    isCreator: isCreatorSubscription 
                  });
                } catch (e) {
                  logWebhook("Could not fetch product", { productId });
                }
              }
              
              // Check metadata for creator subscription type
              if (!isCreatorSubscription) {
                isCreatorSubscription = subscription.metadata?.type === 'creator_subscription';
              }
              
              // Handle Creator subscription activation
              if (isCreatorSubscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
                logWebhook("Processing Creator subscription activation", { userId: maskId(profile.user_id) });
                
                // Get affiliate for this user
                const { data: affiliate } = await supabase
                  .from('vip_affiliates')
                  .select('id')
                  .eq('user_id', profile.user_id)
                  .single();
                
                if (affiliate) {
                  // Activate creator mode
                  await supabase
                    .from('vip_affiliates')
                    .update({ 
                      is_creator: true, 
                      creator_enabled_at: new Date().toISOString() 
                    })
                    .eq('id', affiliate.id);
                  
                  // Upsert creator subscription record
                  const { data: existingCreatorSub } = await supabase
                    .from('creator_subscriptions')
                    .select('id')
                    .eq('affiliate_id', affiliate.id)
                    .single();
                  
                  if (existingCreatorSub) {
                    await supabase
                      .from('creator_subscriptions')
                      .update({
                        status: subscription.status,
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: subscription.customer as string,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: subscriptionEnd,
                      })
                      .eq('id', existingCreatorSub.id);
                  } else {
                    await supabase
                      .from('creator_subscriptions')
                      .insert({
                        affiliate_id: affiliate.id,
                        status: subscription.status,
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: subscription.customer as string,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: subscriptionEnd,
                        price_monthly: 97,
                      });
                  }
                  
                  logWebhook("Creator subscription activated", { affiliateId: maskId(affiliate.id) });
                  
                  // Send notification
                  await supabase.from('vip_notifications').insert({
                    user_id: profile.user_id,
                    type: 'success',
                    title: '🎉 Modo Creator Ativado!',
                    message: 'Sua assinatura Creator foi confirmada. Você agora pode criar e vender produtos!',
                    action_url: '/vip/creator',
                    icon: 'crown',
                  });
                }
              }
              
              // Update profile with subscription info
              await supabase
                .from('profiles')
                .update({
                  stripe_customer_id: subscription.customer as string,
                  subscription_status: subscription.status,
                  subscription_tier: subscriptionTier,
                  subscription_end: subscriptionEnd,
                })
                .eq('user_id', profile.user_id);
              
              // ALSO update vip_affiliates tier based on subscription
              const normalizedTier = subscriptionTier.toLowerCase();
              const vipTier = normalizedTier.includes('plat') ? 'platinum' : 
                              normalizedTier.includes('gold') || normalizedTier.includes('ouro') ? 'gold' :
                              normalizedTier.includes('silver') || normalizedTier.includes('prata') ? 'silver' : 'bronze';
              
              if (subscription.status === 'active' || subscription.status === 'trialing') {
                const { error: affiliateUpdateError } = await supabase
                  .from('vip_affiliates')
                  .update({ 
                    tier: vipTier,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', profile.user_id);
                
                if (affiliateUpdateError) {
                  logWebhook("Error updating affiliate tier", { error: affiliateUpdateError.message });
                } else {
                  logWebhook("VIP Affiliate tier updated", { tier: vipTier });
                }
              }
              
              logWebhook("Profile updated with subscription", { 
                userId: maskId(profile.user_id),
                status: subscription.status,
                tier: subscriptionTier,
              });
              
              // Upsert into subscriptions table
              const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('user_id', profile.user_id)
                .single();
              
              if (existingSub) {
                await supabase
                  .from('subscriptions')
                  .update({
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: subscriptionEnd,
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    gateway_subscription_id: subscription.id,
                  })
                  .eq('id', existingSub.id);
              } else if (subscription.status === 'active' || subscription.status === 'trialing') {
                await supabase
                  .from('subscriptions')
                  .insert({
                    user_id: profile.user_id,
                    product_id: productId || 'unknown',
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: subscriptionEnd,
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    gateway_subscription_id: subscription.id,
                  });
              }
            }
          }
        } catch (subError) {
          logWebhook("Subscription processing error", { error: String(subError) });
        }

        await supabase.from('analytics_events').insert({
          event_name: event.type,
          event_properties: {
            subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logWebhook("Subscription canceled", { id: maskId(subscription.id) });

        try {
          const deletedCustomer = await stripe.customers.retrieve(subscription.customer as string);
          const deletedCustomerEmail = (deletedCustomer as Stripe.Customer).email;
          
          if (deletedCustomerEmail) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('email', deletedCustomerEmail)
              .single();
            
            if (profile) {
              // Check if this is a Creator subscription
              const isCreatorSubscription = subscription.metadata?.type === 'creator_subscription';
              
              if (isCreatorSubscription) {
                logWebhook("Creator subscription canceled", { userId: maskId(profile.user_id) });
                
                // Get affiliate and disable creator mode
                const { data: affiliate } = await supabase
                  .from('vip_affiliates')
                  .select('id, tier')
                  .eq('user_id', profile.user_id)
                  .single();
                
                if (affiliate) {
                  // Only disable if not Gold+ tier
                  const isGoldOrHigher = ['ouro', 'gold', 'platinum', 'platina'].includes(affiliate.tier?.toLowerCase() || '');
                  
                  if (!isGoldOrHigher) {
                    await supabase
                      .from('vip_affiliates')
                      .update({ is_creator: false })
                      .eq('id', affiliate.id);
                  }
                  
                  // Update creator subscription status
                  await supabase
                    .from('creator_subscriptions')
                    .update({ status: 'canceled' })
                    .eq('stripe_subscription_id', subscription.id);
                  
                  // Notify user
                  await supabase.from('vip_notifications').insert({
                    user_id: profile.user_id,
                    type: 'warning',
                    title: 'Assinatura Creator Cancelada',
                    message: isGoldOrHigher 
                      ? 'Sua assinatura foi cancelada, mas você mantém acesso por ser nível Ouro+.'
                      : 'Sua assinatura Creator foi cancelada. O acesso ao modo Creator foi desativado.',
                    action_url: '/vip/creator-upgrade',
                    icon: 'crown',
                  });
                }
              }
              
              await supabase
                .from('profiles')
                .update({
                  subscription_status: 'canceled',
                  subscription_tier: null,
                })
                .eq('user_id', profile.user_id);
              
              await supabase
                .from('subscriptions')
                .update({ status: 'canceled' })
                .eq('gateway_subscription_id', subscription.id);
              
              logWebhook("Subscription canceled in database", { userId: maskId(profile.user_id) });

              await sendTransactionalEmail(
                resend,
                deletedCustomerEmail,
                subscriptionCanceledEmail(
                  (deletedCustomer as Stripe.Customer).name || 'Cliente',
                  'Assinatura SKY BRASIL',
                  new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')
                )
              );
            }
          }
        } catch (cancelError) {
          logWebhook("Subscription cancellation error", { error: String(cancelError) });
        }

        await supabase.from('analytics_events').insert({
          event_name: 'subscription_canceled',
          event_properties: {
            subscription_id: subscription.id,
            canceled_at: new Date().toISOString(),
          },
        });
        break;
      }

      // ===========================================
      // INVOICE EVENTS
      // ===========================================
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logWebhook("Invoice paid", {
          id: maskId(invoice.id),
          amount: invoice.amount_paid,
        });

        if (invoice.customer_email) {
          const nextDate = new Date((invoice.lines?.data?.[0]?.period?.end || Date.now() / 1000) * 1000).toLocaleDateString('pt-BR');
          await sendTransactionalEmail(
            resend,
            invoice.customer_email,
            subscriptionRenewalEmail(
              invoice.customer_name || 'Cliente',
              'Assinatura',
              (invoice.amount_paid || 0) / 100,
              nextDate
            )
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logWebhook("Invoice payment failed", { id: maskId(invoice.id) });

        if (invoice.customer_email) {
          await sendTransactionalEmail(
            resend,
            invoice.customer_email,
            paymentFailedEmail(invoice.customer_name || 'Cliente', (invoice.amount_due || 0) / 100)
          );
        }
        break;
      }

      // ===========================================
      // REFUND EVENTS
      // ===========================================
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logWebhook("Charge refunded", {
          id: maskId(charge.id),
          amount: charge.amount_refunded,
        });

        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_id', charge.payment_intent)
          .single();

        if (order) {
          await supabase
            .from('orders')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          // Notify affiliate about refund (cancel commission if exists)
          await supabase
            .from('affiliate_commissions')
            .update({ status: 'cancelled' })
            .eq('order_id', order.id)
            .eq('status', 'pending');

          if (order.customer_email) {
            await sendTransactionalEmail(
              resend,
              order.customer_email,
              refundProcessedEmail(order.customer_name, (charge.amount_refunded || 0) / 100, order.order_number)
            );
          }
        }
        break;
      }

      default:
        logWebhook("Unhandled event type", { type: event.type });
    }

    const duration = Date.now() - startTime;
    logWebhook("✅ Event processed successfully", { duration: `${duration}ms` });

    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as Error;
    logWebhook("❌ Webhook processing error", {
      error: err.message,
      stack: err.stack?.slice(0, 200),
      duration: `${duration}ms`,
    });

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
