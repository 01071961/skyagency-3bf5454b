import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validação
const pixPaymentSchema = z.object({
  order_id: z.string().uuid().optional(),
  affiliate_id: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  valor: z.number().positive().optional(),
  description: z.string().optional(),
  descricao: z.string().optional(),
  type: z.enum(['order', 'affiliate_activation', 'commission', 'redemption', 'cobranca']).optional().default('cobranca'),
  devedor: z.object({
    nome: z.string().min(2).max(100),
    cpf: z.string().length(11),
  }).optional(),
  expiracao: z.number().int().positive().default(3600),
  split_config_id: z.string().optional(),
});

// Gerar txid único
function generateTxid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 35; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para chamar o proxy PIX (Vercel API Route)
async function callPixProxy(action: string, payload: any): Promise<any> {
  const proxyUrl = Deno.env.get('PIX_PROXY_URL');
  const proxySecret = Deno.env.get('PIX_PROXY_SECRET');

  if (!proxyUrl || !proxySecret) {
    throw new Error('PIX_PROXY_URL e PIX_PROXY_SECRET são obrigatórios. Configure nas secrets do projeto.');
  }

  console.log(`[PIX] Chamando proxy: ${action}`);
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Proxy-Secret': proxySecret,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.mensagem || `Erro no proxy PIX: ${response.status}`);
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar entrada
    const rawBody = await req.json();
    const validationResult = pixPaymentSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ success: false, error: `Dados inválidos: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, affiliate_id, amount, valor: valorParam, description, descricao, type, devedor, expiracao, split_config_id } = validationResult.data;

    // Determinar valor (suporta 'amount' ou 'valor')
    const valor = amount || valorParam;
    if (!valor) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Descrição do pagamento
    const desc = description || descricao || 'Pagamento PIX';

    // Buscar chave PIX das secrets
    const pixKey = Deno.env.get('EFI_PIX_KEY');
    if (!pixKey) {
      throw new Error('Chave PIX não configurada (EFI_PIX_KEY)');
    }

    // 1. Autenticar via proxy
    console.log('[PIX] Autenticando via proxy...');
    const tokenData = await callPixProxy('auth', {});
    const access_token = tokenData.access_token;
    console.log('[PIX] Autenticado com sucesso');

    // 2. Criar cobrança PIX via proxy
    const txid = generateTxid();
    const expiresAt = new Date(Date.now() + expiracao * 1000);

    const infoAdicionais: Array<{nome: string, valor: string}> = [];
    if (order_id) {
      infoAdicionais.push({ nome: 'Pedido', valor: order_id.substring(0, 8) });
    }
    if (affiliate_id) {
      infoAdicionais.push({ nome: 'Afiliado', valor: affiliate_id.substring(0, 8) });
    }
    if (type === 'affiliate_activation') {
      infoAdicionais.push({ nome: 'Tipo', valor: 'Taxa Ativacao' });
    }

    const cobPayload: any = {
      calendario: {
        expiracao: expiracao,
      },
      valor: {
        original: valor.toFixed(2),
      },
      chave: pixKey,
      infoAdicionais,
    };

    if (devedor) {
      cobPayload.devedor = {
        cpf: devedor.cpf,
        nome: devedor.nome,
      };
    }

    if (desc) {
      cobPayload.solicitacaoPagador = desc.substring(0, 140);
    }

    console.log('[PIX] Criando cobrança:', txid);
    const cobData = await callPixProxy('create_cob', {
      access_token,
      txid,
      cobPayload,
    });
    console.log('[PIX] Cobrança criada:', cobData.txid);

    // 3. Obter QR Code via proxy
    const locId = cobData.loc?.id;
    let qrCode = '';
    let qrCodeBase64 = '';

    if (locId) {
      console.log('[PIX] Buscando QR Code...');
      const qrData = await callPixProxy('get_qrcode', {
        access_token,
        locId,
      });
      qrCode = qrData.qrcode || '';
      qrCodeBase64 = qrData.imagemQrcode || '';
      console.log('[PIX] QR Code obtido');
    }

    // 4. Se tiver split config, vincular via proxy
    if (split_config_id) {
      console.log('[PIX] Vinculando split config:', split_config_id);
      try {
        await callPixProxy('link_split', {
          access_token,
          txid,
          splitConfigId: split_config_id,
        });
        console.log('[PIX] Split vinculado');
      } catch (splitError) {
        console.warn('[PIX] Erro ao vincular split:', splitError);
      }
    }

    // 5. Salvar transação no banco
    const { data: pixTransaction, error: dbError } = await supabase
      .from('pix_transactions')
      .insert({
        order_id: order_id || null,
        affiliate_id: affiliate_id || null,
        txid,
        loc_id: locId?.toString(),
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        valor,
        tipo: type || 'cobranca',
        status: 'pending',
        split_config_id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('[PIX] Erro ao salvar transação:', dbError);
    }

    // 6. Atualizar pedido com URL PIX (se for pagamento de pedido)
    if (order_id) {
      await supabase
        .from('orders')
        .update({
          payment_method: 'pix',
          payment_url: qrCode,
          metadata: {
            pix_txid: txid,
            pix_expires_at: expiresAt.toISOString(),
          },
        })
        .eq('id', order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        txid,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        expires_at: expiresAt.toISOString(),
        valor: valor.toFixed(2),
        pix_transaction_id: pixTransaction?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PIX] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Erro ao criar cobrança PIX',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
