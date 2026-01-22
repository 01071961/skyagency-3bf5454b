/**
 * Stripe Invoice Preview Edge Function
 * 
 * Features:
 * - Preview upcoming invoices for subscription changes
 * - Calculate proration for upgrades/downgrades
 * - Show price differences before confirming changes
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoicePreviewRequest {
  customerId?: string;
  subscriptionId?: string;
  newPriceId: string;
  quantity?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe não configurado");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Usuário não autenticado");
    }

    const { customerId, subscriptionId, newPriceId, quantity = 1 }: InvoicePreviewRequest = await req.json();

    console.log("[stripe-invoice-preview] Processing preview:", {
      customerId,
      subscriptionId,
      newPriceId,
    });

    // Get customer ID from user email if not provided
    let stripeCustomerId = customerId;
    if (!stripeCustomerId && userData.user.email) {
      const customers = await stripe.customers.list({
        email: userData.user.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      }
    }

    if (!stripeCustomerId) {
      throw new Error("Cliente Stripe não encontrado");
    }

    // Get subscription if not provided
    let stripeSubscriptionId = subscriptionId;
    if (!stripeSubscriptionId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
        limit: 1,
      });
      if (subscriptions.data.length > 0) {
        stripeSubscriptionId = subscriptions.data[0].id;
      }
    }

    if (!stripeSubscriptionId) {
      // No existing subscription - show new subscription pricing
      const price = await stripe.prices.retrieve(newPriceId);
      const product = await stripe.products.retrieve(price.product as string);

      return new Response(
        JSON.stringify({
          type: "new_subscription",
          price: {
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
          },
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
          },
          total: (price.unit_amount || 0) * quantity,
          quantity,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const currentItem = subscription.items.data[0];

    // Preview the invoice with the new price
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: stripeCustomerId,
      subscription: stripeSubscriptionId,
      subscription_items: [
        {
          id: currentItem.id,
          price: newPriceId,
          quantity,
        },
      ],
      subscription_proration_behavior: "create_prorations",
    });

    // Get price details
    const newPrice = await stripe.prices.retrieve(newPriceId);
    const newProduct = await stripe.products.retrieve(newPrice.product as string);
    
    const currentPrice = await stripe.prices.retrieve(currentItem.price.id);
    const currentProduct = await stripe.products.retrieve(currentPrice.product as string);

    // Calculate proration
    const prorationAmount = upcomingInvoice.lines.data
      .filter((line: Stripe.InvoiceLineItem) => line.proration)
      .reduce((sum: number, line: Stripe.InvoiceLineItem) => sum + line.amount, 0);

    return new Response(
      JSON.stringify({
        type: "subscription_change",
        current: {
          price: {
            id: currentPrice.id,
            unit_amount: currentPrice.unit_amount,
            currency: currentPrice.currency,
          },
          product: {
            id: currentProduct.id,
            name: currentProduct.name,
          },
          quantity: currentItem.quantity,
        },
        new: {
          price: {
            id: newPrice.id,
            unit_amount: newPrice.unit_amount,
            currency: newPrice.currency,
          },
          product: {
            id: newProduct.id,
            name: newProduct.name,
            description: newProduct.description,
          },
          quantity,
        },
        preview: {
          subtotal: upcomingInvoice.subtotal,
          total: upcomingInvoice.total,
          proration_amount: prorationAmount,
          amount_due: upcomingInvoice.amount_due,
          currency: upcomingInvoice.currency,
          period_start: upcomingInvoice.period_start,
          period_end: upcomingInvoice.period_end,
          next_payment_attempt: upcomingInvoice.next_payment_attempt,
        },
        lines: upcomingInvoice.lines.data.map((line: Stripe.InvoiceLineItem) => ({
          description: line.description,
          amount: line.amount,
          proration: line.proration,
          period: line.period,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[stripe-invoice-preview] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro ao gerar preview",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
