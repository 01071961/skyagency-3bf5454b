import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { email, name }: InviteRequest = await req.json();

    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    const signupUrl = "https://skystreamer.online/auth";
    const adminUrl = "https://skystreamer.online/admin";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding-bottom: 30px; border-bottom: 1px solid #1e1e1e; }
    .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .content { padding: 30px 0; }
    h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 15px; }
    .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background-color: #1e1e1e; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-box h3 { color: #ec4899; margin-top: 0; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #1e1e1e; color: #71717a; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SKY BRASIL</div>
    </div>
    <div class="content">
      <h1>Olá, ${name}!</h1>
      <p>Você foi convidado para ser <strong>Administrador</strong> do painel da SKY BRASIL.</p>
      
      <div class="info-box">
        <h3>🔐 Como acessar:</h3>
        <ol style="color: #a1a1aa; padding-left: 20px;">
          <li>Clique no botão abaixo para criar sua conta</li>
          <li>Use o e-mail <strong>${email}</strong> para o cadastro</li>
          <li>Após confirmar, acesse o painel administrativo</li>
        </ol>
      </div>

      <div style="text-align: center;">
        <a href="${signupUrl}" class="button">Criar Minha Conta</a>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <small>Após criar sua conta, acesse o painel em:<br>
        <a href="${adminUrl}" style="color: #ec4899;">${adminUrl}</a></small>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SKY BRASIL — Todos os direitos reservados.</p>
      <p>Este é um e-mail automático. Não responda.</p>
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
        subject: "SKY BRASIL - Seu Link de Acesso ao Painel Admin",
        html: htmlContent,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Admin invite sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending admin invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
