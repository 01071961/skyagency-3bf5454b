import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommissionNotificationRequest {
  affiliate_id: string;
  commission_amount: number;
  order_total: number;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { affiliate_id, commission_amount, order_total }: CommissionNotificationRequest = await req.json();

    console.log(`Notifying affiliate ${affiliate_id} of commission R$${commission_amount}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get affiliate and user data
    const { data: affiliate, error: affiliateError } = await supabase
      .from("vip_affiliates")
      .select("user_id, referral_code, total_earnings, available_balance")
      .eq("id", affiliate_id)
      .single();

    if (affiliateError || !affiliate) {
      console.error("Affiliate not found:", affiliateError);
      return new Response(
        JSON.stringify({ success: false, error: "Affiliate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", affiliate.user_id)
      .single();

    if (!profile?.email) {
      console.error("User profile not found");
      return new Response(
        JSON.stringify({ success: false, error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification using fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SKY BRASIL <noreply@skystreamer.online>",
        to: [profile.email],
        subject: `🎉 Nova comissão de R$ ${commission_amount.toFixed(2)}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(236, 72, 153, 0.2);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #ec4899; margin: 0; font-size: 28px;">💰 Nova Comissão!</h1>
                </div>
                
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                  Olá, <strong>${profile.name || 'Afiliado'}</strong>!
                </p>
                
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                  Parabéns! Você acabou de receber uma nova comissão por uma venda realizada através do seu link de afiliado.
                </p>
                
                <div style="background: rgba(236, 72, 153, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(236, 72, 153, 0.2);">
                  <div style="text-align: center;">
                    <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Valor da Venda</p>
                    <p style="color: #e2e8f0; margin: 0 0 16px 0; font-size: 20px; font-weight: bold;">R$ ${order_total.toFixed(2)}</p>
                    
                    <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Sua Comissão</p>
                    <p style="color: #22c55e; margin: 0; font-size: 32px; font-weight: bold;">+R$ ${commission_amount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 16px; margin: 24px 0;">
                  <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Saldo Disponível Atual</p>
                  <p style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: bold;">R$ ${(affiliate.available_balance + commission_amount).toFixed(2)}</p>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                  Continue compartilhando seu link e aumente seus ganhos! Você pode solicitar o saque a partir de R$ 50,00.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://skybrasil.agency/vip/referrals" 
                     style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Ver Dashboard de Afiliados
                  </a>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 40px; padding-top: 20px; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; margin: 0;">
                    SKY BRASIL © ${new Date().getFullYear()} • Todos os direitos reservados
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    // Update affiliate available balance
    await supabase
      .from("vip_affiliates")
      .update({ 
        available_balance: affiliate.available_balance + commission_amount,
        total_earnings: affiliate.total_earnings + commission_amount,
      })
      .eq("id", affiliate_id);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-affiliate-commission:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
