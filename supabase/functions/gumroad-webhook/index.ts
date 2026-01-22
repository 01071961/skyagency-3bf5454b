/**
 * Gumroad Webhook Handler Edge Function
 * 
 * Features:
 * - Process Gumroad sales webhooks
 * - Sync enrollments with SKY database
 * - Track affiliate commissions from Gumroad
 * - Sync analytics events
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GumroadSalePayload {
  seller_id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  product_permalink: string;
  short_product_id: string;
  email: string;
  price: number;
  gumroad_fee: number;
  currency: string;
  quantity: number;
  discover_fee_charged: boolean;
  can_contact: boolean;
  referrer: string;
  card?: {
    visual: string;
    type: string;
    bin: string;
    expiry_month: number;
    expiry_year: number;
  };
  order_number: number;
  sale_id: string;
  sale_timestamp: string;
  purchaser_id: string;
  subscription_id?: string;
  variants?: string;
  test: boolean;
  ip_country: string;
  is_gift_receiver_purchase: boolean;
  refunded: boolean;
  disputed: boolean;
  dispute_won: boolean;
  custom_fields?: Record<string, string>;
  affiliate?: {
    email: string;
    amount: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse form data (Gumroad sends form-encoded data)
    const formData = await req.formData();
    const payload: Partial<GumroadSalePayload> = {};
    
    for (const [key, value] of formData.entries()) {
      if (key === "price" || key === "gumroad_fee" || key === "quantity" || key === "order_number") {
        (payload as Record<string, unknown>)[key] = Number(value);
      } else if (key === "test" || key === "can_contact" || key === "discover_fee_charged" || 
                 key === "is_gift_receiver_purchase" || key === "refunded" || 
                 key === "disputed" || key === "dispute_won") {
        (payload as Record<string, unknown>)[key] = value === "true";
      } else if (key === "affiliate") {
        try {
          payload.affiliate = JSON.parse(value as string);
        } catch {
          // Affiliate might be simple string
        }
      } else if (key === "custom_fields") {
        try {
          payload.custom_fields = JSON.parse(value as string);
        } catch {
          // Custom fields might not be JSON
        }
      } else {
        (payload as Record<string, unknown>)[key] = value;
      }
    }

    console.log("[gumroad-webhook] Received sale:", {
      sale_id: payload.sale_id,
      product_name: payload.product_name,
      email: payload.email,
      price: payload.price,
      test: payload.test,
    });

    // Skip test transactions in production
    if (payload.test) {
      console.log("[gumroad-webhook] Test transaction - skipping");
      return new Response(JSON.stringify({ received: true, test: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Skip refunded transactions
    if (payload.refunded) {
      console.log("[gumroad-webhook] Refunded transaction - handling refund");
      
      // Update order status if exists
      await supabase
        .from('orders')
        .update({ 
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('payment_id', `gumroad_${payload.sale_id}`);

      return new Response(JSON.stringify({ received: true, refunded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Find or create user by email
    let userId: string | null = null;
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', payload.email)
      .single();

    if (existingUser) {
      userId = existingUser.user_id;
    }

    // Map Gumroad product to SKY product
    const { data: skyProduct } = await supabase
      .from('products')
      .select('*')
      .eq('gumroad_link', payload.product_permalink)
      .single();

    // Calculate net amount (price minus Gumroad fee)
    const netAmount = (payload.price || 0) - (payload.gumroad_fee || 0);

    // Create order record
    const orderNumber = `GUM-${payload.order_number || payload.sale_id}`;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: payload.email || '',
        customer_name: payload.custom_fields?.name || payload.email?.split('@')[0] || 'Gumroad Customer',
        subtotal: payload.price || 0,
        total: payload.price || 0,
        status: 'paid',
        paid_at: payload.sale_timestamp || new Date().toISOString(),
        payment_id: `gumroad_${payload.sale_id}`,
        payment_method: 'gumroad',
        user_id: userId,
        metadata: {
          source: 'gumroad',
          gumroad_sale_id: payload.sale_id,
          gumroad_product_id: payload.product_id,
          gumroad_fee: payload.gumroad_fee,
          net_amount: netAmount,
          ip_country: payload.ip_country,
          referrer: payload.referrer,
          subscription_id: payload.subscription_id,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error("[gumroad-webhook] Error creating order:", orderError);
      throw orderError;
    }

    console.log("[gumroad-webhook] Order created:", order.id);

    // Create order item
    if (skyProduct) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: skyProduct.id,
        product_name: payload.product_name || skyProduct.name,
        price: payload.price || 0,
      });

      // Create enrollment if user exists
      if (userId) {
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .upsert({
            user_id: userId,
            product_id: skyProduct.id,
            order_id: order.id,
            status: 'active',
            enrolled_at: new Date().toISOString(),
            expires_at: skyProduct.access_days 
              ? new Date(Date.now() + skyProduct.access_days * 24 * 60 * 60 * 1000).toISOString()
              : null,
          }, {
            onConflict: 'user_id,product_id',
          });

        if (enrollmentError) {
          console.error("[gumroad-webhook] Error creating enrollment:", enrollmentError);
        } else {
          console.log("[gumroad-webhook] Enrollment created for user:", userId);
        }
      }
    }

    // Process affiliate commission from Gumroad
    if (payload.affiliate?.email && payload.affiliate?.amount > 0) {
      console.log("[gumroad-webhook] Processing Gumroad affiliate:", payload.affiliate);

      // Find affiliate by email
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('*')
        .eq('email', payload.affiliate.email)
        .eq('status', 'approved')
        .single();

      if (affiliate) {
        const commissionAmount = payload.affiliate.amount / 100; // Gumroad sends in cents

        await supabase.from('affiliate_commissions').insert({
          affiliate_id: affiliate.id,
          order_id: order.id,
          order_total: payload.price || 0,
          commission_rate: (commissionAmount / (payload.price || 1)) * 100,
          commission_amount: commissionAmount,
          status: 'pending',
        });

        // Update affiliate earnings
        await supabase
          .from('vip_affiliates')
          .update({
            total_earnings: (affiliate.total_earnings || 0) + commissionAmount,
          })
          .eq('id', affiliate.id);

        console.log("[gumroad-webhook] Affiliate commission created:", commissionAmount);
      }
    }

    // Award points to buyer if user exists
    if (userId) {
      const pointsToAward = Math.floor(payload.price || 0);

      const { data: existingPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingPoints) {
        const newBalance = (existingPoints.current_balance || 0) + pointsToAward;
        const newTotalEarned = (existingPoints.total_earned || 0) + pointsToAward;

        await supabase
          .from('user_points')
          .update({
            current_balance: newBalance,
            total_earned: newTotalEarned,
            last_activity: new Date().toISOString(),
          })
          .eq('user_id', userId);

        await supabase.from('point_transactions').insert({
          user_id: userId,
          order_id: order.id,
          type: 'earn',
          amount: pointsToAward,
          balance_after: newBalance,
          description: `Pontos por compra Gumroad - ${payload.product_name}`,
        });
      } else {
        await supabase.from('user_points').insert({
          user_id: userId,
          current_balance: pointsToAward,
          total_earned: pointsToAward,
          tier: 'bronze',
        });

        await supabase.from('point_transactions').insert({
          user_id: userId,
          order_id: order.id,
          type: 'earn',
          amount: pointsToAward,
          balance_after: pointsToAward,
          description: `Pontos por compra Gumroad - ${payload.product_name}`,
        });
      }

      console.log("[gumroad-webhook] Points awarded:", pointsToAward);
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_name: 'gumroad_sale',
      event_properties: {
        sale_id: payload.sale_id,
        product_id: payload.product_id,
        product_name: payload.product_name,
        price: payload.price,
        currency: payload.currency,
        ip_country: payload.ip_country,
        has_affiliate: !!payload.affiliate,
      },
      user_id: userId,
    });

    return new Response(
      JSON.stringify({
        received: true,
        order_id: order.id,
        order_number: orderNumber,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[gumroad-webhook] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Webhook processing failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
