import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
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
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, name, program_id, commission_rate } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already invited or is affiliate
    const { data: existingInvite } = await supabase
      .from('affiliate_invites')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ success: false, error: 'Este email já possui um convite pendente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists and is already an affiliate
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      const { data: existingAffiliate } = await supabase
        .from('vip_affiliates')
        .select('id')
        .eq('user_id', existingProfile.user_id)
        .single();

      if (existingAffiliate) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este usuário já é um afiliado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate unique token
    const inviteToken = generateToken();

    // Create invite - ensure program_id is null if "none" or empty
    const cleanProgramId = program_id && program_id !== 'none' && program_id !== '' ? program_id : null;
    
    const { data: invite, error: insertError } = await supabase
      .from('affiliate_invites')
      .insert({
        email,
        name: name || null,
        program_id: cleanProgramId,
        commission_rate: commission_rate || 10,
        token: inviteToken,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Affiliate Invite] Insert error:', insertError);
      throw insertError;
    }

    // Get program name if exists
    let programName = 'Programa de Afiliados SKY BRASIL';
    if (program_id) {
      const { data: program } = await supabase
        .from('affiliate_programs')
        .select('name')
        .eq('id', program_id)
        .single();
      if (program) programName = program.name;
    }

    // Send email via Resend
    if (resendApiKey) {
      const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'https://skystreamer.online'}/affiliate/accept?token=${inviteToken}`;
      
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SKY BRASIL <noreply@skystreamer.online>',
          to: [email],
          subject: `Convite para ser Afiliado - ${programName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #fff; margin: 0; font-size: 28px;">🎉 Você foi convidado!</h1>
                  </div>
                  
                  <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                    Olá${name ? ` ${name}` : ''},
                  </p>
                  
                  <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                    Você foi convidado para se tornar um <strong style="color: #00d4ff;">Afiliado SKY BRASIL</strong>!
                  </p>
                  
                  <div style="background: rgba(0, 212, 255, 0.1); border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid rgba(0, 212, 255, 0.2);">
                    <h3 style="color: #00d4ff; margin: 0 0 15px 0;">Benefícios:</h3>
                    <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Comissão de <strong style="color: #00ff88;">${commission_rate || 10}%</strong> em cada venda</li>
                      <li>Link exclusivo de divulgação</li>
                      <li>Relatórios detalhados de vendas</li>
                      <li>Saques via PIX em D+2</li>
                      <li>Suporte dedicado</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Aceitar Convite
                    </a>
                  </div>
                  
                  <p style="color: #888; font-size: 14px; text-align: center;">
                    Este convite expira em 7 dias.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
                  
                  <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                    SKY BRASIL - Transformando Lives em Negócios<br>
                    <a href="https://skystreamer.online" style="color: #00d4ff;">skystreamer.online</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (!emailRes.ok) {
        console.error('[Affiliate Invite] Erro ao enviar email:', await emailRes.text());
      }
    }

    console.log('[Affiliate Invite] Convite criado:', { email, program_id, commission_rate });

    return new Response(
      JSON.stringify({ success: true, invite }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Affiliate Invite] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
