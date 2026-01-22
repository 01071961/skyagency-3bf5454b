import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Lista de emails administrativos para receber notificações
const ADMIN_NOTIFICATION_EMAILS = [
  "elpenergia@gmail.com",
  "skyagencysc@gmail.com",
];

interface NotificationRequest {
  type: "confirmation" | "thanks" | "abandonment" | "transfer" | "internal";
  email?: string;
  name?: string;
  subject?: string;
  conversationId?: string;
  visitorId?: string;
  visitorName?: string;
  adminId?: string;
  rating?: number;
}

const BRAND_NAME = "SKY BRASIL";
const FROM_EMAIL = "noreply@skystreamer.online";

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a14; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #ff1493; }
    .content { background: linear-gradient(135deg, #12121e 0%, #1a1a2e 100%); border-radius: 16px; padding: 30px; border: 1px solid #333; }
    h1 { color: #ff1493; margin-top: 0; }
    p { line-height: 1.6; color: #cccccc; }
    .button { display: inline-block; background: linear-gradient(135deg, #ff1493, #9400d3); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    .highlight { color: #00bfff; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✦ ${BRAND_NAME}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${BRAND_NAME}. Todos os direitos reservados.</p>
      <p>Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
`;

const templates = {
  confirmation: (name: string, subject: string) => ({
    subject: `Recebemos sua mensagem - ${BRAND_NAME}`,
    html: baseTemplate(`
      <h1>Olá, ${name}! 👋</h1>
      <p>Obrigado por entrar em contato conosco sobre <span class="highlight">"${subject}"</span>.</p>
      <p>Nossa equipe está analisando sua solicitação e responderemos o mais breve possível.</p>
      <p>Enquanto isso, nossa assistente virtual está disponível 24 horas para ajudá-lo com dúvidas rápidas.</p>
      <p>Abraços,<br><strong>Equipe ${BRAND_NAME}</strong></p>
    `),
  }),

  thanks: (name: string, rating: number) => ({
    subject: `Obrigado pela avaliação! - ${BRAND_NAME}`,
    html: baseTemplate(`
      <h1>Obrigado, ${name}! ⭐</h1>
      <p>Sua avaliação de <span class="highlight">${rating} estrela${rating > 1 ? "s" : ""}</span> foi registrada com sucesso.</p>
      <p>Seu feedback é muito importante para continuarmos melhorando nosso atendimento.</p>
      <p>Esperamos vê-lo novamente em breve!</p>
      <p>Abraços,<br><strong>Equipe ${BRAND_NAME}</strong></p>
    `),
  }),

  abandonment: (name?: string) => ({
    subject: `Ainda está aí? - ${BRAND_NAME}`,
    html: baseTemplate(`
      <h1>Olá${name ? `, ${name}` : ""}! 👋</h1>
      <p>Notamos que você iniciou uma conversa conosco mas ficou ausente por um tempo.</p>
      <p>Se ainda precisar de ajuda, nossa equipe está pronta para atendê-lo!</p>
      <p>Basta acessar nosso site e iniciar uma nova conversa.</p>
      <a href="https://skystreamer.online" class="button">Voltar ao Chat</a>
      <p style="margin-top: 30px;">Abraços,<br><strong>Equipe ${BRAND_NAME}</strong></p>
    `),
  }),

  transfer: (visitorName: string) => ({
    subject: `[URGENTE] Nova conversa transferida - ${BRAND_NAME}`,
    html: baseTemplate(`
      <h1>Nova Transferência! 🔔</h1>
      <p>Uma conversa foi transferida para atendimento humano.</p>
      <p><strong>Visitante:</strong> <span class="highlight">${visitorName}</span></p>
      <p>Por favor, acesse o painel administrativo para atender esta conversa.</p>
      <a href="https://skystreamer.online/admin" class="button">Acessar Painel</a>
    `),
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();
    const { type, email, name, subject, conversationId, visitorId, visitorName, adminId, rating } = body;

    console.log(`Processing notification: ${type}`, body);

    const supabase = createClient(supabaseUrl, supabaseKey);

    let emailResult;

    switch (type) {
      case "confirmation": {
        if (!email || !name || !subject) {
          throw new Error("Missing required fields for confirmation");
        }
        const template = templates.confirmation(name, subject);
        emailResult = await resend.emails.send({
          from: `${BRAND_NAME} <${FROM_EMAIL}>`,
          to: [email],
          subject: template.subject,
          html: template.html,
        });
        break;
      }

      case "thanks": {
        if (!email || !name || !rating) {
          throw new Error("Missing required fields for thanks");
        }
        const template = templates.thanks(name, rating);
        emailResult = await resend.emails.send({
          from: `${BRAND_NAME} <${FROM_EMAIL}>`,
          to: [email],
          subject: template.subject,
          html: template.html,
        });
        break;
      }

      case "abandonment": {
        // Get conversation details
        if (conversationId) {
          const { data: conversation } = await supabase
            .from("chat_conversations")
            .select("*")
            .eq("id", conversationId)
            .single();

          if (conversation?.visitor_email) {
            const template = templates.abandonment(conversation.visitor_name);
            emailResult = await resend.emails.send({
              from: `${BRAND_NAME} <${FROM_EMAIL}>`,
              to: [conversation.visitor_email],
              subject: template.subject,
              html: template.html,
            });

            // Update conversation
            await supabase
              .from("chat_conversations")
              .update({ status: "abandoned" })
              .eq("id", conversationId);
          }
        }
        break;
      }

      case "transfer": {
        if (!conversationId || !visitorName) {
          throw new Error("Missing required fields for transfer");
        }

        // Enviar para todos os admins
        const template = templates.transfer(visitorName);
        for (const adminEmail of ADMIN_NOTIFICATION_EMAILS) {
          await resend.emails.send({
            from: `${BRAND_NAME} <${FROM_EMAIL}>`,
            to: [adminEmail],
            subject: template.subject,
            html: template.html,
          });
        }
        emailResult = { data: { id: "multi-admin" }, error: null };
        break;
      }

      case "internal": {
        // Internal notification for admins
        if (visitorName) {
          for (const adminEmail of ADMIN_NOTIFICATION_EMAILS) {
            await resend.emails.send({
              from: `${BRAND_NAME} <${FROM_EMAIL}>`,
              to: [adminEmail],
              subject: `Nova mensagem de ${visitorName} - ${BRAND_NAME}`,
              html: baseTemplate(`
                <h1>Nova Mensagem! 💬</h1>
                <p>Você recebeu uma nova mensagem de <span class="highlight">${visitorName}</span>.</p>
                <a href="https://skystreamer.online/admin" class="button">Ver no Painel</a>
              `),
            });
          }
          emailResult = { data: { id: "multi-admin" }, error: null };
        }
        break;
      }

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Log email
    if (emailResult && email) {
      await supabase.from("email_logs").insert({
        recipient_email: email,
        recipient_name: name,
        subject: `Chat notification: ${type}`,
        status: emailResult.error ? "failed" : "sent",
        error_message: emailResult.error?.message,
        sent_at: new Date().toISOString(),
      });
    }

    console.log(`Notification sent successfully: ${type}`, emailResult);

    return new Response(
      JSON.stringify({ success: true, result: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
