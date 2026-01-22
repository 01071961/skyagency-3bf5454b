// Rate Limiting for Edge Functions

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function getRateLimitInfo(identifier: string): { remaining: number; resetIn: number } | null {
  const entry = rateLimitMap.get(identifier);
  if (!entry) return null;
  
  const now = Date.now();
  return {
    remaining: Math.max(0, DEFAULT_RATE_LIMIT.maxRequests - entry.count),
    resetIn: Math.max(0, entry.resetTime - now),
  };
}
