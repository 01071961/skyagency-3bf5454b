// HTTP Response helpers for Edge Functions

import { corsHeaders } from './cors.ts';

export function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export function errorResponse(message: string, status = 400, details?: unknown): Response {
  const body: Record<string, unknown> = {
    success: false,
    error: message,
  };
  if (details) {
    body.details = details;
  }
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export function rateLimitResponse(): Response {
  return errorResponse('Muitas requisições. Tente novamente em alguns minutos.', 429);
}

export function unauthorizedResponse(message = 'Não autorizado'): Response {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Acesso negado'): Response {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = 'Recurso não encontrado'): Response {
  return errorResponse(message, 404);
}

export function serverErrorResponse(message = 'Erro interno do servidor'): Response {
  return errorResponse(message, 500);
}
