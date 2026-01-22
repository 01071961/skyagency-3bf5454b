import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle, ArrowLeft, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';

interface AffiliateData {
  id: string;
  status: string;
  referral_code: string;
}

export default function VIPAffiliatePayment() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);

  const fetchAffiliateData = async () => {
    if (!user) return;

    try {
      const { data: affiliate, error } = await supabase
        .from('vip_affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !affiliate) {
        navigate('/vip/affiliate/register');
        return;
      }

      setAffiliateData(affiliate);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/affiliate/payment');
      return;
    }

    if (user) {
      fetchAffiliateData();
    }
  }, [user, authLoading, navigate]);

  // Realtime to update affiliate status
  useEffect(() => {
    if (!affiliateData?.id) return;

    const channel = supabase
      .channel(`affiliate-${affiliateData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vip_affiliates',
          filter: `id=eq.${affiliateData.id}`,
        },
        (payload) => {
          setAffiliateData(payload.new as AffiliateData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [affiliateData?.id]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // If already approved
  if (affiliateData?.status === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/vip/dashboard')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Você já é um Afiliado!</h2>
              <p className="text-muted-foreground mb-4">
                Seu cadastro de afiliado está ativo. Compartilhe seu código e comece a ganhar comissões!
              </p>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Seu código de indicação:</p>
                <p className="text-2xl font-bold text-primary">{affiliateData?.referral_code}</p>
              </div>
              <Button onClick={() => navigate('/vip/referrals')} className="w-full">
                Ver Minhas Indicações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending or awaiting approval
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/vip/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Aguardando Aprovação</h2>
              <p className="text-muted-foreground mb-4">
                Sua solicitação de afiliado está em análise. Você será notificado quando for aprovado.
              </p>
              <Badge variant="secondary" className="text-sm mb-6">
                Status: {affiliateData?.status === 'pending' ? 'Pendente' : affiliateData?.status === 'rejected' ? 'Rejeitado' : affiliateData?.status}
              </Badge>

              {affiliateData?.status === 'rejected' && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Sua solicitação foi rejeitada. Entre em contato com o suporte para mais informações.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
