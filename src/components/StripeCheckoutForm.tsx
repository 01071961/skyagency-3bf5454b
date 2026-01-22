/**
 * Stripe Checkout Form - REBUILT
 * 
 * Features:
 * - Robust error handling
 * - Ready state tracking
 * - Better user feedback
 * - Supports PIX, Card, Boleto
 */

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface StripeCheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const StripeCheckoutForm = ({ onSuccess, onCancel }: StripeCheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Timeout for element loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReady && !loadError) {
        console.warn('[STRIPE FORM] Loading timeout');
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [isReady, loadError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('[STRIPE FORM] Stripe or elements not ready');
      toast.error('Sistema de pagamento não está pronto. Aguarde...');
      return;
    }

    if (!isReady) {
      console.error('[STRIPE FORM] Payment Element not ready');
      toast.error('Aguarde o carregamento do formulário');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[STRIPE FORM] Submitting payment...');
      
      // Validate payment details
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('[STRIPE FORM] Submit error:', submitError);
        toast.error(submitError.message || 'Erro nos dados do pagamento');
        setIsProcessing(false);
        return;
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error('[STRIPE FORM] Payment error:', error);
        
        // User-friendly error messages
        let message = 'Erro ao processar pagamento';
        switch (error.type) {
          case 'card_error':
            message = error.message || 'Cartão recusado. Verifique os dados ou tente outro cartão.';
            break;
          case 'validation_error':
            message = error.message || 'Verifique os dados informados';
            break;
          default:
            if (error.code === 'payment_intent_unexpected_state') {
              message = 'O pagamento já foi processado ou expirou. Recarregue a página.';
            } else {
              message = error.message || 'Erro ao processar pagamento';
            }
        }
        
        toast.error(message);
        setIsProcessing(false);
      } else if (paymentIntent) {
        console.log('[STRIPE FORM] Payment result:', paymentIntent.status);
        
        switch (paymentIntent.status) {
          case "succeeded":
            toast.success("Pagamento realizado com sucesso!");
            onSuccess();
            break;
          case "processing":
            toast.info("Pagamento em processamento. Você receberá uma confirmação em breve.");
            onSuccess();
            break;
          case "requires_action":
            // 3D Secure - Stripe handles automatically
            toast.info("Autenticação adicional necessária...");
            break;
          default:
            toast.warning(`Status: ${paymentIntent.status}`);
            setIsProcessing(false);
        }
      }
    } catch (err: any) {
      console.error('[STRIPE FORM] Unexpected error:', err);
      toast.error('Erro inesperado. Tente novamente.');
      setIsProcessing(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-center text-destructive text-sm">{loadError}</p>
        <Button variant="outline" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        id="payment-element"
        onReady={() => {
          console.log('[STRIPE FORM] PaymentElement ready');
          setIsReady(true);
        }}
        onLoadError={(e) => {
          console.error('[STRIPE FORM] PaymentElement load error:', e);
          const errorMessage = e?.error?.message || 'Erro ao carregar formulário de pagamento';
          
          if (errorMessage.includes('secret') || errorMessage.includes('Invalid')) {
            setLoadError('Sessão de pagamento expirada. Clique em "Voltar" e tente novamente.');
          } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            setLoadError('Erro de conexão. Verifique sua internet.');
          } else {
            setLoadError(errorMessage);
          }
        }}
        options={{
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              address: {
                country: "BR",
              },
            },
          },
        }}
      />
      
      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>Pagamento 100% seguro via Stripe</span>
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing || !isReady}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : !isReady ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
