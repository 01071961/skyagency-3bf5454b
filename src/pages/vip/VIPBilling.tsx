import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, Check, Star, Zap, Shield, Sparkles, 
  CreditCard, ArrowLeft, Loader2, ExternalLink,
  Settings, RefreshCw, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRealtimeTier } from '@/hooks/useRealtimeTier';

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: number;
  period: string;
  priceId: string;
  features: string[];
  popular?: boolean;
  icon: typeof Crown;
  gradient: string;
}

const PLANS: Plan[] = [
  {
    id: 'gold',
    name: 'Ouro',
    tier: 'gold',
    price: 97,
    period: 'mês',
    priceId: 'price_gold_monthly', // Configure no Stripe Dashboard
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Criador de Slides VIP',
      'Exportação PDF/PowerPoint',
      'Geração com IA',
      'Compartilhamento público',
      'Suporte prioritário',
      'Comissões aumentadas (+5%)',
    ]
  },
  {
    id: 'platinum',
    name: 'Platina',
    tier: 'platinum',
    price: 197,
    period: 'mês',
    priceId: 'price_platinum_monthly', // Configure no Stripe Dashboard
    icon: Star,
    gradient: 'from-purple-500 to-pink-600',
    popular: true,
    features: [
      'Tudo do Ouro +',
      'Templates exclusivos',
      'Armazenamento ilimitado',
      'API de integração',
      'Mentoria mensal',
      'Comissões máximas (+10%)',
      'Badge exclusiva no perfil',
      'Acesso beta a novidades',
    ]
  }
];

export default function VIPBilling() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    effectiveTier, 
    subscriptionStatus, 
    subscriptionEnd, 
    hasActiveSubscription,
    isLoading: tierLoading,
    refetch: refetchTier,
    syncWithStripe 
  } = useRealtimeTier();
  
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Check for success/canceled URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      // Auto-sync with Stripe after successful checkout
      handleSyncSubscription();
      toast.success('Pagamento realizado!', {
        description: 'Sincronizando sua assinatura...'
      });
      // Clean URL
      window.history.replaceState({}, '', '/vip/billing');
    }
    
    if (canceled === 'true') {
      toast.info('Checkout cancelado', {
        description: 'Você pode tentar novamente quando quiser.'
      });
      window.history.replaceState({}, '', '/vip/billing');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  const handleSyncSubscription = async () => {
    setSyncing(true);
    try {
      await syncWithStripe();
    } finally {
      setSyncing(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error('Faça login para continuar');
      navigate('/auth');
      return;
    }

    setCheckingOut(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          priceId: plan.priceId,
          mode: 'subscription',
          successUrl: `${window.location.origin}/vip/billing?success=true`,
          cancelUrl: `${window.location.origin}/vip/billing?canceled=true`,
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Erro ao iniciar checkout', {
        description: error.message || 'Tente novamente'
      });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error('Erro ao abrir portal', {
        description: error.message
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  const isCurrentPlan = (tier: string) => {
    const normalizedEffective = effectiveTier?.toLowerCase() || '';
    return normalizedEffective.includes(tier) || normalizedEffective === tier;
  };

  if (loading || tierLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/vip/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">
          Eleve seu Nível VIP
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Desbloqueie ferramentas exclusivas, aumente suas comissões e acelere seus resultados
        </p>
      </motion.div>

      {/* Current Subscription Badge */}
      {hasActiveSubscription && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <Card className="inline-flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Assinatura Ativa
              </p>
              <p className="text-sm text-muted-foreground">
                {effectiveTier?.toUpperCase()} • 
                Válida até {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('pt-BR') : 'indefinido'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={openingPortal}>
              {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
              Gerenciar
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.tier);
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden h-full ${plan.popular ? 'border-2 border-primary shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute top-0 left-0">
                    <Badge variant="secondary" className="rounded-none rounded-br-lg">
                      <Check className="w-3 h-3 mr-1" />
                      Seu Plano
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold text-foreground">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full ${plan.popular ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90` : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={checkingOut === plan.id || isCurrent}
                  >
                    {checkingOut === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : isCurrent ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {isCurrent ? 'Plano Atual' : 'Assinar Agora'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-16 text-center"
      >
        <h3 className="text-xl font-semibold mb-4">Perguntas Frequentes</h3>
        <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
          <Card className="p-6">
            <h4 className="font-medium mb-2">Posso cancelar a qualquer momento?</h4>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode cancelar sua assinatura quando quiser pelo portal de gerenciamento. 
              O acesso continua até o fim do período pago.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="font-medium mb-2">Como funciona o upgrade de plano?</h4>
            <p className="text-sm text-muted-foreground">
              Ao fazer upgrade, o valor proporcional restante é aplicado como crédito 
              no novo plano automaticamente.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="font-medium mb-2">Quais formas de pagamento são aceitas?</h4>
            <p className="text-sm text-muted-foreground">
              Aceitamos cartões de crédito, débito e PIX. Todos os pagamentos são 
              processados de forma segura via Stripe.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="font-medium mb-2">Preciso ter conta VIP para assinar?</h4>
            <p className="text-sm text-muted-foreground">
              Sim, você precisa ser um afiliado VIP aprovado. Se ainda não é, 
              cadastre-se primeiro na área de afiliados.
            </p>
          </Card>
        </div>
      </motion.div>

      {/* Refresh Status */}
      <div className="flex justify-center mt-8 gap-2">
        <Button variant="ghost" size="sm" onClick={refetchTier}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar Status
        </Button>
        <Button variant="outline" size="sm" onClick={handleSyncSubscription} disabled={syncing}>
          {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
          Sincronizar Stripe
        </Button>
      </div>
    </div>
  );
}
