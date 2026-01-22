import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    $efiPay?: any;
  }
}

export interface PaymentData {
  cardNumber: string;
  cardName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  address: {
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

export interface PaymentResult {
  success: boolean;
  charge_id?: string;
  status?: string;
  total?: number;
  error?: string;
}

// Helper para logs condicionais (apenas em desenvolvimento)
const devLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const devError = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

// Security: Map technical errors to user-friendly messages (prevents info leakage)
const USER_FRIENDLY_ERRORS: Record<string, string> = {
  'tokenization_failed': 'Erro ao processar dados do cartão. Verifique as informações.',
  'payment_declined': 'Pagamento recusado. Verifique os dados ou tente outro cartão.',
  'network_error': 'Erro de conexão. Tente novamente.',
  'card_error': 'Erro no cartão. Verifique os dados informados.',
  'invalid_request': 'Dados inválidos. Verifique as informações.',
  'authentication_error': 'Erro de autenticação. Tente novamente.',
  'rate_limit': 'Muitas tentativas. Aguarde um momento.',
  'default': 'Erro ao processar pagamento. Tente novamente ou contate o suporte.'
};

const mapErrorToUserMessage = (err: any): string => {
  const message = (err?.message || '').toLowerCase();
  
  if (message.includes('token') || message.includes('tokeniz')) return USER_FRIENDLY_ERRORS.tokenization_failed;
  if (message.includes('declined') || message.includes('recusad')) return USER_FRIENDLY_ERRORS.payment_declined;
  if (message.includes('network') || message.includes('conexão') || message.includes('fetch')) return USER_FRIENDLY_ERRORS.network_error;
  if (message.includes('card') || message.includes('cartão')) return USER_FRIENDLY_ERRORS.card_error;
  if (message.includes('invalid') || message.includes('inválid')) return USER_FRIENDLY_ERRORS.invalid_request;
  if (message.includes('auth')) return USER_FRIENDLY_ERRORS.authentication_error;
  if (message.includes('rate') || message.includes('limit')) return USER_FRIENDLY_ERRORS.rate_limit;
  
  return USER_FRIENDLY_ERRORS.default;
};

export const useEfiPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (paymentData: PaymentData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Verificar se a biblioteca EfíPay foi carregada
      if (!window.$efiPay) {
        throw new Error('Biblioteca EfíPay não carregada. Recarregue a página.');
      }

      // 1. Obter token do cartão
      devLog('Gerando token do cartão...');
      
      const cardData = {
        brand: detectCardBrand(paymentData.cardNumber),
        number: paymentData.cardNumber.replace(/\s/g, ''),
        cvv: paymentData.cvv,
        expirationMonth: paymentData.expiryMonth,
        expirationYear: paymentData.expiryYear,
      };

      let paymentToken: string;
      try {
        paymentToken = await new Promise((resolve, reject) => {
          window.$efiPay.CreditCard
            .setCardNumber(cardData.number)
            .setBrand(cardData.brand)
            .setCvv(cardData.cvv)
            .setExpirationMonth(cardData.expirationMonth)
            .setExpirationYear(cardData.expirationYear)
            .getPaymentToken((error: any, token: string) => {
              if (error) {
                reject(new Error('Erro ao tokenizar cartão'));
              } else {
                resolve(token);
              }
            });
        });
      } catch (tokenError: any) {
        throw new Error('Falha ao processar dados do cartão. Verifique as informações.');
      }

      devLog('Token gerado com sucesso');

      // 2. Enviar para edge function processar pagamento
      const { data, error: functionError } = await supabase.functions.invoke('process-payment', {
        body: {
          payment_token: paymentToken,
          customer: {
            name: paymentData.customer.name,
            email: paymentData.customer.email,
            cpf: paymentData.customer.cpf,
            phone_number: paymentData.customer.phone,
          },
          billing_address: {
            street: paymentData.address.street,
            number: paymentData.address.number,
            neighborhood: paymentData.address.neighborhood,
            zipcode: paymentData.address.zipcode,
            city: paymentData.address.city,
            complement: paymentData.address.complement,
          },
          items: paymentData.items,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      return {
        success: true,
        charge_id: data.charge_id,
        status: data.status,
        total: data.total,
      };

    } catch (err: any) {
      // Map technical errors to user-friendly messages (security: prevent info leakage)
      const userMessage = mapErrorToUserMessage(err);
      setError(userMessage);
      devError('Payment error details:', err); // Only logged in development
      return {
        success: false,
        error: userMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isProcessing,
    error,
  };
};

// Detectar bandeira do cartão
function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  if (/^(?:2131|1800|35)/.test(number)) return 'jcb';
  if (/^36/.test(number)) return 'diners';
  if (/^(606282|384100|384140|384160|637095|637568|60(?!11))/.test(number)) return 'hipercard';
  if (/^636368/.test(number)) return 'elo';
  
  return 'visa'; // Default
}
