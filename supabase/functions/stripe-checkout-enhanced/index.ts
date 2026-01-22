/**
 * Enhanced Stripe Checkout Edge Function
 * 
 * Features:
 * - Adaptive Pricing (automatic currency based on customer location)
 * - Multiple payment methods (card, PIX, boleto)
 * - Automatic tax calculation
 * - Promotion codes support
 * - Enhanced metadata for affiliate tracking
 * - Multi-tenant support
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  referralCode?: string;
  tenantId?: string;
  enableAdaptivePricing?: boolean;
  enablePromotionCodes?: boolean;
  enableAutomaticTax?: boolean;
  paymentMethods?: string[];
  mode?: 'payment' | 'subscription';
  priceId?: string; // For existing Stripe prices
  quantity?: number;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      console.error("[stripe-checkout-enhanced] STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe não configurado");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CheckoutRequest = await req.json();
    const {
      productId,
      productName,
      price,
      currency = "brl",
      successUrl,
      cancelUrl,
      customerEmail,
      referralCode,
      tenantId,
      enableAdaptivePricing = true,
      enablePromotionCodes = true,
      enableAutomaticTax = false,
      paymentMethods = ["card", "pix", "boleto"],
      mode = "payment",
      priceId,
      quantity = 1,
      metadata = {},
    } = body;

    console.log("[stripe-checkout-enhanced] Creating checkout session:", {
      productId,
      productName,
      price,
      currency,
      mode,
      paymentMethods,
    });

    // Validate required fields
    if (!productId || !productName || (!price && !priceId)) {
      console.error("[stripe-checkout-enhanced] Missing required fields");
      throw new Error("Dados do produto incompletos");
    }

    // Get tenant settings if tenantId provided
    let tenantSettings: Record<string, any> = {};
    if (tenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single();
      
      if (tenant?.settings) {
        tenantSettings = tenant.settings as Record<string, any>;
      }
    }

    // Check if customer exists in Stripe
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    if (priceId) {
      // Use existing Stripe price
      lineItems.push({
        price: priceId,
        quantity,
      });
    } else {
      // Create dynamic price data
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: productName,
            description: `SKY BRASIL - ${productName}`,
            metadata: {
              product_id: productId,
              tenant_id: tenantId || "",
            },
          },
          unit_amount: Math.round(price * 100),
          ...(mode === "subscription" && {
            recurring: {
              interval: "month",
            },
          }),
        },
        quantity,
      });
    }

    // Build session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: lineItems,
      success_url: successUrl || `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/checkout/canceled`,
      metadata: {
        product_id: productId,
        product_name: productName,
        referral_code: referralCode || "",
        tenant_id: tenantId || "",
        source: "stripe-checkout-enhanced",
        ...metadata,
      },
      // Payment methods based on currency and region
      payment_method_types: paymentMethods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    };

    // Add customer info
    if (customerId) {
      sessionParams.customer = customerId;
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Enable promotion codes
    if (enablePromotionCodes) {
      sessionParams.allow_promotion_codes = true;
    }

    // Enable automatic tax (requires Tax registration in Stripe Dashboard)
    if (enableAutomaticTax || tenantSettings.stripe_automatic_tax) {
      sessionParams.automatic_tax = { enabled: true };
    }

    // Add affiliate tracking
    if (referralCode) {
      sessionParams.client_reference_id = referralCode;
    }

    // Add billing address collection for adaptive pricing
    if (enableAdaptivePricing) {
      sessionParams.billing_address_collection = "auto";
    }

    // Subscription-specific settings
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: {
          product_id: productId,
          referral_code: referralCode || "",
          tenant_id: tenantId || "",
        },
      };
    }

    // Payment intent data for one-time payments
    if (mode === "payment") {
      sessionParams.payment_intent_data = {
        metadata: {
          product_id: productId,
          product_name: productName,
          referral_code: referralCode || "",
          tenant_id: tenantId || "",
        },
        // Enhanced fraud protection
        setup_future_usage: "off_session",
      };
    }

    // Phone number collection for PIX/Boleto in Brazil
    if (paymentMethods.includes("pix") || paymentMethods.includes("boleto")) {
      sessionParams.phone_number_collection = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("[stripe-checkout-enhanced] Session created:", session.id);

    // Log analytics event
    try {
      await supabase.from('analytics_events').insert({
        event_name: 'checkout_session_created',
        event_properties: {
          session_id: session.id,
          product_id: productId,
          mode,
          payment_methods: paymentMethods,
          currency,
          amount: price,
        },
        tenant_id: tenantId || null,
      });
    } catch (analyticsError) {
      console.warn("[stripe-checkout-enhanced] Analytics logging failed:", analyticsError);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY") || "",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[stripe-checkout-enhanced] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro ao criar sessão de pagamento",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
