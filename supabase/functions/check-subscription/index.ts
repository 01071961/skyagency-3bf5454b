/**
 * Check Subscription Status
 * 
 * Checks if the authenticated user has an active Stripe subscription
 * and returns subscription details including tier and end date.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Update profile to reflect no subscription
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_status: 'inactive',
          subscription_tier: null,
          subscription_end: null,
        })
        .eq('user_id', user.id);
      
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          subscription_status: 'inactive',
          subscription_tier: null,
          subscription_end: null,
          product_id: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscribed = false;
    let subscriptionStatus = 'inactive';
    let subscriptionTier: string | null = null;
    let subscriptionEnd: string | null = null;
    let productId: string | null = null;
    let priceId: string | null = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      subscribed = true;
      subscriptionStatus = subscription.status;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get product info for tier
      const priceItem = subscription.items.data[0];
      priceId = priceItem.price.id;
      productId = priceItem.price.product as string;
      
      // Determine tier from product metadata or name
      const product = await stripe.products.retrieve(productId);
      subscriptionTier = product.metadata?.tier || product.name || 'premium';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscriptionStatus,
        tier: subscriptionTier,
        endDate: subscriptionEnd 
      });
    } else {
      // Check for trialing or past_due subscriptions
      const allSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 5,
      });
      
      for (const sub of allSubscriptions.data) {
        if (sub.status === 'trialing' || sub.status === 'past_due') {
          subscribed = sub.status === 'trialing';
          subscriptionStatus = sub.status;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          
          const priceItem = sub.items.data[0];
          priceId = priceItem.price.id;
          productId = priceItem.price.product as string;
          
          const product = await stripe.products.retrieve(productId);
          subscriptionTier = product.metadata?.tier || product.name || 'premium';
          
          logStep("Found subscription with status", { 
            status: sub.status,
            tier: subscriptionTier 
          });
          break;
        }
      }
    }

    // Update profile with subscription status
    await supabaseClient
      .from('profiles')
      .update({ 
        stripe_customer_id: customerId,
        subscription_status: subscriptionStatus,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
      })
      .eq('user_id', user.id);
    
    logStep("Profile updated with subscription info");

    // Also update the subscriptions table if we have an active subscription
    if (subscribed && productId && priceId) {
      const { data: existingSub } = await supabaseClient
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existingSub) {
        await supabaseClient
          .from('subscriptions')
          .update({
            status: subscriptionStatus,
            current_period_end: subscriptionEnd,
            gateway_subscription_id: subscriptions.data[0]?.id,
          })
          .eq('id', existingSub.id);
      }
    }

    return new Response(
      JSON.stringify({
        subscribed,
        subscription_status: subscriptionStatus,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        product_id: productId,
        price_id: priceId,
        customer_id: customerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
