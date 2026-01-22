import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhancedCheckoutParams {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
  customerEmail?: string;
  mode?: 'payment' | 'subscription';
  priceId?: string;
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  enableAdaptivePricing?: boolean;
  enablePromotionCodes?: boolean;
  paymentMethods?: ('card' | 'pix' | 'boleto')[];
  metadata?: Record<string, string>;
}

interface CheckoutResult {
  sessionId: string;
  url: string;
}

/**
 * Enhanced Stripe Checkout Hook
 * 
 * Features:
 * - Adaptive Pricing support
 * - Multiple payment methods (card, PIX, boleto)
 * - Subscription and one-time payment modes
 * - Promotion codes support
 * - Affiliate tracking
 */
export const useStripeCheckoutEnhanced = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (params: EnhancedCheckoutParams): Promise<CheckoutResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get affiliate referral code from localStorage or window
      const affiliateCode = 
        localStorage.getItem('affiliate_ref_code') ||
        (typeof window !== "undefined" && (window as unknown as { Rewardful?: { referral?: string } }).Rewardful?.referral) ||
        null;

      const { data, error: invokeError } = await supabase.functions.invoke("stripe-checkout-enhanced", {
        body: {
          ...params,
          referralCode: affiliateCode,
          successUrl: params.successUrl || `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: params.cancelUrl || `${window.location.origin}/checkout/canceled`,
        },
      });

      if (invokeError) throw invokeError;

      if (data?.url) {
        // Open in new tab by default
        window.open(data.url, '_blank');
        return { sessionId: data.sessionId, url: data.url };
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar pagamento";
      console.error("Stripe checkout error:", err);
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkoutRedirect = async (params: EnhancedCheckoutParams): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const affiliateCode = 
        localStorage.getItem('affiliate_ref_code') ||
        (typeof window !== "undefined" && (window as unknown as { Rewardful?: { referral?: string } }).Rewardful?.referral) ||
        null;

      const { data, error: invokeError } = await supabase.functions.invoke("stripe-checkout-enhanced", {
        body: {
          ...params,
          referralCode: affiliateCode,
          successUrl: params.successUrl || `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: params.cancelUrl || `${window.location.origin}/checkout/canceled`,
        },
      });

      if (invokeError) throw invokeError;

      if (data?.url) {
        // Redirect in same window
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar pagamento";
      console.error("Stripe checkout error:", err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    checkout, 
    checkoutRedirect,
    isLoading, 
    error,
  };
};

/**
 * Invoice Preview Hook
 * 
 * Preview upcoming invoice changes for subscription upgrades/downgrades
 */
export const useInvoicePreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPreview = async (params: {
    subscriptionId?: string;
    newPriceId: string;
    quantity?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error: invokeError } = await supabase.functions.invoke("stripe-invoice-preview", {
        body: params,
      });

      if (invokeError) throw invokeError;

      setPreview(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar preview";
      console.error("Invoice preview error:", err);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getPreview,
    preview,
    isLoading,
    error,
  };
};
