import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Lista de emails administrativos para receber notificações
const ADMIN_NOTIFICATION_EMAILS = [
  "elpenergia@gmail.com",
  "skyagencysc@gmail.com",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Sanitização de texto para prevenir XSS/injection
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Regex para email RFC 5322 simplificado
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Schema de validação com Zod
const contactRequestSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(sanitizeText),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .regex(emailRegex, 'Formato de email inválido'),
  userType: z.string()
    .max(50, 'Tipo deve ter no máximo 50 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  message: z.string()
    .min(1, 'Mensagem obrigatória')
    .max(2000, 'Mensagem deve ter no máximo 2000 caracteres')
    .transform(sanitizeText),
  source: z.enum(['contact', 'vip']),
  channel: z.string()
    .max(100, 'Canal deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  platform: z.string()
    .max(50, 'Plataforma deve ter no máximo 50 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
  followers: z.string()
    .max(20, 'Seguidores deve ter no máximo 20 caracteres')
    .optional()
    .transform(val => val ? sanitizeText(val) : val),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (!checkRateLimit(clientIP)) {
      console.log(`[submit-contact] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.json();
    
    // Honeypot check - if these hidden fields are filled, it's a bot
    if (rawBody.website || rawBody.url || rawBody.company_website) {
      console.log(`[submit-contact] Honeypot triggered for IP: ${clientIP}`);
      // Return success to fool bots but don't actually process
      return new Response(
        JSON.stringify({ success: true, message: "Mensagem enviada com sucesso!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validação com Zod
    const validationResult = contactRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: `Dados inválidos: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, userType, message, source, channel, platform, followers } = validationResult.data;

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Salvar no banco de dados
    const submissionData = {
      name,
      email,
      user_type: userType || (channel ? `${platform} - ${followers || 'N/A'} seguidores` : null),
      message: source === "vip" 
        ? `Canal: ${channel}\nPlataforma: ${platform}\nSeguidores: ${followers || 'N/A'}\n\n${message}`
        : message,
      source,
    };

    const { data: submission, error: dbError } = await supabase
      .from("contact_submissions")
      .insert(submissionData)
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Erro ao salvar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Templates de email aprovados pelo cliente
    const getEmailContent = () => {
      if (source === "vip") {
        // c) Confirmação de Inscrição VIP
        return {
          subject: "Inscrição confirmada!",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
              <div style="background: linear-gradient(90deg, #ff0080, #7928ca); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">SKY BRASIL</h1>
              </div>
              <div style="padding: 40px; color: #333333;">
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Olá ${name},
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Sua inscrição foi realizada com sucesso! Você já está na nossa lista exclusiva.
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Fique de olho no seu e-mail para receber conteúdos e convites especiais.
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-top: 30px;">
                  Abraços,<br>
                  <strong>Equipe SKY BRASIL</strong>
                </p>
              </div>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} SKY BRASIL. Todos os direitos reservados.</p>
              </div>
            </div>
          `
        };
      } else {
        // a) Formulário de Contato / Orçamento / Fale Conosco
        return {
          subject: "Recebemos sua mensagem!",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
              <div style="background: linear-gradient(90deg, #00d4ff, #7928ca); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">SKY BRASIL</h1>
              </div>
              <div style="padding: 40px; color: #333333;">
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Olá ${name},
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Obrigado pelo contato!
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Recebemos sua solicitação e entraremos em contato em até 7 dias úteis.
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                  Caso precise de atendimento imediato, responda este e-mail ou ligue para nosso time.
                </p>
                <p style="font-size: 16px; line-height: 1.8; margin-top: 30px;">
                  Atenciosamente,<br>
                  <strong>Equipe SKY BRASIL</strong>
                </p>
              </div>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} SKY BRASIL. Todos os direitos reservados.</p>
              </div>
            </div>
          `
        };
      }
    };

    const emailContent = getEmailContent();

    // Email para o usuário
    try {
      await resend.emails.send({
        from: "SKY BRASIL <noreply@skystreamer.online>",
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      // Não falha o request se o email não for enviado
    }

    // Email para os admins (múltiplos destinatários)
    try {
      const adminEmailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nova ${source === 'vip' ? 'Inscrição VIP' : 'Mensagem de Contato'}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Nome:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
            ${source === 'vip' ? `
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Canal:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${channel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Plataforma:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${platform}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Seguidores:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${followers || 'N/A'}</td></tr>
            ` : `
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tipo:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userType || 'N/A'}</td></tr>
            `}
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Data:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleString('pt-BR')}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <strong>Mensagem:</strong>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            ID: ${submission.id}
          </p>
        </div>
      `;

      // Enviar para todos os admins
      for (const adminEmail of ADMIN_NOTIFICATION_EMAILS) {
        await resend.emails.send({
          from: "SKY BRASIL Forms <noreply@skystreamer.online>",
          to: [adminEmail],
          subject: `[SKY BRASIL] Nova ${source === 'vip' ? 'Inscrição VIP' : 'Mensagem'}: ${name}`,
          html: adminEmailContent,
        });
      }
    } catch (emailError) {
      console.error("Erro ao enviar email para admins:", emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem enviada com sucesso!",
        id: submission.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
