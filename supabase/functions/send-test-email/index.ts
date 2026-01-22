import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  recipientEmail: string;
  provider: "resend" | "brevo";
}

// Verify admin authentication
async function verifyAdminAuth(req: Request): Promise<{ success: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return { success: false, error: "Authorization header required" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[Auth] Invalid token:", authError);
      return { success: false, error: "Invalid authentication token" };
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roles) {
      console.error("[Auth] User is not admin:", user.id);
      return { success: false, error: "Admin access required" };
    }

    return { success: true, userId: user.id };
  } catch (err: any) {
    console.error("[Auth] Exception:", err);
    return { success: false, error: "Authentication failed" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      console.error("[send-test-email] Auth failed:", authResult.error);
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-test-email] Authorized admin: ${authResult.userId}`);

    const { recipientEmail, provider }: TestEmailRequest = await req.json();

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "recipientEmail é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-test-email] Testing ${provider} to ${recipientEmail}`);

    let result;
    
    if (provider === "brevo") {
      result = await sendWithBrevo(recipientEmail);
    } else {
      result = await sendWithResend(recipientEmail);
    }

    console.log(`[send-test-email] Result:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("[send-test-email] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function sendWithResend(to: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY não configurada" };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: "SKY BRASIL <noreply@skystreamer.online>",
      to: [to],
      subject: "🧪 Teste de E-mail - SKY BRASIL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #00d4ff; margin: 0;">✅ Teste Bem-Sucedido!</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Este é um e-mail de teste enviado pelo sistema <strong>SKY BRASIL</strong>.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              <strong>Provedor:</strong> Resend<br>
              <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                ✓ Configuração de e-mail funcionando corretamente
              </p>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} SKY BRASIL - Todos os direitos reservados</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Error:", error);
      return { success: false, error: error.message, provider: "resend" };
    }

    return { 
      success: true, 
      message: "E-mail enviado com sucesso via Resend!", 
      id: data?.id,
      provider: "resend"
    };
  } catch (e) {
    console.error("[Resend] Exception:", e);
    return { success: false, error: e instanceof Error ? e.message : "Erro ao enviar", provider: "resend" };
  }
}

async function sendWithBrevo(to: string) {
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  
  if (!BREVO_API_KEY) {
    return { success: false, error: "BREVO_API_KEY não configurada" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: "noreply@skystreamer.online", name: "SKY BRASIL" },
        to: [{ email: to }],
        subject: "🧪 Teste de E-mail - SKY BRASIL",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: #00d4ff; margin: 0;">✅ Teste Bem-Sucedido!</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Este é um e-mail de teste enviado pelo sistema <strong>SKY BRASIL</strong>.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                <strong>Provedor:</strong> Brevo<br>
                <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                  ✓ Configuração de e-mail funcionando corretamente
                </p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} SKY BRASIL - Todos os direitos reservados</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Brevo] Error:", errorText);
      return { success: false, error: `Brevo error: ${errorText}`, provider: "brevo" };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: "E-mail enviado com sucesso via Brevo!", 
      id: data.messageId,
      provider: "brevo"
    };
  } catch (e) {
    console.error("[Brevo] Exception:", e);
    return { success: false, error: e instanceof Error ? e.message : "Erro ao enviar", provider: "brevo" };
  }
}

serve(handler);
