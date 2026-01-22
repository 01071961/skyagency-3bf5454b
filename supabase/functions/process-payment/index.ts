import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  payment_token: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone_number: string;
  };
  billing_address: {
    street: string;
    number: string;
    neighborhood: string;
    zipcode: string;
    city: string;
    complement?: string;
  };
  items: Array<{
    name: string;
    value: number;
    amount: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_token, customer, billing_address, items } = await req.json() as PaymentRequest;

    // Buscar credenciais do ambiente
    const clientId = Deno.env.get('EFI_CLIENT_ID');
    const clientSecret = Deno.env.get('EFI_CLIENT_SECRET');
    const environment = Deno.env.get('EFI_ENVIRONMENT') || 'sandbox';

    if (!clientId || !clientSecret) {
      throw new Error('Credenciais EfíPay não configuradas');
    }

    // URL base conforme ambiente
    const baseUrl = environment === 'production' 
      ? 'https://cobrancas.api.efipay.com.br'
      : 'https://cobrancas-h.api.efipay.com.br';

    console.log('Obtendo token OAuth...');
    
    // 1. Obter token OAuth
    const authString = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/v1/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Erro ao obter token:', error);
      throw new Error('Falha na autenticação com EfíPay');
    }

    const { access_token } = await tokenResponse.json();

    console.log('Criando cobrança...');

    // 2. Criar cobrança
    const total = items.reduce((sum, item) => sum + (item.value * item.amount), 0);
    
    const chargePayload = {
      items: items.map(item => ({
        name: item.name,
        value: Math.round(item.value * 100), // Valor em centavos
        amount: item.amount,
      })),
      metadata: {
        custom_id: `ORDER_${Date.now()}`,
      },
      payment: {
        credit_card: {
          payment_token,
          billing_address: {
            street: billing_address.street,
            number: billing_address.number,
            neighborhood: billing_address.neighborhood,
            zipcode: billing_address.zipcode.replace(/\D/g, ''),
            city: billing_address.city,
            complement: billing_address.complement || '',
          },
          customer: {
            name: customer.name,
            email: customer.email,
            cpf: customer.cpf.replace(/\D/g, ''),
            phone_number: customer.phone_number.replace(/\D/g, ''),
            birth: '1990-01-01', // Pode ser coletado no form se necessário
          },
        },
      },
    };

    const chargeResponse = await fetch(`${baseUrl}/v1/charge/one-step`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePayload),
    });

    if (!chargeResponse.ok) {
      const error = await chargeResponse.json();
      console.error('Erro ao criar cobrança:', error);
      throw new Error(error.error_description || 'Falha ao processar pagamento');
    }

    const chargeData = await chargeResponse.json();

    console.log('Pagamento processado com sucesso:', chargeData.data.charge_id);

    return new Response(
      JSON.stringify({
        success: true,
        charge_id: chargeData.data.charge_id,
        status: chargeData.data.status,
        total: total,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro no processamento:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Erro ao processar pagamento',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});