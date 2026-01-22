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
      console.log('Gerando token do cartão...');
      
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
                reject(new Error('Erro ao tokenizar cartão: ' + error));
              } else {
                resolve(token);
              }
            });
        });
      } catch (tokenError: any) {
        throw new Error('Falha ao processar dados do cartão. Verifique as informações.');
      }

      console.log('Token gerado com sucesso');

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
      const errorMessage = err.message || 'Erro desconhecido ao processar pagamento';
      setError(errorMessage);
      console.error('Erro no pagamento:', err);
      return {
        success: false,
        error: errorMessage,
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