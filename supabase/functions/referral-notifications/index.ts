import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 
  | 'referral_signup'      // When referred user signs up
  | 'referral_converted'   // When referred user makes first purchase
  | 'welcome_bonus'        // Welcome email to new referred user
  | 'commission_earned'    // Commission earned notification

interface NotificationRequest {
  type: NotificationType;
  referrer_id?: string;
  referred_email?: string;
  referred_name?: string;
  commission_amount?: number;
  order_total?: number;
  points_earned?: number;
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SKY BRASIL <noreply@skystreamer.online>",
      to: [to],
      subject,
      html,
    }),
  });
  return response.json();
};

const emailTemplates = {
  referral_signup: (referrerName: string, referredName: string) => ({
    subject: `🎉 ${referredName} aceitou seu convite!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(236, 72, 153, 0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ec4899; margin: 0; font-size: 28px;">🎉 Novo Cadastro!</h1>
            </div>
            
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
              Olá, <strong>${referrerName}</strong>!
            </p>
            
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
              <strong>${referredName}</strong> aceitou seu convite e se cadastrou na SKY BRASIL!
            </p>
            
            <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(59, 130, 246, 0.2);">
              <div style="text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Status do Convite</p>
                <p style="color: #3b82f6; margin: 0; font-size: 18px; font-weight: bold;">✓ Cadastrado</p>
                <p style="color: #94a3b8; margin: 16px 0 0 0; font-size: 14px;">
                  Você receberá <strong style="color: #22c55e;">10 pontos</strong> quando ${referredName} fizer a primeira compra!
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://skybrasil.agency/vip/referrals" 
                 style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ver Meus Convites
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

  referral_converted: (referrerName: string, referredName: string, commission: number, points: number) => ({
    subject: `💰 ${referredName} fez a primeira compra - Você ganhou!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(34, 197, 94, 0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0; font-size: 28px;">💰 Você Ganhou!</h1>
            </div>
            
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
              Olá, <strong>${referrerName}</strong>!
            </p>
            
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
              <strong>${referredName}</strong> fez a primeira compra e você ganhou bônus!
            </p>
            
            <div style="background: rgba(34, 197, 94, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(34, 197, 94, 0.2);">
              <div style="text-align: center;">
                <div style="display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;">
                  <div>
                    <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Comissão</p>
                    <p style="color: #22c55e; margin: 0; font-size: 28px; font-weight: bold;">+R$ ${commission.toFixed(2)}</p>
                  </div>
                  <div>
                    <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Pontos Bônus</p>
                    <p style="color: #8b5cf6; margin: 0; font-size: 28px; font-weight: bold;">+${points}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
              Continue convidando amigos para aumentar seus ganhos!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://skybrasil.agency/vip/referrals" 
                 style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ver Meu Dashboard
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

  welcome_bonus: (name: string, referrerName: string, bonusPoints: number) => ({
    subject: `🎁 Bem-vindo à SKY BRASIL! Você ganhou ${bonusPoints} pontos!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.2);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">🎁 Bem-vindo à SKY BRASIL!</h1>
            </div>
            
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
              Olá, <strong>${name}</strong>!
            </p>
            
            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
              Você foi convidado por <strong>${referrerName}</strong> e ganhou um bônus especial de boas-vindas!
            </p>
            
            <div style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
              <div style="text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Seu Bônus de Boas-Vindas</p>
                <p style="color: #8b5cf6; margin: 0; font-size: 36px; font-weight: bold;">+${bonusPoints} pontos</p>
                <p style="color: #94a3b8; margin: 16px 0 0 0; font-size: 14px;">
                  Use seus pontos para trocar por recompensas exclusivas!
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://skybrasil.agency/vip/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Acessar Minha Conta
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
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: NotificationRequest = await req.json();
    const { type, referrer_id, referred_email, referred_name, commission_amount, points_earned } = request;

    console.log(`[Referral Notifications] Type: ${type}`, request);

    // Get referrer info
    let referrerEmail = '';
    let referrerName = 'Afiliado';

    if (referrer_id) {
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('user_id')
        .eq('id', referrer_id)
        .single();

      if (affiliate) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('user_id', affiliate.user_id)
          .single();

        if (profile) {
          referrerEmail = profile.email;
          referrerName = profile.name || 'Afiliado';
        }
      }
    }

    switch (type) {
      case 'referral_signup': {
        // Notify referrer that someone signed up
        if (referrerEmail) {
          const template = emailTemplates.referral_signup(referrerName, referred_name || 'Novo usuário');
          await sendEmail(referrerEmail, template.subject, template.html);
          console.log(`[Referral Notifications] Sent signup notification to ${referrerEmail}`);
        }
        break;
      }

      case 'referral_converted': {
        // Notify referrer that referred user made first purchase
        if (referrerEmail) {
          const template = emailTemplates.referral_converted(
            referrerName,
            referred_name || 'Usuário',
            commission_amount || 0,
            points_earned || 10
          );
          await sendEmail(referrerEmail, template.subject, template.html);
          console.log(`[Referral Notifications] Sent conversion notification to ${referrerEmail}`);
        }
        break;
      }

      case 'welcome_bonus': {
        // Welcome email to new referred user
        if (referred_email) {
          const template = emailTemplates.welcome_bonus(
            referred_name || 'Usuário',
            referrerName,
            points_earned || 5
          );
          await sendEmail(referred_email, template.subject, template.html);
          console.log(`[Referral Notifications] Sent welcome bonus to ${referred_email}`);
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Referral Notifications] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
