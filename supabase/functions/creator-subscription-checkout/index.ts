import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATOR-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get affiliate data
    const { data: affiliate, error: affError } = await supabase
      .from('vip_affiliates')
      .select('id, user_id, tier')
      .eq('user_id', user.id)
      .single();

    if (affError || !affiliate) {
      throw new Error("Você precisa ser um afiliado VIP para se tornar Creator");
    }

    // Check if already a gold+ tier (free access)
    const isGoldOrHigher = ['ouro', 'gold', 'platinum', 'platina'].includes(affiliate.tier?.toLowerCase() || '');
    if (isGoldOrHigher) {
      // Activate creator for free
      await supabase
        .from('vip_affiliates')
        .update({ 
          is_creator: true, 
          creator_enabled_at: new Date().toISOString() 
        })
        .eq('id', affiliate.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Creator ativado gratuitamente (Ouro+)",
        activated: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create or get Stripe customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
          affiliate_id: affiliate.id
        }
      });
      customerId = customer.id;
    }

    logStep("Stripe customer ready", { customerId });

    // Create subscription checkout session
    // First, create or get the Creator subscription product
    const products = await stripe.products.list({ active: true, limit: 100 });
    let creatorProduct = products.data.find((p: Stripe.Product) => p.metadata?.type === 'creator_subscription');

    if (!creatorProduct) {
      logStep("Creating Creator product in Stripe");
      creatorProduct = await stripe.products.create({
        name: "Sky Brasil - Plano Creator",
        description: "Acesso ao modo Creator para criar e vender produtos na plataforma Sky Brasil",
        metadata: {
          type: 'creator_subscription'
        }
      });
    }

    // Get or create monthly price (R$ 97/month)
    const prices = await stripe.prices.list({ product: creatorProduct.id, active: true });
    let creatorPrice = prices.data.find((p: Stripe.Price) => p.recurring?.interval === 'month' && p.unit_amount === 9700);

    if (!creatorPrice) {
      logStep("Creating Creator price in Stripe");
      creatorPrice = await stripe.prices.create({
        product: creatorProduct.id,
        unit_amount: 9700, // R$ 97.00 in centavos
        currency: 'brl',
        recurring: {
          interval: 'month'
        }
      });
    }

    logStep("Creating checkout session", { priceId: creatorPrice.id });

    const origin = req.headers.get("origin") || "https://skystreamer.online";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: creatorPrice.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/vip/creator?activated=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vip/creator-upgrade?canceled=true`,
      metadata: {
        type: 'creator_subscription',
        user_id: user.id,
        affiliate_id: affiliate.id
      },
      subscription_data: {
        metadata: {
          type: 'creator_subscription',
          user_id: user.id,
          affiliate_id: affiliate.id
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
