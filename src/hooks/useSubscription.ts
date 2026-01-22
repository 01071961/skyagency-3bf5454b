import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubscriptionInfo {
  subscribed: boolean;
  subscription_status: string;
  subscription_tier: string | null;
  subscription_end: string | null;
  product_id: string | null;
  price_id: string | null;
  customer_id: string | null;
}

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async (): Promise<SubscriptionInfo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-subscription");

      if (fnError) {
        throw new Error(fnError.message || "Erro ao verificar assinatura");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSubscription(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Check subscription error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCheckout = useCallback(async (params: {
    priceId: string;
    mode?: 'subscription' | 'payment';
    successUrl?: string;
    cancelUrl?: string;
    trialPeriodDays?: number;
  }): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-subscription-checkout", {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao criar checkout");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        // Redirect to checkout
        window.location.href = data.url;
        return data.url;
      }

      throw new Error("URL de checkout não recebida");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error("Erro ao iniciar checkout", { description: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openCustomerPortal = useCallback(async (returnUrl?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("customer-portal", {
        body: { returnUrl },
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao abrir portal");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL do portal não recebida");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error("Erro ao abrir portal", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    subscription,
    isLoading,
    error,
    isSubscribed: subscription?.subscribed ?? false,
    subscriptionTier: subscription?.subscription_tier ?? null,
    subscriptionEnd: subscription?.subscription_end ?? null,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
