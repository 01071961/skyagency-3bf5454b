import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  platform: string;
  status: 'success' | 'error';
  message: string;
  data?: unknown;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[test-social-integrations] Starting tests...');

  const results: TestResult[] = [];

  // Test Facebook
  try {
    const fbToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    if (!fbToken) {
      results.push({
        platform: 'Facebook',
        status: 'error',
        message: 'FACEBOOK_ACCESS_TOKEN não configurado'
      });
    } else {
      console.log('[Facebook] Testing API...');
      const fbResponse = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${fbToken}`
      );
      const fbData = await fbResponse.json();
      
      if (fbData.error) {
        results.push({
          platform: 'Facebook',
          status: 'error',
          message: fbData.error.message,
          data: fbData.error
        });
      } else {
        results.push({
          platform: 'Facebook',
          status: 'success',
          message: `Conectado como: ${fbData.name}`,
          data: { id: fbData.id, name: fbData.name }
        });
      }
      console.log('[Facebook] Result:', fbData);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Facebook] Error:', error);
    results.push({
      platform: 'Facebook',
      status: 'error',
      message: error.message || 'Erro desconhecido'
    });
  }

  // Test Instagram
  try {
    const igToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!igToken) {
      results.push({
        platform: 'Instagram',
        status: 'error',
        message: 'INSTAGRAM_ACCESS_TOKEN não configurado'
      });
    } else {
      console.log('[Instagram] Testing API...');
      // Try Instagram Graph API for Business accounts
      const igResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${igToken}`
      );
      const igData = await igResponse.json();
      
      if (igData.error) {
        // Try basic Instagram API
        const igBasicResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${igToken}`
        );
        const igBasicData = await igBasicResponse.json();
        
        if (igBasicData.error) {
          results.push({
            platform: 'Instagram',
            status: 'error',
            message: igBasicData.error.message,
            data: igBasicData.error
          });
        } else {
          results.push({
            platform: 'Instagram',
            status: 'success',
            message: `Conectado como: ${igBasicData.username || igBasicData.id}`,
            data: igBasicData
          });
        }
      } else {
        const igAccount = igData.data?.[0]?.instagram_business_account;
        if (igAccount) {
          results.push({
            platform: 'Instagram',
            status: 'success',
            message: `Conectado: ${igAccount.username || igAccount.id}`,
            data: igAccount
          });
        } else {
          results.push({
            platform: 'Instagram',
            status: 'error',
            message: 'Nenhuma conta Instagram Business encontrada vinculada às páginas',
            data: igData
          });
        }
      }
      console.log('[Instagram] Result:', igData);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Instagram] Error:', error);
    results.push({
      platform: 'Instagram',
      status: 'error',
      message: error.message || 'Erro desconhecido'
    });
  }

  // Test WhatsApp Business
  try {
    const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!waToken || !waPhoneId) {
      results.push({
        platform: 'WhatsApp',
        status: 'error',
        message: 'WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurado'
      });
    } else {
      console.log('[WhatsApp] Testing API with Phone ID:', waPhoneId);
      const waResponse = await fetch(
        `https://graph.facebook.com/v19.0/${waPhoneId}?access_token=${waToken}`
      );
      const waData = await waResponse.json();
      
      if (waData.error) {
        results.push({
          platform: 'WhatsApp',
          status: 'error',
          message: waData.error.message,
          data: waData.error
        });
      } else {
        results.push({
          platform: 'WhatsApp',
          status: 'success',
          message: `Conectado: ${waData.display_phone_number || waData.verified_name || waPhoneId}`,
          data: {
            phone_number_id: waPhoneId,
            display_phone_number: waData.display_phone_number,
            verified_name: waData.verified_name,
            quality_rating: waData.quality_rating
          }
        });
      }
      console.log('[WhatsApp] Result:', waData);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[WhatsApp] Error:', error);
    results.push({
      platform: 'WhatsApp',
      status: 'error',
      message: error.message || 'Erro desconhecido'
    });
  }

  const allSuccess = results.every(r => r.status === 'success');
  const summary = {
    success: allSuccess,
    tested_at: new Date().toISOString(),
    results
  };

  console.log('[test-social-integrations] Complete:', JSON.stringify(summary, null, 2));

  return new Response(JSON.stringify(summary, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
});
