import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET request é usado pela Efí para verificar o webhook
  if (req.method === 'GET') {
    return new Response('OK', { status: 200, headers: corsHeaders });
  }

  // POST requests require authentication
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const PIX_WEBHOOK_SECRET = Deno.env.get('PIX_WEBHOOK_SECRET');
    
    if (!PIX_WEBHOOK_SECRET) {
      console.error('[PIX Webhook] PIX_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for Authorization header (Bearer token)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const signature = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret');
    
    let authenticated = false;

    // Method 1: Bearer token in Authorization header
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token === PIX_WEBHOOK_SECRET) {
        authenticated = true;
        console.log('[PIX Webhook] Authenticated via Bearer token');
      }
    }

    // Method 2: Custom header with secret
    if (!authenticated && signature === PIX_WEBHOOK_SECRET) {
      authenticated = true;
      console.log('[PIX Webhook] Authenticated via X-Webhook-Secret header');
    }

    // Method 3: Query parameter (fallback for Efí configuration)
    if (!authenticated) {
      const url = new URL(req.url);
      const querySecret = url.searchParams.get('secret');
      if (querySecret === PIX_WEBHOOK_SECRET) {
        authenticated = true;
        console.log('[PIX Webhook] Authenticated via query parameter');
      }
    }

    if (!authenticated) {
      console.error('[PIX Webhook] Unauthorized request - no valid authentication');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === AUTHENTICATED - PROCESS WEBHOOK ===
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('[PIX Webhook] Payload recebido:', JSON.stringify(payload));

    // Efí envia array de PIX
    const pixArray = payload.pix || [];

    for (const pix of pixArray) {
      const { txid, e2eId, valor, horario, pagador } = pix;
      
      if (!txid) {
        console.warn('[PIX Webhook] PIX sem txid, ignorando');
        continue;
      }

      console.log(`[PIX Webhook] Processando txid: ${txid}, valor: ${valor}`);

      // 1. Buscar transação PIX
      const { data: pixTx, error: pixError } = await supabase
        .from('pix_transactions')
        .select('*, orders(*)')
        .eq('txid', txid)
        .single();

      if (pixError || !pixTx) {
        console.error('[PIX Webhook] Transação não encontrada:', txid);
        continue;
      }

      if (pixTx.status === 'paid') {
        console.log('[PIX Webhook] Transação já processada:', txid);
        continue;
      }

      // 2. Atualizar transação PIX
      await supabase
        .from('pix_transactions')
        .update({
          status: 'paid',
          e2e_id: e2eId,
          paid_at: horario || new Date().toISOString(),
          webhook_data: pix,
        })
        .eq('txid', txid);

      console.log('[PIX Webhook] Transação PIX atualizada:', txid);

      // 3. Se tiver pedido vinculado, atualizar
      if (pixTx.order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            paid_at: horario || new Date().toISOString(),
            payment_id: e2eId,
          })
          .eq('id', pixTx.order_id);

        if (orderError) {
          console.error('[PIX Webhook] Erro ao atualizar pedido:', orderError);
        } else {
          console.log('[PIX Webhook] Pedido atualizado:', pixTx.order_id);
        }

        // O trigger award_points_on_order_paid irá cuidar dos pontos e comissões
      }

      // 4. Se for resgate de recompensa, processar
      if (pixTx.redemption_id) {
        await supabase
          .from('reward_redemptions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', pixTx.redemption_id);

        console.log('[PIX Webhook] Resgate completado:', pixTx.redemption_id);
      }

      // 5. Se for pagamento de comissão, processar
      if (pixTx.commission_id) {
        await supabase
          .from('affiliate_commissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            paid_via: 'pix',
            pix_transaction_id: pixTx.id,
          })
          .eq('id', pixTx.commission_id);

        // Atualizar saldo do afiliado
        const { data: commission } = await supabase
          .from('affiliate_commissions')
          .select('affiliate_id, commission_amount')
          .eq('id', pixTx.commission_id)
          .single();

        if (commission) {
          await supabase
            .from('vip_affiliates')
            .update({
              available_balance: supabase.rpc('decrement', { x: commission.commission_amount }),
              withdrawn_balance: supabase.rpc('increment', { x: commission.commission_amount }),
            })
            .eq('id', commission.affiliate_id);
        }

        console.log('[PIX Webhook] Comissão paga:', pixTx.commission_id);
      }

      // 6. Se for taxa de ativação de afiliado (tipo = affiliate_activation)
      if (pixTx.tipo === 'affiliate_activation' && pixTx.affiliate_id) {
        console.log('[PIX Webhook] Processando ativação de afiliado:', pixTx.affiliate_id);
        
        // Aprovar o afiliado diretamente pelo affiliate_id
        const { error: updateError } = await supabase
          .from('vip_affiliates')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .eq('id', pixTx.affiliate_id);

        if (updateError) {
          console.error('[PIX Webhook] Erro ao aprovar afiliado:', updateError);
        } else {
          console.log('[PIX Webhook] Afiliado aprovado automaticamente:', pixTx.affiliate_id);
        }
      }

      // 7. Se for saque (withdrawal)
      if (pixTx.withdrawal_id) {
        await supabase
          .from('withdrawals')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', pixTx.withdrawal_id);

        console.log('[PIX Webhook] Saque processado:', pixTx.withdrawal_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: pixArray.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PIX Webhook] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
