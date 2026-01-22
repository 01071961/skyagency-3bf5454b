/**
 * List Invoices Edge Function
 * 
 * Fetches user's invoices and payment history from Stripe
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-INVOICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      throw new Error("Usuário não autenticado");
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      throw new Error("Email do usuário não disponível");
    }

    logStep("User authenticated", { email: userEmail.slice(0, 3) + "***" });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ invoices: [], charges: [], hasCustomer: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId: customerId.slice(0, 8) + "..." });

    // Fetch invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });

    // Fetch charges (for one-time payments)
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 50,
    });

    // Format invoices
    const formattedInvoices = invoices.data.map((inv: Stripe.Invoice) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_total: inv.total,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      currency: inv.currency,
      created: inv.created,
      due_date: inv.due_date,
      paid_at: inv.status_transitions?.paid_at,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      description: inv.description || inv.lines.data[0]?.description || 'Fatura',
      subscription_id: inv.subscription,
      period_start: inv.period_start,
      period_end: inv.period_end,
    }));

    // Format charges (exclude those linked to invoices)
    const invoiceChargeIds = new Set(invoices.data.map((inv: Stripe.Invoice) => inv.charge).filter(Boolean));
    const formattedCharges = charges.data
      .filter((ch: Stripe.Charge) => !invoiceChargeIds.has(ch.id))
      .map((ch: Stripe.Charge) => ({
        id: ch.id,
        status: ch.status,
        amount: ch.amount,
        amount_refunded: ch.amount_refunded,
        currency: ch.currency,
        created: ch.created,
        paid: ch.paid,
        refunded: ch.refunded,
        description: ch.description || ch.metadata?.product_name || 'Pagamento',
        receipt_url: ch.receipt_url,
        payment_method_type: ch.payment_method_details?.type,
        order_id: ch.metadata?.order_id,
      }));

    logStep("Fetched data", { 
      invoiceCount: formattedInvoices.length, 
      chargeCount: formattedCharges.length 
    });

    return new Response(
      JSON.stringify({
        invoices: formattedInvoices,
        charges: formattedCharges,
        hasCustomer: true,
        customerName: customers.data[0].name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
