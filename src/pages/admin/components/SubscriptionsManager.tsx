import { useState, useEffect } from 'react';
import { 
  Crown, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard,
  Calendar,
  User,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreatorSubscription {
  id: string;
  affiliate_id: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  price_monthly: number | null;
  created_at: string;
  affiliate?: {
    user_id: string;
    referral_code: string;
    tier: string;
    is_creator: boolean;
    profiles?: {
      email: string;
      name: string;
    };
  };
}

interface GeneralSubscription {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  gateway_subscription_id: string | null;
  created_at: string;
  profile?: {
    email: string;
    name: string;
  };
}

interface Stats {
  totalCreatorSubs: number;
  activeCreatorSubs: number;
  totalGeneralSubs: number;
  activeGeneralSubs: number;
  monthlyRecurringRevenue: number;
}

export default function SubscriptionsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatorSubs, setCreatorSubs] = useState<CreatorSubscription[]>([]);
  const [generalSubs, setGeneralSubs] = useState<GeneralSubscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCreatorSubs: 0,
    activeCreatorSubs: 0,
    totalGeneralSubs: 0,
    activeGeneralSubs: 0,
    monthlyRecurringRevenue: 0
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      // Load Creator subscriptions with affiliate info
      const { data: creatorData, error: creatorError } = await supabase
        .from('creator_subscriptions')
        .select(`
          *,
          affiliate:affiliate_id(
            user_id, 
            referral_code, 
            tier, 
            is_creator
          )
        `)
        .order('created_at', { ascending: false });

      if (creatorError) {
        console.error('Error loading creator subscriptions:', creatorError);
      }

      // Get profile info for creator subscriptions
      const creatorWithProfiles = await Promise.all(
        (creatorData || []).map(async (sub) => {
          if (sub.affiliate?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('user_id', sub.affiliate.user_id)
              .single();
            return { 
              ...sub, 
              affiliate: { 
                ...sub.affiliate, 
                profiles: profile 
              } 
            };
          }
          return sub;
        })
      );

      // Load general subscriptions
      const { data: generalData, error: generalError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (generalError) {
        console.error('Error loading general subscriptions:', generalError);
      }

      // Get profile info for general subscriptions
      const generalWithProfiles = await Promise.all(
        (generalData || []).map(async (sub) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('user_id', sub.user_id)
            .single();
          return { ...sub, profile };
        })
      );

      setCreatorSubs(creatorWithProfiles as CreatorSubscription[]);
      setGeneralSubs(generalWithProfiles);

      // Calculate stats
      const activeCreatorCount = (creatorData || []).filter(s => s.status === 'active').length;
      const activeGeneralCount = (generalData || []).filter(s => s.status === 'active').length;
      const creatorMRR = activeCreatorCount * 97; // R$97/month
      
      setStats({
        totalCreatorSubs: (creatorData || []).length,
        activeCreatorSubs: activeCreatorCount,
        totalGeneralSubs: (generalData || []).length,
        activeGeneralSubs: activeGeneralCount,
        monthlyRecurringRevenue: creatorMRR
      });

    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptions = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    toast({ title: "Assinaturas atualizadas!", description: "Dados sincronizados com o banco" });
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Ativa</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" />Atrasada</Badge>;
      case 'canceled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Gestão de Assinaturas
          </h2>
          <p className="text-muted-foreground">
            Acompanhe todas as assinaturas ativas e histórico de pagamentos
          </p>
        </div>
        <Button onClick={refreshSubscriptions} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeCreatorSubs}</p>
                <p className="text-sm text-muted-foreground">Creators Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeGeneralSubs}</p>
                <p className="text-sm text-muted-foreground">Assinaturas Gerais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</p>
                <p className="text-sm text-muted-foreground">MRR (Creator)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCreatorSubs + stats.totalGeneralSubs}</p>
                <p className="text-sm text-muted-foreground">Total de Assinaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="creator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="creator">
            <Crown className="h-4 w-4 mr-2" />
            Assinaturas Creator ({creatorSubs.length})
          </TabsTrigger>
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            Assinaturas Gerais ({generalSubs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creator">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Creator</CardTitle>
              <CardDescription>
                VIPs que pagam R$ 97/mês para acessar o modo Creator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creatorSubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma assinatura Creator encontrada</p>
                  <p className="text-sm">VIPs nível Ouro+ têm acesso gratuito</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Próxima Cobrança</TableHead>
                      <TableHead>Stripe ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creatorSubs.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.affiliate?.profiles?.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{sub.affiliate?.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 rounded">
                            {sub.affiliate?.referral_code || '-'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.affiliate?.tier || '-'}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>{formatCurrency(sub.price_monthly || 97)}/mês</TableCell>
                        <TableCell>{formatDate(sub.current_period_end)}</TableCell>
                        <TableCell>
                          {sub.stripe_subscription_id ? (
                            <a 
                              href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {sub.stripe_subscription_id.slice(0, 15)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Gerais</CardTitle>
              <CardDescription>
                Outras assinaturas de produtos e serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generalSubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma assinatura geral encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Cancelar no fim?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generalSubs.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.profile?.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{sub.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sub.product_id}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>{formatDate(sub.current_period_start)}</TableCell>
                        <TableCell>{formatDate(sub.current_period_end)}</TableCell>
                        <TableCell>
                          {sub.cancel_at_period_end ? (
                            <Badge variant="destructive">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
