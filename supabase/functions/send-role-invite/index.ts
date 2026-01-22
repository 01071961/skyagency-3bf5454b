import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
  role: 'editor' | 'admin' | 'owner';
  inviterName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { email, name, role, inviterName }: InviteRequest = await req.json();

    if (!email || !name || !role) {
      throw new Error("Email, name and role are required");
    }

    // Generate secure token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get current user from auth header
    const authHeader = req.headers.get("Authorization");
    let invitedBy = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      invitedBy = user?.id;
    }

    // Store invitation in database
    const { error: insertError } = await supabase
      .from('admin_invitations')
      .insert({
        email: email.toLowerCase().trim(),
        role,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: invitedBy,
        inviter_name: inviterName || 'SKY BRASIL'
      });

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error("Já existe um convite pendente para este e-mail");
      }
      throw insertError;
    }

    // Magic link URL
    const magicLinkUrl = `https://skystreamer.online/auth?invite=${token}`;
    
    const roleLabels: Record<string, string> = {
      editor: 'Editor',
      admin: 'Administrador',
      owner: 'Proprietário'
    };

    const roleDescriptions: Record<string, string> = {
      editor: 'criar e editar conteúdo no painel',
      admin: 'gerenciar usuários, afiliados e visualizar transações',
      owner: 'acesso total ao sistema incluindo configurações e API'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding-bottom: 30px; border-bottom: 1px solid #1e1e1e; }
    .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .content { padding: 30px 0; }
    h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 15px; }
    .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .role-badge { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .info-box { background-color: #1e1e1e; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .info-box h3 { color: #ec4899; margin-top: 0; font-size: 16px; }
    .warning-box { background-color: #422006; border: 1px solid #854d0e; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .warning-box p { color: #fbbf24; margin: 0; font-size: 13px; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #1e1e1e; color: #71717a; font-size: 12px; }
    .expiry { color: #71717a; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SKY BRASIL</div>
    </div>
    <div class="content">
      <h1>Olá, ${name}! 👋</h1>
      
      <p>${inviterName || 'A equipe SKY BRASIL'} convidou você para fazer parte do painel administrativo como:</p>
      
      <p style="text-align: center; margin: 24px 0;">
        <span class="role-badge">${roleLabels[role]}</span>
      </p>
      
      <div class="info-box">
        <h3>📋 Suas permissões:</h3>
        <p style="margin-bottom: 0;">Como <strong>${roleLabels[role]}</strong>, você poderá ${roleDescriptions[role]}.</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLinkUrl}" class="button">🔐 Aceitar Convite</a>
        <p class="expiry">Este link expira em 7 dias</p>
      </div>

      <div class="warning-box">
        <p>⚠️ <strong>Importante:</strong> Este é um link único e pessoal. Não compartilhe com ninguém.</p>
      </div>

      <p style="text-align: center; font-size: 13px; color: #71717a;">
        Se você não esperava este convite, pode ignorar este e-mail com segurança.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SKY BRASIL — Todos os direitos reservados.</p>
      <p>skystreamer.online</p>
    </div>
  </div>
</body>
</html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SKY BRASIL <noreply@skystreamer.online>",
        to: [email],
        subject: `SKY BRASIL - Convite para ${roleLabels[role]}`,
        html: htmlContent,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`Role invite sent: ${role} to ${email}`, result);

    return new Response(
      JSON.stringify({ success: true, id: result.id, token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending role invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
