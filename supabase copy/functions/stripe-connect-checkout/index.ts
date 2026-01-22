/**
 * Stripe Connect Checkout Edge Function
 * 
 * This function creates a Checkout Session for purchasing products
 * from a connected account using Direct Charges.
 * 
 * Direct Charges mean:
 * - The payment goes directly to the connected account
 * - The platform takes an application fee from the transaction
 * - The connected account is the merchant of record
 * 
 * API Version: 2025-12-15.clover
 */

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover",
    });

    const { 
      accountId, 
      priceId, 
      productName,
      priceInCents,
      quantity = 1,
      successUrl,
      cancelUrl,
      customerEmail,
    } = await req.json();

    if (!accountId) {
      throw new Error("accountId is required for connected account checkout");
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    console.log("[STRIPE-CHECKOUT] Creating checkout session:", {
      accountId,
      priceId,
      productName,
      priceInCents,
      quantity,
    });

    /**
     * Calculate application fee
     * 
     * The application fee is the amount the platform keeps from each transaction.
     * Common approaches:
     * - Percentage: e.g., 10% of the transaction
     * - Fixed amount: e.g., R$5 per transaction
     * - Combination: percentage + fixed minimum
     * 
     * PLACEHOLDER: Adjust this calculation based on your business model
     */
    const applicationFeePercent = 10; // 10% platform fee
    const applicationFeeAmount = Math.round((priceInCents * quantity * applicationFeePercent) / 100);

    console.log("[STRIPE-CHECKOUT] Application fee:", applicationFeeAmount, "cents");

    /**
     * Create a Checkout Session with Direct Charge
     * 
     * Direct Charges:
     * - The connected account is the merchant of record
     * - Customer sees the connected account's name on their statement
     * - The platform extracts an application fee
     * 
     * The stripeAccount option in the second parameter creates
     * the checkout session ON the connected account, making it
     * a direct charge.
     */
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      // Line items for the purchase
      line_items: [
        priceId
          ? {
              // If we have a price ID, use it directly
              price: priceId,
              quantity: quantity,
            }
          : {
              // Otherwise, create price data inline
              price_data: {
                currency: "brl",
                product_data: {
                  name: productName || "Product",
                },
                unit_amount: priceInCents,
              },
              quantity: quantity,
            },
      ],
      // Payment intent data with application fee
      payment_intent_data: {
        /**
         * Application Fee Amount
         * 
         * This is the amount (in cents) that the platform will receive
         * from this transaction. The rest goes to the connected account.
         * 
         * Example: If total is R$100 and fee is R$10:
         * - Connected account receives R$90 (minus Stripe fees)
         * - Platform receives R$10
         */
        application_fee_amount: applicationFeeAmount,
      },
      // Redirect URLs
      success_url: successUrl || `${origin}/store/${accountId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/store/${accountId}?canceled=true`,
      // Pre-fill customer email if provided
      customer_email: customerEmail || undefined,
    };

    /**
     * Create session ON the connected account
     * 
     * The second parameter with stripeAccount makes this a Direct Charge.
     * The checkout session belongs to the connected account.
     */
    const session = await stripe.checkout.sessions.create(
      sessionParams,
      {
        stripeAccount: accountId,
      }
    );

    console.log("[STRIPE-CHECKOUT] Session created:", session.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[STRIPE-CHECKOUT] Error creating checkout:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create checkout session"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
