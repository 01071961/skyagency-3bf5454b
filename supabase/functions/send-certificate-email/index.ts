import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateEmailRequest {
  certificate_id: string;
  recipient_email: string;
  recipient_name: string;
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
    
    const { certificate_id, recipient_email, recipient_name } = await req.json() as CertificateEmailRequest;

    if (!certificate_id || !recipient_email) {
      return new Response(
        JSON.stringify({ error: 'certificate_id and recipient_email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch certificate details
    const { data: certificate, error: certError } = await supabase
      .from('course_certificates')
      .select('*')
      .eq('id', certificate_id)
      .single();

    if (certError || !certificate) {
      return new Response(
        JSON.stringify({ error: 'Certificate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch company settings
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const companyName = companySettings?.company_name || 'SKY Brasil Academy';
    const companyLogo = companySettings?.logo_url;
    const companyEmail = companySettings?.email || 'contato@skybrasil.com';
    const companyWebsite = companySettings?.website || 'skybrasil.com.br';
    const primaryColor = companySettings?.primary_color || '#1e3a5f';

    const verificationUrl = `https://${companyWebsite}/verificar-certificado/${certificate.validation_code}`;
    const issueDate = new Date(certificate.issued_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Conclusão</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); padding: 40px 30px; text-align: center;">
        ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="height: 50px; margin-bottom: 20px;">` : ''}
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎓 Parabéns!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Seu certificado foi emitido com sucesso!</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
          Olá <strong>${recipient_name || certificate.student_name}</strong>,
        </p>
        
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
          Temos o prazer de informar que seu certificado de conclusão do curso 
          <strong style="color: ${primaryColor};">"${certificate.course_name}"</strong> foi gerado com sucesso!
        </p>

        <!-- Certificate Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Certificado Nº</span><br>
                    <strong style="color: ${primaryColor}; font-size: 16px; font-family: monospace;">${certificate.certificate_number}</strong>
                  </td>
                  <td style="padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                    <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Emitido em</span><br>
                    <strong style="color: #333; font-size: 14px;">${issueDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 15px;">
                    <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Código de Verificação</span><br>
                    <strong style="color: ${primaryColor}; font-size: 20px; font-family: monospace; letter-spacing: 2px;">${certificate.validation_code}</strong>
                  </td>
                </tr>
                ${certificate.course_hours > 0 ? `
                <tr>
                  <td colspan="2" style="padding-top: 15px;">
                    <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Carga Horária</span><br>
                    <strong style="color: #333; font-size: 14px;">${certificate.course_hours} horas</strong>
                  </td>
                </tr>
                ` : ''}
                ${certificate.final_score ? `
                <tr>
                  <td colspan="2" style="padding-top: 15px;">
                    <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Aproveitamento</span><br>
                    <strong style="color: #22c55e; font-size: 18px;">${certificate.final_score}%</strong>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding: 10px 0 25px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: ${primaryColor}; color: white; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                🔗 Verificar Certificado Online
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
          Este certificado pode ser verificado a qualquer momento através do código acima ou pelo link de verificação.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #888; font-size: 13px; margin: 0 0 10px 0;">
          ${companyName}
        </p>
        <p style="color: #aaa; font-size: 12px; margin: 0;">
          ${companyWebsite} | ${companyEmail}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend if API key is available
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${companyName} <noreply@${companyWebsite.replace('https://', '').replace('http://', '').split('/')[0]}>`,
          to: [recipient_email],
          subject: `🎓 Seu Certificado: ${certificate.course_name}`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Resend error:', errorText);
        // Log the attempt but don't fail
      }

      // Log email
      await supabase.from('email_logs').insert({
        recipient_email,
        recipient_name: recipient_name || certificate.student_name,
        subject: `🎓 Seu Certificado: ${certificate.course_name}`,
        status: emailResponse.ok ? 'sent' : 'failed',
        sent_at: emailResponse.ok ? new Date().toISOString() : null,
        error_message: emailResponse.ok ? null : 'Failed to send via Resend',
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Certificate notification processed',
        certificate_number: certificate.certificate_number,
        validation_code: certificate.validation_code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending certificate email:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
