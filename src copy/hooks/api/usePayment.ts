// Payment hook
import { useState } from 'react';
import { paymentService } from '@/api/services';
import type { PaymentRequest, PaymentResponse } from '@/api/types';

// Dev-only logging helpers
const isDev = import.meta.env.DEV;
const devLog = (...args: unknown[]) => isDev && console.log(...args);
const devError = (...args: unknown[]) => isDev && console.error(...args);

export interface UsePaymentResult {
  processPayment: (data: PaymentRequest) => Promise<PaymentResponse>;
  isProcessing: boolean;
  error: string | null;
}

export const usePayment = (): UsePaymentResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
    setIsProcessing(true);
    setError(null);
    devLog('Processing payment...');

    try {
      const result = await paymentService.processPayment(data);
      
      if (!result.success) {
        const errorMsg = result.error || 'Erro ao processar pagamento';
        setError(errorMsg);
        devError('Payment failed:', errorMsg);
        return result;
      }

      devLog('Payment successful:', result.charge_id);
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      devError('Payment error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  return { processPayment, isProcessing, error };
};

// Card brand detection utility
export function detectCardBrand(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
  if (/^(?:2131|1800|35)/.test(cleanNumber)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'diners';
  if (/^(50|6[0367])/.test(cleanNumber)) return 'elo';
  if (/^606282|^3841(?:0|4|6)/.test(cleanNumber)) return 'hipercard';
  
  return 'unknown';
}
