import { Loader2, CreditCard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/auth/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ManageSubscriptionButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  returnUrl?: string;
}

export const ManageSubscriptionButton = ({
  className,
  variant = "outline",
  size = "default",
  returnUrl,
}: ManageSubscriptionButtonProps) => {
  const { user } = useAuth();
  const { isSubscribed, openCustomerPortal, isLoading } = useSubscription();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!user) {
      toast.error("Faça login primeiro");
      navigate("/auth");
      return;
    }

    if (!isSubscribed) {
      toast.info("Você não possui uma assinatura ativa");
      return;
    }

    await openCustomerPortal(returnUrl || window.location.href);
  };

  if (!isSubscribed) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Settings className="w-4 h-4 mr-2" />
      )}
      Gerenciar Assinatura
    </Button>
  );
};

interface SubscribeButtonProps {
  priceId: string;
  planName?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  mode?: "subscription" | "payment";
  children?: React.ReactNode;
}

export const SubscribeButton = ({
  priceId,
  planName,
  className,
  variant = "default",
  size = "default",
  mode = "subscription",
  children,
}: SubscribeButtonProps) => {
  const { user } = useAuth();
  const { createCheckout, isLoading } = useSubscription();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!user) {
      toast.error("Faça login para assinar", {
        action: {
          label: "Entrar",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    await createCheckout({
      priceId,
      mode,
      successUrl: `${window.location.origin}/payment-success?plan=${planName || "subscription"}`,
      cancelUrl: `${window.location.origin}/payment-canceled`,
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {children || "Assinar"}
    </Button>
  );
};

export default ManageSubscriptionButton;
