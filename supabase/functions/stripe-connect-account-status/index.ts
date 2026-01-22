/**
 * Stripe Connect Account Status Edge Function
 * 
 * This function retrieves the current status of a connected account
 * directly from the Stripe API. This includes onboarding status,
 * capabilities, and whether the account can accept payments.
 * 
 * Note: For this demo, we always fetch fresh data from the API.
 * In production, you should store account status in your database
 * and update it via webhooks for better performance.
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

    const { accountId } = await req.json();

    if (!accountId) {
      throw new Error("accountId is required");
    }

    console.log("[STRIPE-STATUS] Retrieving account status for:", accountId);

    /**
     * Retrieve the connected account directly from Stripe API
     * 
     * This returns comprehensive account information including:
     * - charges_enabled: Whether the account can accept charges
     * - payouts_enabled: Whether the account can receive payouts
     * - details_submitted: Whether all required information has been submitted
     * - requirements: What's still needed to complete onboarding
     * - capabilities: Status of requested capabilities (card_payments, transfers, etc.)
     */
    const account = await stripe.accounts.retrieve(accountId);

    console.log("[STRIPE-STATUS] Account retrieved:", {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

    // Determine overall onboarding status
    let onboardingStatus: "not_started" | "in_progress" | "complete" | "restricted";
    
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      onboardingStatus = "complete";
    } else if (account.details_submitted && (!account.charges_enabled || !account.payouts_enabled)) {
      onboardingStatus = "restricted"; // Submitted but something is blocking
    } else if (account.requirements?.currently_due?.length || account.requirements?.past_due?.length) {
      onboardingStatus = "in_progress";
    } else {
      onboardingStatus = "not_started";
    }

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: account.id,
          email: account.email,
          business_profile: account.business_profile,
          // Payment capabilities
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          // Requirements breakdown
          requirements: {
            currently_due: account.requirements?.currently_due || [],
            eventually_due: account.requirements?.eventually_due || [],
            past_due: account.requirements?.past_due || [],
            disabled_reason: account.requirements?.disabled_reason,
          },
          // Capabilities status
          capabilities: account.capabilities,
          // Computed status for easy frontend use
          onboarding_status: onboardingStatus,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[STRIPE-STATUS] Error retrieving account:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve account status"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
