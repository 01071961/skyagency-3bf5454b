import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Check, 
  ArrowLeft,
  Package,
  DollarSign,
  Users,
  Zap,
  Shield,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';

const features = [
  {
    icon: Package,
    title: 'Crie Produtos Ilimitados',
    description: 'Cursos, ebooks, mentorias, templates e muito mais'
  },
  {
    icon: DollarSign,
    title: 'Ganhe até 90% de Comissão',
    description: 'Configure sua margem de lucro como preferir'
  },
  {
    icon: Users,
    title: 'Rede de Afiliados',
    description: 'Milhares de VIPs podem promover seus produtos'
  },
  {
    icon: Zap,
    title: 'Pagamentos via Stripe',
    description: 'Receba automaticamente na sua conta'
  },
  {
    icon: Shield,
    title: 'Hospedagem Segura',
    description: 'Seus conteúdos protegidos na plataforma Sky'
  },
  {
    icon: Star,
    title: 'Suporte Prioritário',
    description: 'Atendimento exclusivo para creators'
  }
];

export default function VIPCreatorUpgrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Usar a nova edge function de assinatura creator
      const { data, error } = await supabase.functions.invoke('creator-subscription-checkout', {});

      if (error) throw error;

      // Se foi ativado gratuitamente (Ouro+)
      if (data?.activated) {
        toast({
          title: "🎉 Modo Creator Ativado!",
          description: data.message || "Você agora pode criar e vender seus próprios produtos!",
        });
        navigate('/vip/creator');
        return;
      }

      // Se precisa pagar, redireciona para o Stripe
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar o checkout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vip/creator')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Upgrade para Creator</h1>
          <p className="text-muted-foreground">
            Desbloqueie o poder de criar e vender seus próprios produtos
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Benefícios */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">O que você ganha:</h2>
          
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Card de Preço */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10 sticky top-4">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Plano Creator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">R$ 97</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cancele quando quiser
                  </p>
                </div>

                <ul className="space-y-3">
                  {[
                    'Produtos ilimitados',
                    'Comissões configuráveis (50-90%)',
                    'Rede de afiliados Sky Brasil',
                    'Pagamentos automáticos via Stripe',
                    'Dashboard de vendas completo',
                    'Suporte prioritário',
                    'Sem taxa por venda adicional'
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Assinar Agora
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Pagamento seguro via Stripe. Seus dados estão protegidos.
                </p>

                <div className="pt-4 border-t">
                  <p className="text-sm text-center text-muted-foreground">
                    <strong>Dica:</strong> VIPs nível Ouro ou superior têm acesso gratuito!{' '}
                    <button 
                      onClick={() => navigate('/vip/performance')}
                      className="text-primary underline"
                    >
                      Ver como subir de nível
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
