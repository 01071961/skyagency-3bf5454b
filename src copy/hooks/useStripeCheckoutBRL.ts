import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutParams {
  productId?: string;
  productName: string;
  price: number;
  description?: string;
  imageUrl?: string;
  quantity?: number;
  customerEmail?: string;
  affiliateCode?: string;
  orderId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutResult {
  sessionId: string;
  url: string;
}

export const useStripeCheckoutBRL = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useCallback(async (params: CheckoutParams): Promise<CheckoutResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get affiliate code from localStorage if not provided (use consistent key)
      const affiliateCode = params.affiliateCode || 
        localStorage.getItem("affiliate_ref_code") ||
        localStorage.getItem("affiliate_code") || 
        localStorage.getItem("referral_code") ||
        (window as any).rewardful?.referral || 
        "";

      const { data, error: fnError } = await supabase.functions.invoke("stripe-checkout-brl", {
        body: {
          ...params,
          affiliateCode,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao criar sessão de checkout");
      }

      if (!data?.url) {
        throw new Error("URL de checkout não retornada");
      }

      return {
        sessionId: data.sessionId,
        url: data.url,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error("Erro ao iniciar pagamento", { description: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkout = useCallback(async (params: CheckoutParams) => {
    const result = await createCheckout(params);
    if (result?.url) {
      // Open in new tab by default
      window.open(result.url, "_blank");
    }
    return result;
  }, [createCheckout]);

  const checkoutRedirect = useCallback(async (params: CheckoutParams) => {
    const result = await createCheckout(params);
    if (result?.url) {
      // Redirect in same window
      window.location.href = result.url;
    }
  }, [createCheckout]);

  return {
    checkout,
    checkoutRedirect,
    createCheckout,
    isLoading,
    error,
  };
};
