/**
 * Stripe Config Edge Function - Rebuilt from Scratch
 * Returns the publishable key to the frontend
 * 
 * Docs: https://stripe.com/docs/keys
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");

    if (!publishableKey) {
      console.error("[STRIPE-CONFIG] STRIPE_PUBLISHABLE_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine mode from key
    const mode = publishableKey.includes("_test_") ? "test" : "live";
    console.log(`[STRIPE-CONFIG] Returning ${mode.toUpperCase()} key`);

    return new Response(
      JSON.stringify({
        publishableKey,
        mode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[STRIPE-CONFIG] Error:", message);
    
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
