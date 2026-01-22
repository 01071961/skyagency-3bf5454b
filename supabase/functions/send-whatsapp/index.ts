import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessageRequest {
  to: string; // Phone number with country code (e.g., "5548996617935")
  message?: string;
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
  type?: 'text' | 'template' | 'image' | 'document';
  mediaUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Allow service-to-service calls (from admin-ai-assistant) or authenticated users
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      // If it's the anon key, allow the call (internal service call)
      if (token === anonKey) {
        userId = 'system';
        console.log('[send-whatsapp] Service-to-service call detected');
      } else {
        // Try to authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        }
      }
    }
    
    // For now, allow calls without strict authentication to enable automation
    if (!userId) {
      userId = 'anonymous';
      console.log('[send-whatsapp] Anonymous call - allowing for testing');
    }

    const META_SYSTEM_USER_TOKEN = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!META_SYSTEM_USER_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp configuration');
      return new Response(
        JSON.stringify({ error: 'Configuração do WhatsApp não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, message, template, type = 'text', mediaUrl }: WhatsAppMessageRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Número de telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove non-digits and ensure country code)
    let formattedPhone = to.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`Sending WhatsApp message to ${formattedPhone}...`);

    let messagePayload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
    };

    if (type === 'template' && template) {
      // Template message
      messagePayload.type = 'template';
      messagePayload.template = {
        name: template.name,
        language: { code: template.language || 'pt_BR' },
        components: template.components || [],
      };
    } else if (type === 'image' && mediaUrl) {
      // Image message
      messagePayload.type = 'image';
      messagePayload.image = {
        link: mediaUrl,
        caption: message || '',
      };
    } else if (type === 'document' && mediaUrl) {
      // Document message
      messagePayload.type = 'document';
      messagePayload.document = {
        link: mediaUrl,
        caption: message || '',
      };
    } else {
      // Text message
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Mensagem de texto é obrigatória' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      messagePayload.type = 'text';
      messagePayload.text = { body: message };
    }

    // Send message via WhatsApp Cloud API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_SYSTEM_USER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const whatsappData = await whatsappResponse.json();

    if (whatsappData.error) {
      console.error('WhatsApp API error:', whatsappData.error);
      return new Response(
        JSON.stringify({ 
          error: whatsappData.error.message || 'Erro ao enviar mensagem',
          details: whatsappData.error 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully:', whatsappData);

    // Log the message in database
    await supabase.from('admin_audit_log').insert({
      admin_id: userId === 'system' || userId === 'anonymous' ? null : userId,
      action: 'whatsapp_message_sent',
      target_table: 'whatsapp',
      details: {
        to: formattedPhone,
        type,
        message_id: whatsappData.messages?.[0]?.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message_id: whatsappData.messages?.[0]?.id,
        contacts: whatsappData.contacts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
