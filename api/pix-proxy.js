// Vercel Serverless Function - PIX mTLS Proxy
// Security hardened with rate limiting, CORS restrictions, and error sanitization

import https from 'https';
import crypto from 'crypto';

// Rate limiting configuration (in-memory for serverless - resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per IP

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://skystreamer.online',
  'https://www.skystreamer.online',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Error message mapping (sanitize internal errors)
const ERROR_MESSAGES = {
  'credentials_missing': 'Erro de configuração do sistema',
  'invalid_certificate': 'Erro de configuração do sistema',
  'rate_limited': 'Muitas requisições. Tente novamente em alguns segundos',
  'unauthorized': 'Não autorizado',
  'invalid_action': 'Ação inválida',
  'internal_error': 'Erro ao processar solicitação',
  'method_not_allowed': 'Método não permitido',
};

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

function isRateLimited(clientIp) {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp);
  
  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(clientIp, { windowStart: now, count: 1 });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  clientData.count++;
  return false;
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovableproject.com')
  );
}

function getCorsHeaders(origin) {
  const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Proxy-Secret',
    'Access-Control-Max-Age': '86400',
  };
}

function generateRequestId() {
  return crypto.randomBytes(8).toString('hex');
}

function logRequest(requestId, action, clientIp, success, errorType = null) {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId,
    action,
    clientIp: clientIp.substring(0, 10) + '***', // Partial IP for privacy
    success,
    errorType,
  };
  console.log('[PIX Proxy]', JSON.stringify(logData));
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  const clientIp = getClientIp(req);
  const requestId = generateRequestId();

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    logRequest(requestId, 'unknown', clientIp, false, 'method_not_allowed');
    return res.status(405).json({ 
      error: ERROR_MESSAGES.method_not_allowed,
      requestId 
    });
  }

  // Rate limiting check
  if (isRateLimited(clientIp)) {
    logRequest(requestId, req.body?.action || 'unknown', clientIp, false, 'rate_limited');
    return res.status(429).json({ 
      error: ERROR_MESSAGES.rate_limited,
      requestId 
    });
  }

  // Origin validation (skip for Lovable preview domains)
  if (origin && !isOriginAllowed(origin)) {
    logRequest(requestId, req.body?.action || 'unknown', clientIp, false, 'invalid_origin');
    return res.status(403).json({ 
      error: ERROR_MESSAGES.unauthorized,
      requestId 
    });
  }

  // Verify proxy secret
  const proxySecret = req.headers['x-proxy-secret'];
  if (proxySecret !== process.env.PIX_PROXY_SECRET) {
    logRequest(requestId, req.body?.action || 'unknown', clientIp, false, 'unauthorized');
    return res.status(401).json({ 
      error: ERROR_MESSAGES.unauthorized,
      requestId 
    });
  }

  try {
    const { action, ...payload } = req.body;
    
    const clientId = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const environment = process.env.EFI_ENVIRONMENT || 'sandbox';
    const pixKey = process.env.EFI_PIX_KEY;
    const certificateBase64 = process.env.EFI_CERTIFICATE_PEM;

    if (!clientId || !clientSecret || !certificateBase64 || !pixKey) {
      logRequest(requestId, action, clientIp, false, 'credentials_missing');
      return res.status(500).json({ 
        error: ERROR_MESSAGES.credentials_missing,
        requestId 
      });
    }

    // Decode PEM certificate from base64
    let pemContent;
    try {
      pemContent = Buffer.from(certificateBase64, 'base64').toString('utf-8');
    } catch {
      logRequest(requestId, action, clientIp, false, 'invalid_certificate');
      return res.status(500).json({ 
        error: ERROR_MESSAGES.invalid_certificate,
        requestId 
      });
    }
    
    // Extract cert and key from combined PEM
    const certMatch = pemContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
    const keyMatch = pemContent.match(/-----BEGIN (RSA |EC |)PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |)PRIVATE KEY-----/);
    
    if (!certMatch || !keyMatch) {
      logRequest(requestId, action, clientIp, false, 'invalid_certificate');
      return res.status(500).json({ 
        error: ERROR_MESSAGES.invalid_certificate,
        requestId 
      });
    }

    const cert = certMatch[0];
    const key = keyMatch[0];

    // Configure HTTPS agent with mTLS certificate
    const httpsAgent = new https.Agent({
      cert,
      key,
      rejectUnauthorized: true,
    });

    const baseUrl = environment === 'production'
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';

    // Action: authenticate
    if (action === 'auth') {
      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grant_type: 'client_credentials' }),
        agent: httpsAgent,
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        logRequest(requestId, action, clientIp, false, 'api_error');
        return res.status(tokenResponse.status).json({ 
          error: ERROR_MESSAGES.internal_error,
          requestId 
        });
      }

      logRequest(requestId, action, clientIp, true);
      return res.status(200).json(tokenData);
    }

    // Action: create charge
    if (action === 'create_cob') {
      const { access_token, txid, cobPayload } = payload;

      const cobResponse = await fetch(`${baseUrl}/v2/cob/${txid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cobPayload),
        agent: httpsAgent,
      });

      const cobData = await cobResponse.json();
      
      if (!cobResponse.ok) {
        logRequest(requestId, action, clientIp, false, 'api_error');
        return res.status(cobResponse.status).json({ 
          error: ERROR_MESSAGES.internal_error,
          requestId 
        });
      }

      logRequest(requestId, action, clientIp, true);
      return res.status(200).json(cobData);
    }

    // Action: get QR Code
    if (action === 'get_qrcode') {
      const { access_token, locId } = payload;

      const qrResponse = await fetch(`${baseUrl}/v2/loc/${locId}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
        agent: httpsAgent,
      });

      const qrData = await qrResponse.json();
      
      if (!qrResponse.ok) {
        logRequest(requestId, action, clientIp, false, 'api_error');
        return res.status(qrResponse.status).json({ 
          error: ERROR_MESSAGES.internal_error,
          requestId 
        });
      }

      logRequest(requestId, action, clientIp, true);
      return res.status(200).json(qrData);
    }

    // Action: link split
    if (action === 'link_split') {
      const { access_token, txid, splitConfigId } = payload;

      const splitResponse = await fetch(`${baseUrl}/v2/gn/split/cob/${txid}/vinculo/${splitConfigId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        agent: httpsAgent,
      });

      if (!splitResponse.ok) {
        logRequest(requestId, action, clientIp, false, 'api_error');
        return res.status(splitResponse.status).json({ 
          error: ERROR_MESSAGES.internal_error,
          requestId 
        });
      }

      logRequest(requestId, action, clientIp, true);
      return res.status(200).json({ success: true });
    }

    logRequest(requestId, action || 'unknown', clientIp, false, 'invalid_action');
    return res.status(400).json({ 
      error: ERROR_MESSAGES.invalid_action,
      requestId 
    });

  } catch (error) {
    // Log full error server-side only
    console.error('[PIX Proxy] Internal Error:', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Return sanitized error to client
    return res.status(500).json({ 
      error: ERROR_MESSAGES.internal_error,
      requestId 
    });
  }
}
