import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, User, CheckCircle, Loader2, ShoppingBag, Shield, AlertCircle, RefreshCw, LogIn } from "lucide-react";
import { PaymentCardBrands } from "@/components/PaymentCardBrands";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { getStripePromise } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
}

// Payment Form Component - Shows payment options (card, Pix, etc.)
const PaymentForm = ({ 
  onSuccess, 
  onCancel,
  orderNumber,
  formData,
}: { 
  onSuccess: (paymentIntentId: string) => void; 
  onCancel: () => void;
  orderNumber: string;
  formData: CustomerFormData;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Timeout for loading - 15 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReady && !loadError) {
        console.error('[PAYMENT] Timeout loading payment element');
        setLoadTimeout(true);
        setLoadError("Tempo esgotado ao carregar opções de pagamento. Verifique sua conexão e tente novamente.");
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isReady, loadError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      toast({
        title: "Aguarde",
        description: "Carregando formulário de pagamento...",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // First validate the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('[PAYMENT] Submit error:', submitError);
        toast({
          title: "Erro nos dados",
          description: submitError.message || "Verifique os dados de pagamento",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?order=${orderNumber}`,
          payment_method_data: {
            billing_details: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        console.error('[PAYMENT] Error:', error);
        let message = error.message || "Não foi possível processar";
        if (error.type === 'card_error') {
          message = error.message || 'Cartão recusado. Verifique os dados.';
        }
        toast({
          title: "Erro no pagamento",
          description: message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent) {
        console.log('[PAYMENT] Success:', paymentIntent.status);
        if (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") {
          onSuccess(paymentIntent.id);
        } else {
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('[PAYMENT] Exception:', err);
      setIsProcessing(false);
      toast({
        title: "Erro",
        description: "Falha ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setLoadError(null);
    setLoadTimeout(false);
    setIsReady(false);
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {loadError ? (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-destructive mb-4">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Voltar
            </Button>
            <Button 
              onClick={handleRetry}
              className="bg-gradient-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-[280px] relative">
            {!isReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Carregando opções de pagamento...</p>
                <p className="text-xs text-muted-foreground mt-1">(Cartão, Pix e outros)</p>
              </div>
            )}
            <PaymentElement 
              onReady={() => {
                console.log('[PAYMENT] PaymentElement READY - payment options should be visible now');
                setIsReady(true);
              }}
              onLoadError={(e) => {
                console.error('[PAYMENT] PaymentElement LOAD ERROR:', e);
                setLoadError("Não foi possível carregar as opções de pagamento. Verifique sua internet.");
              }}
              onChange={(event) => {
                console.log('[PAYMENT] PaymentElement changed:', event.complete ? 'complete' : 'incomplete', event.value?.type);
              }}
              options={{
                layout: {
                  type: "tabs",
                  defaultCollapsed: false,
                },
                business: { name: "Sky Streamer" },
                paymentMethodOrder: ["card", "pix"],
                defaultValues: {
                  billingDetails: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                      country: "BR",
                    },
                  },
                },
              }}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={!stripe || !elements || !isReady || isProcessing}
              className="flex-1 bg-gradient-primary"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar R$ {formData ? '' : ''}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

// Main Checkout Component
const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<'auth' | 'form' | 'payment'>('auth');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Initialize Stripe on mount
  useEffect(() => {
    getStripePromise()
      .then((stripe) => {
        if (stripe) {
          setStripeReady(true);
        } else {
          setStripeError("Não foi possível conectar ao sistema de pagamento");
        }
      })
      .catch(() => {
        setStripeError("Erro ao inicializar pagamentos");
      });
  }, []);

  // Handle auth state change - skip auth step if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && step === 'auth') {
      setStep('form');
      // Pre-fill email from authenticated user
      if (user.email) {
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || prev.name,
        }));
      }
    }
  }, [authLoading, isAuthenticated, user, step]);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = "Nome é obrigatório";
    if (!formData.email.trim() || !formData.email.includes("@")) errors.email = "Email válido é obrigatório";
    if (!formData.phone.trim()) errors.phone = "Telefone é obrigatório";
    if (!formData.cpf.trim() || formData.cpf.replace(/\D/g, '').length !== 11) errors.cpf = "CPF válido é obrigatório";
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Erro de validação",
        description: Object.values(errors)[0],
        variant: "destructive",
      });
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const createPaymentIntent = async () => {
    if (!validateForm()) return;
    if (!stripeReady) {
      toast({
        title: "Aguarde",
        description: "Sistema de pagamento carregando...",
      });
      return;
    }

    setIsCreatingPayment(true);
    try {
      const affiliateCode = localStorage.getItem('affiliate_ref_code') || undefined;

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: total,
          productName: items.map(i => i.name).join(', '),
          customerEmail: formData.email,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerCpf: formData.cpf,
          affiliateCode,
          userId: user?.id || undefined,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.clientSecret) throw new Error("Resposta inválida do servidor");

      setClientSecret(data.clientSecret);
      setOrderNumber(data.orderNumber);
      setStep('payment');
    } catch (error: any) {
      console.error("Payment creation error:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o pagamento",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    localStorage.removeItem('affiliate_ref_code');
    localStorage.removeItem('affiliate_ref_timestamp');

    toast({
      title: "Pagamento confirmado!",
      description: "Você receberá um email com os detalhes.",
      duration: 5000,
    });
    
    clearCart();
    navigate(`/payment-success?order=${orderNumber}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-tech flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <CardContent className="pt-6">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-4">Carrinho Vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos ao carrinho para finalizar sua compra
            </p>
            <Button onClick={() => navigate("/vendas")} className="bg-gradient-primary">
              Ver Produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if Stripe failed to load
  if (stripeError) {
    return (
      <div className="min-h-screen bg-gradient-tech flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8">
          <CardContent className="pt-6">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-4">Erro de Conexão</h2>
            <p className="text-muted-foreground mb-6">{stripeError}</p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginFormData.email || !loginFormData.password) {
      toast({
        title: "Erro",
        description: "Preencha email e senha",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginFormData.email,
        password: loginFormData.password,
      });
      
      if (error) {
        toast({
          title: "Erro ao entrar",
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado!",
          description: "Continue com sua compra",
        });
        setStep('form');
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginFormData.email || !loginFormData.password) {
      toast({
        title: "Erro",
        description: "Preencha email e senha (mínimo 6 caracteres)",
        variant: "destructive",
      });
      return;
    }
    
    if (loginFormData.password.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginFormData.email,
        password: loginFormData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/checkout`,
          data: {
            name: loginFormData.email.split('@')[0],
          },
        },
      });
      
      if (error) {
        toast({
          title: "Erro ao cadastrar",
          description: error.message.includes('already registered') 
            ? 'Este email já está cadastrado. Tente fazer login.' 
            : error.message,
          variant: "destructive",
        });
        if (error.message.includes('already registered')) {
          setShowLoginForm(true);
        }
      } else {
        toast({
          title: "Conta criada!",
          description: "Continue com sua compra",
        });
        setStep('form');
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao cadastrar",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-tech flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-tech py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'payment') setStep('form');
              else if (step === 'form' && !isAuthenticated) setStep('auth');
              else navigate(-1);
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 'payment' ? 'Voltar aos dados' : step === 'form' ? 'Voltar' : 'Voltar'}
          </Button>
          
          <h1 className="text-3xl font-bold">Finalizar Compra</h1>
          <p className="text-muted-foreground mt-2">
            {step === 'auth' ? 'Faça login ou cadastre-se para continuar' : step === 'form' ? 'Preencha seus dados para continuar' : 'Escolha a forma de pagamento'}
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'auth' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
              {isAuthenticated ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <div className={`h-1 flex-1 ${step !== 'auth' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'form' ? 'bg-primary text-primary-foreground' : step === 'payment' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <div className={`h-1 flex-1 ${step === 'payment' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 'auth' ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      {showLoginForm ? 'Fazer Login' : 'Criar Conta ou Entrar'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Google Login */}
                    <div>
                      <GoogleLoginButton redirectTo={`${window.location.origin}/checkout`} />
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Forma mais rápida de continuar
                      </p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou</span>
                      </div>
                    </div>
                    
                    {/* Email/Password Form */}
                    <form onSubmit={showLoginForm ? handleLogin : handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="auth-email">Email</Label>
                        <Input
                          id="auth-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={loginFormData.email}
                          onChange={(e) => setLoginFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="auth-password">Senha</Label>
                        <Input
                          id="auth-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginFormData.password}
                          onChange={(e) => setLoginFormData(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoggingIn}>
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : showLoginForm ? (
                          'Entrar'
                        ) : (
                          'Criar Conta'
                        )}
                      </Button>
                    </form>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowLoginForm(!showLoginForm)}
                        className="text-sm text-primary hover:underline"
                      >
                        {showLoginForm ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Fazer login'}
                      </button>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Por que criar conta?</p>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            <li>• Acesso imediato ao produto após pagamento</li>
                            <li>• Histórico de compras e faturas</li>
                            <li>• Suporte prioritário</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : step === 'form' ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Seu nome"
                          className={validationErrors.name ? "border-destructive" : ""}
                        />
                        {validationErrors.name && (
                          <p className="text-sm text-destructive">{validationErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="seu@email.com"
                          className={validationErrors.email ? "border-destructive" : ""}
                        />
                        {validationErrors.email && (
                          <p className="text-sm text-destructive">{validationErrors.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(00) 00000-0000"
                          className={validationErrors.phone ? "border-destructive" : ""}
                        />
                        {validationErrors.phone && (
                          <p className="text-sm text-destructive">{validationErrors.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={handleInputChange}
                          placeholder="000.000.000-00"
                          className={validationErrors.cpf ? "border-destructive" : ""}
                        />
                        {validationErrors.cpf && (
                          <p className="text-sm text-destructive">{validationErrors.cpf}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Endereço (Opcional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={handleInputChange}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Rua</Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          placeholder="Nome da rua"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          value={formData.number}
                          onChange={handleInputChange}
                          placeholder="Nº"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          value={formData.complement}
                          onChange={handleInputChange}
                          placeholder="Apto..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={handleInputChange}
                          placeholder="Bairro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Cidade"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={createPaymentIntent}
                  disabled={isCreatingPayment || !stripeReady}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  {isCreatingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : !stripeReady ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Continuar para Pagamento
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Pagamento Seguro
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Seus dados são protegidos com criptografia SSL
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientSecret && orderNumber ? (
                      <Elements
                        stripe={getStripePromise()}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'night',
                            variables: {
                              colorPrimary: '#ec4899',
                              colorBackground: '#1a1a2e',
                              colorText: '#ffffff',
                              colorDanger: '#ef4444',
                              fontFamily: 'Inter, system-ui, sans-serif',
                              borderRadius: '8px',
                            },
                          },
                          locale: 'pt-BR',
                        }}
                      >
                        <PaymentForm
                          onSuccess={handlePaymentSuccess}
                          onCancel={() => {
                            setStep('form');
                            setClientSecret(null);
                          }}
                          orderNumber={orderNumber}
                          formData={formData}
                        />
                      </Elements>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="mt-4">
                  <PaymentCardBrands />
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start py-2 border-b border-border/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Compra 100% segura</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
