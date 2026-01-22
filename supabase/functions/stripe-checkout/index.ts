import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      console.error("[stripe-checkout] STRIPE_SECRET_KEY is not configured");
      throw new Error("Stripe não configurado");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    const { productId, productName, price, successUrl, cancelUrl, customerEmail, referralCode } = await req.json();

    console.log("[stripe-checkout] Creating checkout session:", { productId, productName, price, customerEmail });

    // Validate required fields
    if (!productId || !productName || !price) {
      console.error("[stripe-checkout] Missing required fields");
      throw new Error("Dados do produto incompletos");
    }

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: productName,
              description: `Curso Academy SKY - ${productName}`,
            },
            unit_amount: Math.round(price * 100), // Convert to centavos
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.get("origin")}/academy?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/academy?canceled=true`,
      metadata: {
        product_id: productId,
        referral_code: referralCode || "",
      },
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Add Rewardful client_reference_id for affiliate tracking
    if (referralCode) {
      sessionParams.client_reference_id = referralCode;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("[stripe-checkout] Session created:", session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[stripe-checkout] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao criar sessão de pagamento" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
