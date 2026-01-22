/**
 * Stripe Checkout Session for BRL Payments - PRODUCTION READY
 * Version: 2.0.0 - Optimized for Brazilian payments
 * 
 * Features:
 * - PIX (async, needs webhook for confirmation)
 * - Credit cards (Visa, Mastercard, Amex, Elo, Hipercard)
 * - Apple Pay
 * - Google Pay
 * 
 * Uses standardized API version and robust error handling
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ============= CONSTANTS =============
const STRIPE_API_VERSION = "2025-12-15.clover" as const;
const MIN_AMOUNT_BRL = 3.0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface CheckoutRequest {
  productId?: string;
  productName: string;
  price: number;
  description?: string;
  imageUrl?: string;
  quantity?: number;
  customerEmail?: string;
  customerId?: string;
  affiliateCode?: string;
  orderId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

const logCheckout = (step: string, data?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [STRIPE-CHECKOUT-BRL] ${step}${dataStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // ========== CONFIGURATION ==========
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logCheckout("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const mode = stripeKey.startsWith("sk_live") ? "live" : "test";
    logCheckout("Configuration OK", { mode });

    const stripe = new Stripe(stripeKey, { apiVersion: STRIPE_API_VERSION });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========== PARSE REQUEST ==========
    let body: CheckoutRequest;
    try {
      body = await req.json();
    } catch (e) {
      logCheckout("ERROR: Invalid JSON body");
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      productId,
      productName,
      price,
      description,
      imageUrl,
      quantity = 1,
      customerEmail,
      customerId,
      affiliateCode,
      orderId,
      successUrl,
      cancelUrl,
    } = body;

    logCheckout("Request received", {
      productName,
      price,
      quantity,
      email: customerEmail ? customerEmail.slice(0, 3) + "***" : null,
      affiliateCode: affiliateCode || null,
    });

    // ========== VALIDATION ==========
    if (!productName?.trim()) {
      logCheckout("ERROR: Missing product name");
      return new Response(
        JSON.stringify({ error: "Nome do produto é obrigatório" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!price || price <= 0) {
      logCheckout("ERROR: Invalid price", { price });
      return new Response(
        JSON.stringify({ error: "Preço inválido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (price < MIN_AMOUNT_BRL) {
      logCheckout("ERROR: Price below minimum", { price, minimum: MIN_AMOUNT_BRL });
      return new Response(
        JSON.stringify({ error: `Valor mínimo: R$ ${MIN_AMOUNT_BRL.toFixed(2)}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ========== BUILD CHECKOUT SESSION ==========
    const origin = req.headers.get("origin") || "https://skystreamer.online";
    const amountInCents = Math.round(price * 100);

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: productName.trim(),
            description: description || `${productName} - SKY BRASIL`,
            ...(imageUrl && { images: [imageUrl] }),
          },
          unit_amount: amountInCents,
        },
        quantity,
      },
    ];

    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl || `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/cancelado`,
      locale: "pt-BR",
      payment_method_types: ["card", "pix"],
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      metadata: {
        product_id: productId || "",
        product_name: productName,
        affiliate_code: affiliateCode?.toUpperCase()?.trim() || "",
        order_id: orderId || "",
        mode,
        created_at: new Date().toISOString(),
      },
      payment_intent_data: {
        metadata: {
          product_id: productId || "",
          affiliate_code: affiliateCode?.toUpperCase()?.trim() || "",
          order_id: orderId || "",
        },
      },
    };

    // ========== HANDLE CUSTOMER ==========
    if (customerId) {
      sessionParams.customer = customerId;
      logCheckout("Using existing customer", { customerId: customerId.slice(0, 10) + "..." });
    } else if (customerEmail) {
      try {
        const customers = await stripe.customers.list({ 
          email: customerEmail.toLowerCase().trim(), 
          limit: 1 
        });
        
        if (customers.data.length > 0) {
          sessionParams.customer = customers.data[0].id;
          logCheckout("Found existing customer", { customerId: customers.data[0].id.slice(0, 10) + "..." });
        } else {
          sessionParams.customer_email = customerEmail.toLowerCase().trim();
        }
      } catch (customerError) {
        logCheckout("Customer lookup failed, using email", { error: String(customerError) });
        sessionParams.customer_email = customerEmail.toLowerCase().trim();
      }
    }

    // ========== CREATE SESSION ==========
    logCheckout("Creating checkout session...");
    const session = await stripe.checkout.sessions.create(sessionParams);

    const duration = Date.now() - startTime;
    logCheckout("✅ Session created", {
      sessionId: session.id,
      url: session.url?.slice(0, 50) + "...",
      duration: `${duration}ms`,
    });

    // ========== LOG ANALYTICS ==========
    try {
      await supabase.from("analytics_events").insert({
        event_name: "checkout_session_created",
        event_properties: {
          session_id: session.id,
          product_name: productName,
          price,
          affiliate_code: affiliateCode || null,
          payment_methods: ["pix", "card"],
          mode,
        },
      });
    } catch (analyticsError) {
      logCheckout("Analytics insert failed (non-critical)", { error: String(analyticsError) });
    }

    // ========== RESPONSE ==========
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        expiresAt: session.expires_at,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as Error & { type?: string; code?: string; statusCode?: number };
    
    logCheckout("❌ ERROR", {
      message: err.message,
      type: err.type,
      code: err.code,
      duration: `${duration}ms`,
    });

    // User-friendly error messages
    let userMessage = "Erro ao criar sessão de pagamento. Tente novamente.";
    
    if (err.type === "StripeInvalidRequestError") {
      if (err.message?.includes("currency")) {
        userMessage = "Moeda não suportada";
      } else if (err.message?.includes("amount")) {
        userMessage = "Valor inválido";
      } else if (err.message?.includes("customer")) {
        userMessage = "Erro ao processar dados do cliente";
      }
    } else if (err.type === "StripeAuthenticationError") {
      userMessage = "Erro de configuração do sistema de pagamentos";
    }

    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: err.statusCode || 500, headers: corsHeaders }
    );
  }
});
