import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle, ArrowLeft, DollarSign, 
  TrendingUp, Gift, Shield, Star, CreditCard, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

const AFFILIATE_FEE = 30; // Taxa de ativação em reais

const benefits = [
  {
    icon: DollarSign,
    title: 'Até 15% de Comissão',
    description: 'Ganhe comissões competitivas em cada venda indicada',
  },
  {
    icon: TrendingUp,
    title: 'Pagamentos Rápidos',
    description: 'Receba suas comissões rapidamente após atingir o mínimo de R$50',
  },
  {
    icon: Gift,
    title: 'Bônus Exclusivos',
    description: 'Ganhe pontos extras e recompensas especiais',
  },
  {
    icon: Shield,
    title: 'Dashboard Completo',
    description: 'Acompanhe suas indicações e ganhos em tempo real',
  },
];

const tiers = [
  { name: 'Bronze', commission: '10%', requirement: 'Início' },
  { name: 'Silver', commission: '11%', requirement: '5+ vendas/mês' },
  { name: 'Gold', commission: '12%', requirement: '15+ vendas/mês' },
  { name: 'Diamond', commission: '15%', requirement: '30+ vendas/mês' },
];

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

function AffiliatePaymentForm({ clientSecret, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vip/affiliate/register?success=true`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Erro ao processar pagamento');
      toast({
        title: 'Erro no pagamento',
        description: submitError.message,
        variant: 'destructive',
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({
        title: 'Pagamento confirmado!',
        description: 'Seu cadastro de afiliado foi ativado!',
      });
      onSuccess();
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar R$ {AFFILIATE_FEE.toFixed(2).replace('.', ',')}
          </>
        )}
      </Button>
    </form>
  );
}

export default function VIPAffiliateRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bank: '',
    agency: '',
    account: '',
    accountType: 'corrente',
    accountHolder: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/affiliate/register');
    }
  }, [user, authLoading, navigate]);

  // Check for success return from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setStep('success');
    }
  }, [searchParams]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast({
        title: 'Atenção',
        description: 'Você precisa aceitar os termos para continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!bankInfo.bank || !bankInfo.agency || !bankInfo.account) {
      toast({
        title: 'Atenção',
        description: 'Preencha os dados bancários para receber comissões.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        navigate('/auth?redirect=/vip/affiliate/register');
        return;
      }

      // First, register the affiliate (pending status)
      const res = await supabase.functions.invoke('affiliate-actions', {
        body: {
          action: 'register',
          bank_info: bankInfo,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.error) {
        throw new Error(res.data.error);
      }

      // Check if already affiliate
      if (res.data?.affiliate?.status === 'approved') {
        toast({
          title: 'Você já é um afiliado!',
          description: 'Redirecionando para o dashboard...',
        });
        navigate('/vip/dashboard');
        return;
      }

      const newAffiliateId = res.data?.affiliate?.id;
      setAffiliateId(newAffiliateId);

      // Create PaymentIntent for activation fee
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: AFFILIATE_FEE,
          productName: 'Taxa de Ativação - Programa de Afiliados SKY',
          customerEmail: user?.email,
          affiliateActivationId: newAffiliateId,
          userId: user?.id,
        },
      });

      if (paymentError || !paymentData?.clientSecret) {
        throw new Error(paymentError?.message || 'Erro ao criar pagamento');
      }

      setClientSecret(paymentData.clientSecret);
      setStep('payment');

    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Approve affiliate after successful payment
    if (affiliateId) {
      await supabase
        .from('vip_affiliates')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', affiliateId);
    }
    setStep('success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Parabéns! Você é um Afiliado VIP!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Seu cadastro foi ativado com sucesso. Agora você pode começar a indicar clientes e ganhar comissões!
                </p>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate('/vip/affiliate/products')} className="flex-1">
                    Ver Produtos
                  </Button>
                  <Button onClick={() => navigate('/vip/dashboard')} className="flex-1">
                    Ir ao Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Payment step
  if (step === 'payment' && clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setStep('form')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagamento da Taxa de Ativação
                </CardTitle>
                <CardDescription>
                  Pague R$ {AFFILIATE_FEE.toFixed(2).replace('.', ',')} para ativar seu cadastro de afiliado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#ec4899',
                      },
                    },
                  }}
                >
                  <AffiliatePaymentForm 
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    Pagamento seguro processado via Stripe. Seus dados são criptografados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/vip/dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Torne-se um Afiliado VIP
            </h1>
            <p className="text-muted-foreground">
              Ganhe comissões indicando novos clientes para a SKY BRASIL
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Por que ser afiliado?</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <benefit.icon className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Níveis de Afiliado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{tier.name}</span>
                        <span className="text-sm text-muted-foreground">{tier.requirement}</span>
                      </div>
                      <span className="font-bold text-primary">{tier.commission}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Cadastre-se como Afiliado</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para solicitar seu cadastro
                </CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmitForm} className="space-y-6">
                  {/* Bank Info for receiving commissions */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Dados Bancários para Recebimento *</Label>
                    <p className="text-xs text-muted-foreground">
                      Suas comissões serão depositadas nesta conta
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank">Banco *</Label>
                        <Input
                          id="bank"
                          placeholder="Ex: Nubank, Itaú, Bradesco"
                          value={bankInfo.bank}
                          onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="agency">Agência *</Label>
                        <Input
                          id="agency"
                          placeholder="0001"
                          value={bankInfo.agency}
                          onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="account">Conta *</Label>
                        <Input
                          id="account"
                          placeholder="12345-6"
                          value={bankInfo.account}
                          onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountHolder">Titular da Conta</Label>
                        <Input
                          id="accountHolder"
                          placeholder="Nome completo"
                          value={bankInfo.accountHolder}
                          onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      Li e aceito os{' '}
                      <a href="#" className="text-primary hover:underline">
                        Termos do Programa de Afiliados
                      </a>{' '}
                      e a{' '}
                      <a href="#" className="text-primary hover:underline">
                        Política de Privacidade
                      </a>
                    </label>
                  </div>

                  {/* Fee Notice */}
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">Taxa de Ativação</span>
                      <span className="text-xl font-bold text-primary">
                        R$ {AFFILIATE_FEE.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pagamento único via cartão de crédito. Seu cadastro será liberado imediatamente após a confirmação.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continuar para Pagamento
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
