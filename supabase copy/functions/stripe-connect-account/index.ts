/**
 * Stripe Connect Account Creation Edge Function
 * 
 * This function creates a new Connected Account on Stripe using the
 * platform's account configuration. Connected accounts allow your users
 * to accept payments directly through your platform.
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
    // PLACEHOLDER: Replace with your Stripe secret key
    // The secret key should be stored securely in Supabase secrets
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Please add it to your Supabase secrets.");
    }

    // Initialize Stripe with the latest API version
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover",
    });

    const { email, businessName, country = "BR" } = await req.json();

    console.log("[STRIPE-CONNECT] Creating connected account:", { email, businessName, country });

    /**
     * Create a Connected Account with platform-controlled settings
     * 
     * Controller settings explanation:
     * - fees.payer: 'account' - The connected account pays Stripe fees
     * - losses.payments: 'stripe' - Stripe handles payment disputes and chargebacks
     * - stripe_dashboard.type: 'full' - Connected account gets full Stripe dashboard access
     * 
     * IMPORTANT: Do NOT use top-level type: 'express', 'standard', or 'custom'
     * Always use the controller object to configure account behavior
     */
    const account = await stripe.accounts.create({
      // Controller configuration for the connected account
      controller: {
        // Platform controls fee collection - connected account pays fees
        fees: {
          payer: 'account' as const
        },
        // Stripe handles payment disputes and losses
        losses: {
          payments: 'stripe' as const
        },
        // Connected account gets full access to Stripe dashboard
        stripe_dashboard: {
          type: 'full' as const
        }
      },
      // Pre-fill account information if provided
      email: email,
      business_profile: {
        name: businessName,
      },
      country: country,
      // Capabilities to request for the connected account
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log("[STRIPE-CONNECT] Account created successfully:", account.id);

    return new Response(
      JSON.stringify({
        success: true,
        accountId: account.id,
        // Return relevant account information for the frontend
        account: {
          id: account.id,
          email: account.email,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[STRIPE-CONNECT] Error creating account:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create connected account"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
