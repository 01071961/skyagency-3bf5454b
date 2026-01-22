import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-origin',
};

// Rate limiting simples em memória (por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requisições
const RATE_WINDOW = 60 * 1000; // por minuto

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
    .trim();
}

// Validação de CPF com dígitos verificadores
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Schema de validação com Zod
const paymentRequestSchema = z.object({
  payment_token: z.string().min(1, 'Token de pagamento obrigatório'),
  customer: z.object({
    name: z.string().min(2).max(100).transform(sanitizeText),
    email: z.string().email().max(255),
    cpf: z.string().refine(val => isValidCPF(val.replace(/\D/g, '')), 'CPF inválido'),
    phone_number: z.string().min(10).max(15).transform(val => val.replace(/\D/g, '')),
  }),
  billing_address: z.object({
    street: z.string().min(2).max(200).transform(sanitizeText),
    number: z.string().min(1).max(20).transform(sanitizeText),
    neighborhood: z.string().min(2).max(100).transform(sanitizeText),
    zipcode: z.string().transform(val => val.replace(/\D/g, '')).refine(val => val.length === 8, 'CEP inválido'),
    city: z.string().min(2).max(100).transform(sanitizeText),
    complement: z.string().max(100).optional().transform(val => val ? sanitizeText(val) : ''),
  }),
  items: z.array(z.object({
    name: z.string().min(1).max(200).transform(sanitizeText),
    value: z.number().positive(),
    amount: z.number().int().positive(),
  })).min(1, 'Pelo menos um item é obrigatório'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificação de origem
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const allowedOrigins = [
      'https://skybrasil.com.br',
      'https://www.skybrasil.com.br',
      'http://localhost:',
      '.lovableproject.com',
      '.lovable.app'
    ];
    
    const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed));
    if (!isAllowedOrigin && origin !== '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Origem não autorizada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Muitas requisições. Tente novamente em 1 minuto.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar e sanitizar entrada
    const rawBody = await req.json();
    const validationResult = paymentRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ success: false, error: `Dados inválidos: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { payment_token, customer, billing_address, items } = validationResult.data;

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
      throw new Error('Falha na autenticação com EfíPay');
    }

    const { access_token } = await tokenResponse.json();

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
            zipcode: billing_address.zipcode,
            city: billing_address.city,
            complement: billing_address.complement || '',
          },
          customer: {
            name: customer.name,
            email: customer.email,
            cpf: customer.cpf.replace(/\D/g, ''),
            phone_number: customer.phone_number,
            birth: '1990-01-01',
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
      throw new Error(error.error_description || 'Falha ao processar pagamento');
    }

    const chargeData = await chargeResponse.json();

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
