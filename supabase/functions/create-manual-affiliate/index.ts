import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SKY-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MANUAL-AFFILIATE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    logStep('Function started');

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logStep('Auth error', { error: authError?.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or owner
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .single();

    if (!userRole) {
      logStep('Access denied - not admin', { userId: user.id });
      return new Response(
        JSON.stringify({ success: false, error: 'Apenas administradores podem criar afiliados manualmente' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Admin verified', { adminId: user.id, role: userRole.role });

    // Parse request body
    const { email, name, tier = 'bronze', commission_rate = 10, pix_key, send_invite = true } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Creating affiliate', { email, name, tier });

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let newUserId: string;
    let inviteLink: string | null = null;

    if (existingUser) {
      // User already exists, just create affiliate record
      newUserId = existingUser.id;
      logStep('User already exists', { userId: newUserId });
    } else {
      // Create new user with temporary password
      const tempPassword = generateTempPassword();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] },
      });

      if (createError) {
        logStep('Error creating user', { error: createError.message });
        return new Response(
          JSON.stringify({ success: false, error: `Erro ao criar usuário: ${createError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newUserId = newUser.user.id;
      logStep('User created', { userId: newUserId });

      // Generate invite link for password reset
      if (send_invite) {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            redirectTo: `${req.headers.get('origin') || 'https://skystreamer.online'}/vip/affiliate-register`,
          },
        });

        if (!linkError && linkData) {
          inviteLink = linkData.properties?.action_link || null;
          logStep('Invite link generated');
        }
      }
    }

    // Check if already an affiliate
    const { data: existingAffiliate } = await supabase
      .from('vip_affiliates')
      .select('id')
      .eq('user_id', newUserId)
      .single();

    if (existingAffiliate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Este usuário já é um afiliado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: codeExists } = await supabase
        .from('vip_affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (!codeExists) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    // Create affiliate record
    const { data: affiliate, error: affiliateError } = await supabase
      .from('vip_affiliates')
      .insert({
        user_id: newUserId,
        referral_code: referralCode,
        tier,
        commission_rate,
        pix_key: pix_key || null,
        status: 'approved', // Auto-approve manual affiliates
        total_earnings: 0,
        available_balance: 0,
      })
      .select()
      .single();

    if (affiliateError) {
      logStep('Error creating affiliate', { error: affiliateError.message });
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao criar afiliado: ${affiliateError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Affiliate created', { affiliateId: affiliate.id, referralCode });

    // Log audit entry
    await supabase.from('admin_audit_log').insert({
      action: 'manual_affiliate_created',
      admin_id: user.id,
      target_id: affiliate.id,
      target_table: 'vip_affiliates',
      details: { email, name, tier, commission_rate, referral_code: referralCode },
    });

    // Send welcome email if Resend is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && send_invite) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'SKY BRASIL <noreply@skystreamer.online>',
            to: [email],
            subject: '🎉 Bem-vindo ao Programa de Afiliados SKY BRASIL!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #ec4899;">Parabéns, ${name || 'Afiliado'}!</h1>
                <p>Você foi adicionado ao Programa de Afiliados da SKY BRASIL.</p>
                
                <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <p><strong>Seu código de afiliado:</strong></p>
                  <h2 style="color: #ec4899; font-family: monospace;">${referralCode}</h2>
                  <p><strong>Tier:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
                  <p><strong>Comissão:</strong> ${commission_rate}%</p>
                </div>
                
                ${inviteLink ? `
                  <p>Clique no botão abaixo para ativar sua conta:</p>
                  <a href="${inviteLink}" style="display: inline-block; background: #ec4899; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Ativar Minha Conta
                  </a>
                ` : `
                  <p>Acesse seu dashboard em: <a href="https://skystreamer.online/vip/dashboard">skystreamer.online/vip/dashboard</a></p>
                `}
                
                <p style="margin-top: 30px; color: #666;">
                  Qualquer dúvida, entre em contato conosco pelo WhatsApp ou email.
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                  © 2025 SKY BRASIL - Todos os direitos reservados
                </p>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          logStep('Welcome email sent');
        }
      } catch (emailError) {
        logStep('Failed to send welcome email', { error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        affiliate: {
          id: affiliate.id,
          referral_code: referralCode,
          email,
          name,
          tier,
          commission_rate,
        },
        invite_link: inviteLink,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('ERROR', { message: String(error) });
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
