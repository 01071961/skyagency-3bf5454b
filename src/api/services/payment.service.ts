// Payment Service
import { supabase } from '@/integrations/supabase/client';
import type { PaymentRequest, PaymentResponse, OrderConfirmationRequest, OrderConfirmationResponse } from '../types';
import { ENDPOINTS } from '@/config';

export const paymentService = {
  async processPayment(data: PaymentRequest): Promise<PaymentResponse> {
    const { data: response, error } = await supabase.functions.invoke(
      ENDPOINTS.payment.process,
      { body: data }
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento',
      };
    }

    return response as PaymentResponse;
  },

  async sendOrderConfirmation(data: OrderConfirmationRequest): Promise<OrderConfirmationResponse> {
    const { data: response, error } = await supabase.functions.invoke(
      ENDPOINTS.payment.confirmation,
      { body: data }
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao enviar confirmação',
      };
    }

    return response as OrderConfirmationResponse;
  },
};
