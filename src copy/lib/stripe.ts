/**
 * Stripe Client Integration - REBUILT
 * 
 * Features:
 * - Retry logic for network failures
 * - Timeout handling
 * - Better error messages
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

let stripeInstance: Stripe | null = null;
let stripePromiseCache: Promise<Stripe | null> | null = null;
let lastError: string | null = null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT_MS = 15000;

// Logging helper
const logStripe = (message: string, data?: Record<string, unknown>) => {
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[STRIPE] ${message}${dataStr}`);
};

// Fetch publishable key with retry
async function getPublishableKey(retryCount = 0): Promise<string> {
  logStripe('Fetching publishable key...', { attempt: retryCount + 1 });
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const { data, error } = await supabase.functions.invoke('stripe-config', {
      // @ts-ignore - signal is valid
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      throw new Error(error.message || 'Failed to fetch Stripe config');
    }
    
    if (!data?.publishableKey) {
      throw new Error('No publishable key returned');
    }
    
    logStripe('Got publishable key', { mode: data.mode });
    lastError = null;
    return data.publishableKey;
    
  } catch (err: any) {
    const isRetryable = 
      err.name === 'AbortError' || 
      err.message?.includes('fetch') || 
      err.message?.includes('network') ||
      err.message?.includes('timeout');
    
    if (isRetryable && retryCount < MAX_RETRIES) {
      logStripe('Retrying...', { attempt: retryCount + 1, error: err.message });
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return getPublishableKey(retryCount + 1);
    }
    
    lastError = err.message || 'Erro de conexão com Stripe';
    logStripe('Failed to get publishable key', { error: lastError });
    throw new Error(lastError);
  }
}

// Initialize Stripe with retry
export async function initializeStripe(): Promise<Stripe | null> {
  if (stripeInstance) {
    logStripe('Using cached Stripe instance');
    return stripeInstance;
  }

  try {
    logStripe('Initializing Stripe...');
    
    const key = await getPublishableKey();
    const stripe = await loadStripe(key);
    
    if (stripe) {
      stripeInstance = stripe;
      lastError = null;
      logStripe('✅ Stripe initialized successfully');
    } else {
      throw new Error('loadStripe returned null');
    }
    
    return stripe;
  } catch (error: any) {
    logStripe('❌ Stripe initialization failed', { error: error.message });
    lastError = error.message;
    return null;
  }
}

// Get Stripe promise (cached)
export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromiseCache) {
    stripePromiseCache = initializeStripe();
  }
  return stripePromiseCache;
}

// Reset Stripe instance (for retry after error)
export function resetStripe(): void {
  logStripe('Resetting Stripe instance');
  stripeInstance = null;
  stripePromiseCache = null;
  lastError = null;
}

// Get last error
export function getStripeError(): string | null {
  return lastError;
}

// Check if Stripe is ready
export function isStripeReady(): boolean {
  return stripeInstance !== null;
}

// Export the promise for direct use
export const stripePromise = getStripePromise();
