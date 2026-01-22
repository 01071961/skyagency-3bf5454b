// CORS Headers for Edge Functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const ALLOWED_ORIGINS = [
  'https://skybrasil.com.br',
  'https://www.skybrasil.com.br',
  'https://skystreamer.online',
  'https://www.skystreamer.online',
  'http://localhost:8080',
  'http://localhost:3000',
  /\.lovableproject\.com$/,
  /\.lovable\.app$/,
];

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    return allowed.test(origin);
  });
}

export function handleCorsPreFlight(): Response {
  return new Response(null, { headers: corsHeaders });
}

export function createCorsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
