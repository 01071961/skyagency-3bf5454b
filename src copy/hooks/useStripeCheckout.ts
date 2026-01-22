import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutParams {
  productId: string;
  productName: string;
  price: number;
  customerEmail?: string;
}

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkout = async ({ productId, productName, price, customerEmail }: CheckoutParams) => {
    setIsLoading(true);
    
    try {
      // Get Rewardful referral code from window if available
      const referralCode = typeof window !== "undefined" && (window as any).Rewardful?.referral 
        ? (window as any).Rewardful.referral 
        : null;

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          productId,
          productName,
          price,
          customerEmail,
          referralCode,
          successUrl: `${window.location.origin}/academy?success=true`,
          cancelUrl: `${window.location.origin}/academy?canceled=true`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, isLoading };
};
