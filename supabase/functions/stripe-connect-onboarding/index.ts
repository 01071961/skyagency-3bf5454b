/**
 * Stripe Connect Onboarding Edge Function
 * 
 * This function creates an Account Link for onboarding connected accounts.
 * Account Links are temporary URLs that redirect users to Stripe's hosted
 * onboarding flow where they can provide required business information.
 * 
 * API Version: 2025-12-15.clover
 * 
 * Required Secrets:
 * - STRIPE_SECRET_KEY: Your platform's Stripe secret key
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
    // PLACEHOLDER: Ensure STRIPE_SECRET_KEY is configured
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Please add it to your Supabase secrets.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover",
    });

    const { accountId, returnUrl, refreshUrl } = await req.json();

    if (!accountId) {
      throw new Error("accountId is required");
    }

    // Get the origin from request headers for default URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";

    console.log("[STRIPE-ONBOARDING] Creating account link for:", accountId);

    /**
     * Create an Account Link for the connected account
     * 
     * Account Links are used to direct users to Stripe's hosted onboarding
     * 
     * Parameters:
     * - account: The connected account ID to onboard
     * - refresh_url: Where to redirect if the link expires or user needs to restart
     * - return_url: Where to redirect after successful onboarding
     * - type: 'account_onboarding' for initial setup, 'account_update' for updates
     * - collection_options: What information to collect
     */
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      // URL to redirect if the link expires (user should be able to regenerate)
      refresh_url: refreshUrl || `${origin}/connect/onboarding?refresh=true&account=${accountId}`,
      // URL to redirect after completing onboarding
      return_url: returnUrl || `${origin}/connect/onboarding?success=true&account=${accountId}`,
      // Type of account link
      type: "account_onboarding",
      // Optionally specify what to collect
      collection_options: {
        fields: "eventually_due", // Collect all required fields
      },
    });

    console.log("[STRIPE-ONBOARDING] Account link created:", accountLink.url);

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[STRIPE-ONBOARDING] Error creating account link:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create onboarding link"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
