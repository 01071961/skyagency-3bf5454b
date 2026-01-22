/**
 * Stripe Payment Modal - REBUILT
 * 
 * Features:
 * - Robust error handling
 * - Retry logic
 * - Loading timeout
 * - Better user feedback
 */

import { useState, useEffect, useCallback } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripePromise, resetStripe } from "@/lib/stripe";
import { StripeCheckoutForm } from "./StripeCheckoutForm";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Stripe } from "@stripe/stripe-js";

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  price: number;
  onSuccess: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

export const StripePaymentModal = ({
  isOpen,
  onClose,
  productName,
  price,
  onSuccess,
}: StripePaymentModalProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [isStripeLoading, setIsStripeLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Load Stripe on mount
  useEffect(() => {
    let cancelled = false;
    
    const loadStripe = async () => {
      setIsStripeLoading(true);
      try {
        const stripe = await getStripePromise();
        if (cancelled) return;
        
        if (stripe) {
          setStripeInstance(stripe);
          setError(null);
          console.log('[PAYMENT MODAL] Stripe loaded');
        } else {
          throw new Error('Stripe failed to load');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('[PAYMENT MODAL] Failed to load Stripe:', err);
        setError('Não foi possível conectar ao sistema de pagamentos. Verifique sua conexão.');
      } finally {
        if (!cancelled) setIsStripeLoading(false);
      }
    };
    
    loadStripe();
    return () => { cancelled = true; };
  }, []);

  // Create payment intent with retry logic
  const createPaymentIntent = useCallback(async (attempt = 0) => {
    if (!stripeInstance) return;
    
    setIsLoading(true);
    setError(null);
    setClientSecret(null);

    try {
      console.log(`[PAYMENT MODAL] Creating PaymentIntent (attempt ${attempt + 1})`);
      
      const affiliateCode = localStorage.getItem('affiliate_ref_code') || undefined;
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error: invokeError } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          amount: price,
          productName,
          affiliateCode,
          customerEmail: userData?.user?.email,
          userId: userData?.user?.id,
        },
      });

      if (invokeError) {
        // Check if retryable
        const isNetworkError = 
          invokeError.message?.includes('fetch') || 
          invokeError.message?.includes('network') ||
          invokeError.message?.includes('timeout') ||
          invokeError.message?.includes('Failed to send');
        
        if (isNetworkError && attempt < MAX_RETRIES) {
          console.log(`[PAYMENT MODAL] Network error, retrying in ${RETRY_DELAY}ms...`);
          setRetryCount(attempt + 1);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return createPaymentIntent(attempt + 1);
        }
        throw new Error(invokeError.message || 'Erro ao criar sessão de pagamento');
      }
      
      if (!data?.clientSecret) {
        throw new Error('Resposta inválida do servidor');
      }

      console.log('[PAYMENT MODAL] PaymentIntent created:', data.paymentIntentId);
      setClientSecret(data.clientSecret);
      setRetryCount(0);
      
    } catch (err: any) {
      const msg = err.message || 'Erro desconhecido';
      console.error('[PAYMENT MODAL] Failed to create PaymentIntent:', msg);
      
      // User-friendly error messages
      let userMessage = 'Não foi possível iniciar o pagamento.';
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to send')) {
        userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (msg.includes('timeout')) {
        userMessage = 'Conexão lenta. Tente novamente.';
      }
      
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  }, [price, productName, stripeInstance]);

  // Trigger payment intent creation when ready
  useEffect(() => {
    if (isOpen && stripeInstance && !clientSecret && !isLoading && !error) {
      createPaymentIntent();
    }
  }, [isOpen, stripeInstance, clientSecret, isLoading, error, createPaymentIntent]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      setRetryCount(0);
    }
  }, [isOpen]);

  const handleRetry = () => {
    setError(null);
    if (!stripeInstance) {
      // Reset and reload Stripe
      resetStripe();
      setIsStripeLoading(true);
      getStripePromise().then(stripe => {
        if (stripe) {
          setStripeInstance(stripe);
        }
        setIsStripeLoading(false);
      });
    } else {
      createPaymentIntent();
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const showLoading = isLoading || isStripeLoading;
  const showError = error && !showLoading;
  const showForm = clientSecret && stripeInstance && !showLoading && !showError;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Finalizar Compra</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {productName} - R$ {price.toFixed(2)}
          </p>
        </DialogHeader>

        <div className="mt-4">
          {showLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {isStripeLoading ? 'Conectando...' : retryCount > 0 ? `Tentando novamente (${retryCount}/${MAX_RETRIES})...` : 'Preparando pagamento...'}
              </p>
            </div>
          )}

          {showError && (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <WifiOff className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-destructive mb-1">Erro no Pagamento</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-3 w-full">
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleRetry} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {showForm && (
            <Elements
              stripe={stripeInstance}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#ec4899",
                    colorBackground: "#1a1a2e",
                    colorText: "#ffffff",
                    colorDanger: "#ef4444",
                    borderRadius: "8px",
                  },
                },
                locale: "pt-BR",
              }}
            >
              <StripeCheckoutForm onSuccess={handleSuccess} onCancel={onClose} />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
