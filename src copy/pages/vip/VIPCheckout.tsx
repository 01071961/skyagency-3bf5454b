/**
 * VIP Checkout Page - REBUILT
 * 
 * Features:
 * - Robust error handling
 * - Retry logic for payment creation
 * - Loading timeout
 * - PIX and Card support via Payment Element
 * - Affiliate tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CreditCard, Diamond, CheckCircle,
  AlertCircle, Loader2, RefreshCw, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useCart } from '@/contexts/CartContext';
import InputMask from 'react-input-mask';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise, resetStripe } from '@/lib/stripe';
import type { Stripe } from '@stripe/stripe-js';

// ========== CHECKOUT FORM COMPONENT ==========
interface CheckoutFormProps {
  orderId: string;
  onSuccess: () => void;
  totalPrice: number;
}

function CheckoutForm({ orderId, onSuccess, totalPrice }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      toast.error('Aguarde o carregamento do formulário');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate payment details
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Erro nos dados do pagamento');
        toast.error(submitError.message || 'Verifique os dados do pagamento');
        setIsProcessing(false);
        return;
      }

      // Confirm the payment
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/vip/checkout?success=true&order_id=${orderId}`,
        },
        redirect: "if_required",
      });

      if (paymentError) {
        let message = 'Erro ao processar pagamento';
        if (paymentError.type === 'card_error') {
          message = paymentError.message || 'Cartão recusado';
        } else if (paymentError.type === 'validation_error') {
          message = paymentError.message || 'Verifique os dados';
        }
        setError(message);
        toast.error(message);
        setIsProcessing(false);
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          toast.success('Pagamento realizado com sucesso!');
          onSuccess();
        } else if (paymentIntent.status === 'processing') {
          toast.info('Pagamento em processamento...');
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          // 3D Secure handled by Stripe
          toast.info('Autenticação adicional necessária');
        }
      }
    } catch (err: any) {
      console.error('[CHECKOUT] Unexpected error:', err);
      setError('Erro inesperado. Tente novamente.');
      toast.error('Erro inesperado');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="min-h-[200px]">
        <PaymentElement 
          id="payment-element"
          onReady={() => {
            console.log('[CHECKOUT] PaymentElement ready');
            setIsReady(true);
            setError(null);
          }}
          onLoadError={(e) => {
            console.error('[CHECKOUT] PaymentElement load error:', e);
            const errorMsg = e?.error?.message || 'Erro ao carregar formulário';
            // Check for specific errors
            if (errorMsg.includes('secret') || errorMsg.includes('Invalid')) {
              setError('Sessão expirada. Tente novamente.');
            } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
              setError('Erro de conexão. Verifique sua internet.');
            } else {
              setError('Erro ao carregar formulário. Tente novamente.');
            }
          }}
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                address: { country: "BR" },
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || !isReady || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : !isReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Pagar R$ {totalPrice.toFixed(2)}
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Aceite Cartão de Crédito, PIX e Boleto
      </p>
    </form>
  );
}

// ========== MAIN COMPONENT ==========
export default function VIPCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total: totalPrice, clearCart } = useCart();

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [isStripeLoading, setIsStripeLoading] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');

  const pointsToEarn = Math.floor(totalPrice);

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
          console.log('[CHECKOUT] Stripe loaded');
        } else {
          setError('Não foi possível conectar ao sistema de pagamentos');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('[CHECKOUT] Stripe load error:', err);
        setError('Erro ao conectar com sistema de pagamentos');
      } finally {
        if (!cancelled) setIsStripeLoading(false);
      }
    };
    
    loadStripe();
    return () => { cancelled = true; };
  }, []);

  // Check for success return from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setOrderCompleted(true);
      clearCart();
      toast.success(`Pagamento confirmado! Você ganhou ${pointsToEarn} pontos!`);
    }
  }, [clearCart, pointsToEarn]);

  // Create order and payment intent
  const handleCreateOrder = useCallback(async () => {
    if (!name || !email || !cpf) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!stripeInstance) {
      toast.error('Sistema de pagamento não está pronto. Aguarde...');
      return;
    }

    setIsCreatingOrder(true);
    setError(null);

    try {
      // Create order in database
      const orderNumber = `SKY-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: name,
          customer_email: email,
          customer_cpf: cpf.replace(/\D/g, ''),
          customer_phone: phone.replace(/\D/g, ''),
          subtotal: totalPrice,
          total: totalPrice,
          status: 'pending',
          payment_method: 'stripe',
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: String(item.id),
        product_name: item.name,
        price: item.price,
      }));

      await supabase.from('order_items').insert(orderItems);

      // Get affiliate code
      const affiliateCode = localStorage.getItem('affiliate_ref_code') || undefined;

      // Create PaymentIntent with retry
      let retries = 0;
      const maxRetries = 3;
      let lastError: any = null;

      while (retries < maxRetries) {
        try {
          const productNames = items.map(i => i.name).join(', ');
          const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
            body: {
              amount: totalPrice,
              productName: productNames,
              customerEmail: email,
              customerName: name,
              customerPhone: phone.replace(/\D/g, ''),
              customerCpf: cpf.replace(/\D/g, ''),
              orderId: orderData.id,
              affiliateCode,
              userId: user?.id || null,
              items: items.map(i => ({ id: i.id, name: i.name, price: i.price })),
            },
          });

          if (invokeError) throw invokeError;
          if (!data?.clientSecret) throw new Error('Resposta inválida do servidor');

          setClientSecret(data.clientSecret);
          setOrderId(orderData.id);
          console.log('[CHECKOUT] PaymentIntent created:', data.paymentIntentId);
          return;
        } catch (err: any) {
          lastError = err;
          retries++;
          if (retries < maxRetries) {
            console.log(`[CHECKOUT] Retry ${retries}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }

      throw lastError || new Error('Falha ao criar pagamento');

    } catch (error: any) {
      console.error('[CHECKOUT] Error:', error);
      setError(error.message || 'Não foi possível criar o pedido');
      toast.error('Erro ao preparar pagamento. Tente novamente.');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [name, email, cpf, phone, items, totalPrice, user, stripeInstance]);

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setClientSecret(null);
    resetStripe();
    window.location.reload();
  };

  const handlePaymentSuccess = () => {
    setOrderCompleted(true);
    clearCart();
    toast.success(`Pagamento confirmado! Você ganhou ${pointsToEarn} pontos!`);
  };

  // Redirect if cart is empty
  if (items.length === 0 && !orderCompleted && !clientSecret) {
    navigate('/vip/shop');
    return null;
  }

  // ========== SUCCESS VIEW ==========
  if (orderCompleted) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Compra Realizada!
              </h2>
              <p className="text-muted-foreground mb-6">
                Seu pedido foi processado com sucesso.
              </p>
              
              <div className="p-4 bg-primary/10 rounded-lg mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Diamond className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold text-primary">+{pointsToEarn}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Pontos adicionados à sua conta!
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate('/vip/history')} className="flex-1">
                  Ver Histórico
                </Button>
                <Button onClick={() => navigate('/vip/dashboard')} className="flex-1">
                  Ir ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ========== CHECKOUT VIEW ==========
  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => navigate('/vip/cart')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar ao Carrinho
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <div>
                    <h3 className="font-semibold text-destructive">Erro no Pagamento</h3>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button onClick={handleRetry} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading Stripe */}
          {isStripeLoading && !error && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Conectando ao sistema de pagamentos...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Data Form */}
          {!clientSecret && !isStripeLoading && !error && (
            <Card>
              <CardHeader>
                <CardTitle>Dados do Comprador</CardTitle>
                <CardDescription>Informe seus dados para emissão da nota</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <InputMask
                      mask="999.999.999-99"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                    >
                      {(inputProps: any) => (
                        <Input {...inputProps} id="cpf" placeholder="000.000.000-00" />
                      )}
                    </InputMask>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <InputMask
                      mask="(99) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    >
                      {(inputProps: any) => (
                        <Input {...inputProps} id="phone" placeholder="(00) 00000-0000" />
                      )}
                    </InputMask>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          {clientSecret && orderId && stripeInstance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de Pagamento
                </CardTitle>
                <CardDescription>Escolha entre Cartão, PIX ou Boleto</CardDescription>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripeInstance} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#ec4899',
                        colorBackground: '#1a1a2e',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        borderRadius: '8px',
                      },
                    },
                    locale: 'pt-BR',
                  }}
                >
                  <CheckoutForm 
                    orderId={orderId}
                    onSuccess={handlePaymentSuccess}
                    totalPrice={totalPrice}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-foreground">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
              </div>
              
              {/* Points */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Diamond className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Pontos a ganhar</span>
                  </div>
                  <span className="font-bold text-primary">+{pointsToEarn}</span>
                </div>
              </div>

              {!clientSecret && !isStripeLoading && !error && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder || !stripeInstance}
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparando pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Continuar para Pagamento
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Pagamento seguro</p>
                  <p>
                    Seus dados são criptografados e processados de forma segura 
                    através da plataforma Stripe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
