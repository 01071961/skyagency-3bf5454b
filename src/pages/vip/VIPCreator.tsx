import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Package, 
  Plus, 
  Edit, 
  Eye, 
  TrendingUp,
  DollarSign,
  Users,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Settings,
  Calendar,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';

interface CreatorProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: string;
  cover_image_url?: string;
  creator_commission_rate: number;
  created_at: string;
}

interface CreatorPayout {
  id: string;
  order_id: string;
  gross_amount: number;
  creator_amount: number;
  platform_amount: number;
  affiliate_amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  order?: {
    order_number: string;
    customer_email: string;
    customer_name: string;
  };
  product?: {
    name: string;
  };
}

interface CreatorStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  pendingPayout: number;
  paidPayout: number;
  isCreator: boolean;
  tier: string;
  canBeCreator: boolean;
  creatorCommissionRate: number;
  platformCommissionRate: number;
  affiliateCommissionRate: number;
}

const tierLabels: Record<string, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  silver: 'Prata',
  ouro: 'Ouro',
  gold: 'Ouro',
  platinum: 'Platinum',
  platina: 'Platinum',
  diamond: 'Diamante',
  diamante: 'Diamante'
};

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-600',
  prata: 'bg-gray-400',
  silver: 'bg-gray-400',
  ouro: 'bg-yellow-500',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500',
  platina: 'bg-purple-500',
  diamond: 'bg-cyan-500',
  diamante: 'bg-cyan-500'
};

export default function VIPCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [stats, setStats] = useState<CreatorStats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingPayout: 0,
    paidPayout: 0,
    isCreator: false,
    tier: 'bronze',
    canBeCreator: false,
    creatorCommissionRate: 70,
    platformCommissionRate: 20,
    affiliateCommissionRate: 10
  });
  const [activatingCreator, setActivatingCreator] = useState(false);

  // Check for activation success
  useEffect(() => {
    if (searchParams.get('activated') === 'true') {
      toast({
        title: "🎉 Modo Creator Ativado!",
        description: "Você agora pode criar e vender seus próprios produtos!",
      });
      // Clean URL
      window.history.replaceState({}, '', '/vip/creator');
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (user) {
      loadCreatorData();
    }
  }, [user]);

  const loadCreatorData = async () => {
    try {
      // Buscar dados do afiliado
      const { data: affiliate, error: affError } = await supabase
        .from('vip_affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      console.log('[VIPCreator] Affiliate data:', affiliate);

      if (affError || !affiliate) {
        console.log('[VIPCreator] No affiliate found, redirecting');
        navigate('/vip');
        return;
      }

      // Verificar se pode ser creator - normalizar tier para lowercase
      const tierLower = (affiliate.tier || 'bronze').toLowerCase();
      const isGoldOrHigher = ['ouro', 'gold', 'platinum', 'platina', 'diamond', 'diamante'].includes(tierLower);
      
      console.log('[VIPCreator] Tier check:', { tier: affiliate.tier, tierLower, isGoldOrHigher });
      
      // Verificar se tem assinatura ativa de creator
      const { data: subscription, error: subError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      console.log('[VIPCreator] Creator subscription:', subscription, subError);

      // Determinar acesso ao Creator
      const hasActiveSubscription = !!subscription && subscription.status === 'active';
      const canBeCreator = affiliate.is_creator || isGoldOrHigher || hasActiveSubscription;

      console.log('[VIPCreator] Access check:', { 
        isCreator: affiliate.is_creator, 
        isGoldOrHigher, 
        hasActiveSubscription, 
        canBeCreator 
      });

      // Buscar produtos do creator
      const { data: creatorProducts } = await supabase
        .from('products')
        .select('id, name, slug, price, status, cover_image_url, creator_commission_rate, created_at')
        .eq('creator_id', affiliate.id)
        .order('created_at', { ascending: false });

      // Buscar payouts com informações do pedido
      const { data: creatorPayouts } = await supabase
        .from('creator_payouts')
        .select(`
          *,
          order:order_id(order_number, customer_email, customer_name),
          product:product_id(name)
        `)
        .eq('creator_id', affiliate.id)
        .order('created_at', { ascending: false });

      const totalRevenue = creatorPayouts?.reduce((sum, p) => sum + (p.creator_amount || 0), 0) || 0;
      const pendingPayout = creatorPayouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.creator_amount || 0), 0) || 0;
      const paidPayout = creatorPayouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.creator_amount || 0), 0) || 0;

      setStats({
        totalProducts: creatorProducts?.length || 0,
        totalSales: creatorPayouts?.length || 0,
        totalRevenue,
        pendingPayout,
        paidPayout,
        isCreator: affiliate.is_creator || false,
        tier: affiliate.tier || 'bronze',
        canBeCreator,
        creatorCommissionRate: affiliate.creator_commission_rate || 70,
        platformCommissionRate: affiliate.platform_commission_rate || 20,
        affiliateCommissionRate: affiliate.affiliate_commission_rate || 10
      });

      setProducts(creatorProducts?.map(p => ({
        ...p,
        creator_commission_rate: p.creator_commission_rate || 70
      })) || []);

      setPayouts(creatorPayouts || []);

    } catch (error) {
      console.error('Error loading creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateCreator = async () => {
    setActivatingCreator(true);
    try {
      const { data: affiliate } = await supabase
        .from('vip_affiliates')
        .select('id, tier')
        .eq('user_id', user?.id)
        .single();

      if (!affiliate) {
        throw new Error('Afiliado não encontrado');
      }

      const tierLower = (affiliate.tier || 'bronze').toLowerCase();
      const isGoldOrHigher = ['ouro', 'gold', 'platinum', 'platina', 'diamond', 'diamante'].includes(tierLower);

      console.log('[VIPCreator] Activating creator:', { tier: affiliate.tier, tierLower, isGoldOrHigher });

      if (isGoldOrHigher) {
        // Ativar gratuitamente para Ouro+
        const { error } = await supabase
          .from('vip_affiliates')
          .update({ 
            is_creator: true, 
            creator_enabled_at: new Date().toISOString() 
          })
          .eq('id', affiliate.id);

        if (error) throw error;

        toast({
          title: "🎉 Modo Creator Ativado!",
          description: "Você agora pode criar e vender seus próprios produtos!",
        });

        loadCreatorData();
      } else {
        // Redirecionar para pagamento
        navigate('/vip/creator-upgrade');
      }
    } catch (error: any) {
      console.error('[VIPCreator] Error activating:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível ativar o modo Creator",
        variant: "destructive"
      });
    } finally {
      setActivatingCreator(false);
    }
  };

  const copyProductLink = async (product: CreatorProduct) => {
    const link = `${window.location.origin}/produto/${product.slug}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(product.id);
    toast({ title: "Link copiado!", description: "Link do produto copiado para a área de transferência" });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não é creator e não pode ser
  if (!stats.isCreator && !stats.canBeCreator) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Modo Creator Bloqueado</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Para criar e vender seus próprios produtos na plataforma Sky Brasil, você precisa atingir o nível <strong>Ouro</strong> ou superior, ou assinar o plano Creator.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge className={`${tierColors[stats.tier]} text-white`}>
                Seu nível: {tierLabels[stats.tier] || stats.tier}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge className="bg-yellow-500 text-white">
                Necessário: Ouro
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/vip/performance')} variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver como subir de nível
              </Button>
              <Button onClick={() => navigate('/vip/creator-upgrade')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Assinar Plano Creator - R$ 97/mês
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se pode ser creator mas ainda não ativou
  if (!stats.isCreator && stats.canBeCreator) {
    return (
      <div className="space-y-6">
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-12 text-center">
            <Unlock className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ative o Modo Creator!</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Parabéns! Como VIP nível <strong>{tierLabels[stats.tier] || stats.tier}</strong>, você tem acesso gratuito ao modo Creator. Ative agora e comece a vender seus produtos!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-background/80 rounded-lg p-4">
                <Package className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-medium">Crie Produtos</p>
                <p className="text-sm text-muted-foreground">Cursos, ebooks, mentorias</p>
              </div>
              <div className="bg-background/80 rounded-lg p-4">
                <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="font-medium">Ganhe até 70%</p>
                <p className="text-sm text-muted-foreground">Comissão configurável</p>
              </div>
              <div className="bg-background/80 rounded-lg p-4">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="font-medium">Rede de Afiliados</p>
                <p className="text-sm text-muted-foreground">Outros VIPs vendem para você</p>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={activateCreator}
              disabled={activatingCreator}
            >
              {activatingCreator ? (
                <>Ativando...</>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Ativar Modo Creator Gratuitamente
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard do Creator ativo
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Painel do Creator
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e acompanhe suas vendas
          </p>
        </div>
        <Button onClick={() => navigate('/vip/creator/new-product')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Produtos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
                <p className="text-sm text-muted-foreground">Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Receita Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.pendingPayout)}</p>
                <p className="text-sm text-muted-foreground">A Receber</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.paidPayout)}</p>
                <p className="text-sm text-muted-foreground">Já Recebido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products & Sales */}
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Meus Produtos ({products.length})</TabsTrigger>
          <TabsTrigger value="sales">Histórico de Vendas ({payouts.length})</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {products.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro produto e comece a vender!
                </p>
                <Button onClick={() => navigate('/vip/creator/new-product')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Produto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.cover_image_url ? (
                            <img 
                              src={product.cover_image_url} 
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(product.price)} • {product.creator_commission_rate}% comissão
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Criado em {new Date(product.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                          {product.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyProductLink(product)}
                          >
                            {copiedLink === product.id ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/vip/creator/edit/${product.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/produto/${product.slug}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>Todas as vendas dos seus produtos</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma venda ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Quando você fizer vendas, elas aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Sua Comissão</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(payout.created_at)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payout.order?.order_number || payout.order_id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {payout.product?.name || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {payout.order?.customer_name || payout.order?.customer_email || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payout.gross_amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(payout.creator_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payout.status === 'paid' ? 'default' : 'secondary'}>
                              {payout.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Creator</CardTitle>
              <CardDescription>Configure suas comissões padrão e dados de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-green-500/10 border-green-500/20">
                  <p className="text-sm text-muted-foreground">Sua Comissão</p>
                  <p className="text-2xl font-bold text-green-500">{stats.creatorCommissionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Valor que você recebe</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Taxa Sky Brasil</p>
                  <p className="text-2xl font-bold">{stats.platformCommissionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Taxa da plataforma</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-500/10 border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Afiliado</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.affiliateCommissionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Pago a quem indicar</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Como funciona a distribuição?</h4>
                <p className="text-sm text-muted-foreground">
                  Quando você vender um produto de R$ 100,00, você recebe R$ {stats.creatorCommissionRate.toFixed(0)},00, 
                  a Sky Brasil recebe R$ {stats.platformCommissionRate.toFixed(0)},00 e o afiliado que indicou recebe R$ {stats.affiliateCommissionRate.toFixed(0)},00.
                  Se não houver afiliado, a comissão dele fica com você!
                </p>
              </div>
              
              <Button variant="outline" onClick={() => navigate('/vip/profile')}>
                <Settings className="h-4 w-4 mr-2" />
                Editar Dados de Pagamento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
