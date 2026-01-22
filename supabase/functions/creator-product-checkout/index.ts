import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATOR-PRODUCT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { productId, affiliateCode, customerEmail } = await req.json();

    if (!productId) {
      throw new Error("Product ID is required");
    }

    logStep("Processing product checkout", { productId, affiliateCode });

    // Fetch product with creator info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        creator:creator_id(
          id,
          user_id,
          referral_code,
          profiles:user_id(email, name)
        )
      `)
      .eq('id', productId)
      .eq('status', 'published')
      .single();

    if (productError || !product) {
      throw new Error("Produto não encontrado ou não está disponível");
    }

    logStep("Product found", { 
      name: product.name, 
      price: product.price,
      isCreatorProduct: product.is_creator_product,
      creatorId: product.creator_id
    });

    // Get or create customer
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || "https://skystreamer.online";

    // Commission distribution for creator products
    const creatorRate = product.creator_commission_rate || 70;
    const platformRate = product.platform_commission_rate || 20;
    const affiliateRate = product.affiliate_commission_rate || 10;

    // Create checkout session with complete metadata for webhook processing
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: product.name,
              description: product.short_description || `Produto Sky Brasil - ${product.name}`,
              images: product.cover_image_url ? [product.cover_image_url] : [],
            },
            unit_amount: Math.round(Number(product.price) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/produto/${product.slug}?canceled=true`,
      metadata: {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        is_creator_product: product.is_creator_product ? 'true' : 'false',
        creator_id: product.creator_id || '',
        affiliate_code: affiliateCode || '',
        creator_commission_rate: String(creatorRate),
        platform_commission_rate: String(platformRate),
        affiliate_commission_rate: String(affiliateRate),
      },
    };

    // Add affiliate tracking
    if (affiliateCode) {
      sessionParams.client_reference_id = affiliateCode;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      metadata: sessionParams.metadata 
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
