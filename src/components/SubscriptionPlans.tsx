import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/auth/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  priceIdMonthly: string;
  priceIdYearly?: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

// IMPORTANT: Replace these with your actual Stripe Price IDs
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfeito para começar",
    priceMonthly: 29.90,
    priceYearly: 299,
    priceIdMonthly: "price_STARTER_MONTHLY", // Replace with actual price ID
    priceIdYearly: "price_STARTER_YEARLY",   // Replace with actual price ID
    features: [
      "Acesso a cursos básicos",
      "Suporte por email",
      "1 projeto ativo",
      "Certificado digital",
    ],
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para criadores sérios",
    priceMonthly: 79.90,
    priceYearly: 799,
    priceIdMonthly: "price_PRO_MONTHLY", // Replace with actual price ID
    priceIdYearly: "price_PRO_YEARLY",   // Replace with actual price ID
    features: [
      "Tudo do Starter",
      "Acesso a todos os cursos",
      "Suporte prioritário",
      "Projetos ilimitados",
      "Mentoria mensal",
      "Comunidade VIP",
    ],
    popular: true,
    icon: <Crown className="w-6 h-6" />,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para equipes e agências",
    priceMonthly: 199.90,
    priceYearly: 1999,
    priceIdMonthly: "price_ENTERPRISE_MONTHLY", // Replace with actual price ID
    priceIdYearly: "price_ENTERPRISE_YEARLY",   // Replace with actual price ID
    features: [
      "Tudo do Pro",
      "Suporte 24/7",
      "API de integração",
      "Relatórios avançados",
      "Gerente de conta dedicado",
      "Treinamento personalizado",
    ],
    icon: <Sparkles className="w-6 h-6" />,
  },
];

export const SubscriptionPlans = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { user } = useAuth();
  const { subscription, isSubscribed, createCheckout, openCustomerPortal, isLoading } = useSubscription();
  const navigate = useNavigate();

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error("Faça login para assinar", {
        action: {
          label: "Entrar",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    setLoadingPlanId(plan.id);
    
    const priceId = billingCycle === "yearly" && plan.priceIdYearly 
      ? plan.priceIdYearly 
      : plan.priceIdMonthly;
    
    await createCheckout({
      priceId,
      mode: "subscription",
      successUrl: `${window.location.origin}/payment-success?plan=${plan.id}`,
      cancelUrl: `${window.location.origin}/payment-canceled`,
    });
    
    setLoadingPlanId(null);
  };

  const handleManageSubscription = async () => {
    await openCustomerPortal(window.location.href);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getYearlySavings = (plan: Plan) => {
    if (!plan.priceYearly) return 0;
    const monthlyTotal = plan.priceMonthly * 12;
    return Math.round(((monthlyTotal - plan.priceYearly) / monthlyTotal) * 100);
  };

  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Escolha seu Plano</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Desbloqueie todo o potencial do SKY BRASIL com nossos planos de assinatura
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-full">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <Badge variant="secondary" className="ml-2 text-xs">
              Economize 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Subscription Status */}
      {isSubscribed && subscription && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto mb-8"
        >
          <Card className="p-4 border-primary/50 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Assinatura Ativa: {subscription.subscription_tier}
                </p>
                <p className="text-sm text-muted-foreground">
                  Válida até: {subscription.subscription_end 
                    ? new Date(subscription.subscription_end).toLocaleDateString("pt-BR")
                    : "—"
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Gerenciar
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`relative p-6 h-full flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Mais Popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  plan.popular ? "bg-primary/20 text-primary" : "bg-muted"
                }`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {formatPrice(
                      billingCycle === "yearly" && plan.priceYearly
                        ? plan.priceYearly / 12
                        : plan.priceMonthly
                    )}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                {billingCycle === "yearly" && plan.priceYearly && (
                  <p className="text-sm text-green-500 mt-1">
                    Economize {getYearlySavings(plan)}% ({formatPrice(plan.priceYearly)}/ano)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlanId === plan.id || isLoading}
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
              >
                {loadingPlanId === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : isSubscribed && subscription?.subscription_tier?.toLowerCase() === plan.id ? (
                  "Plano Atual"
                ) : (
                  "Assinar Agora"
                )}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Métodos de pagamento aceitos
        </p>
        <div className="flex items-center justify-center gap-4 opacity-70">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-8" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-8" />
          <span className="text-sm font-medium text-foreground">PIX</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
