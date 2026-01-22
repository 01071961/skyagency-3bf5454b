import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Sanitização de texto
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

// Schema de validação
const orderConfirmationSchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeText),
  email: z.string().email().max(255),
  orderId: z.string().min(1).max(50),
  total: z.number().positive(),
  items: z.array(z.object({
    name: z.string().transform(sanitizeText),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validationResult = orderConfirmationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: `Dados inválidos: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, orderId, total, items } = validationResult.data;
    const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // b) Confirmação de Compra / Checkout Concluído - Template aprovado pelo cliente
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
        <div style="background: linear-gradient(90deg, #00d4ff, #7928ca); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SKY BRASIL</h1>
        </div>
        <div style="padding: 40px; color: #333333;">
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Olá ${name},
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Seu pagamento foi aprovado e o pedido <strong>#${orderId}</strong> foi recebido em ${dataHora}.
          </p>
          
          <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Resumo do Pedido</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qtd</th>
                  <th style="padding: 10px; text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px 10px; font-weight: bold; text-align: right;">Total:</td>
                  <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #7928ca;">R$ ${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Em breve você receberá atualizações sobre preparação e entrega.
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Qualquer dúvida, é só responder este e-mail.
          </p>
          <p style="font-size: 16px; line-height: 1.8; margin-top: 30px;">
            Obrigado pela confiança!<br>
            <strong>Equipe SKY BRASIL</strong>
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} SKY BRASIL. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "SKY BRASIL <noreply@skystreamer.online>",
      to: [email],
      subject: `Pedido #${orderId} confirmado com sucesso!`,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
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
