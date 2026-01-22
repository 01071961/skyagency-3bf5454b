import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  History, Diamond, ArrowUp, ArrowDown, Gift,
  ShoppingCart, Users, Filter, Calendar, Download,
  FileText, CreditCard, ExternalLink, Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  order_id: string | null;
}

interface Redemption {
  id: string;
  reward_name: string;
  points_spent: number;
  status: string;
  payout_method: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount_total: number;
  currency: string;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  description: string;
}

interface Charge {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  paid: boolean;
  description: string;
  receipt_url: string | null;
  payment_method_type: string;
}

type FilterType = 'all' | 'earn' | 'spend' | 'redeem';

export default function VIPHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/history');
      return;
    }

    if (user) {
      loadHistory();
    }
  }, [user, authLoading, navigate]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        console.log('[VIPHistory] Sem token de autenticação');
        navigate('/auth?redirect=/vip/history');
        return;
      }

      // Load transactions
      const { data: transData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(transData || []);

      // Load redemptions
      const { data: redeemData } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards:reward_id (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setRedemptions(
        (redeemData || []).map((r: any) => ({
          ...r,
          reward_name: r.rewards?.name || 'Recompensa',
        }))
      );

      // Load orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setOrders(orderData || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoices = useCallback(async () => {
    if (invoices.length > 0 || invoicesLoading) return;
    
    try {
      setInvoicesLoading(true);
      const { data, error } = await supabase.functions.invoke('list-invoices');
      
      if (error) {
        console.error('Erro ao carregar faturas:', error);
        return;
      }
      
      setInvoices(data?.invoices || []);
      setCharges(data?.charges || []);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoices.length, invoicesLoading]);

  const formatCurrency = (amount: number, currency: string = 'brl') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'open':
        return <Badge variant="secondary">Aberto</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'void':
      case 'uncollectible':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'spend':
      case 'redeem':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-purple-500" />;
      case 'referral':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Diamond className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground">
            Acompanhe suas transações, pedidos e resgates
          </p>
        </div>
      </div>

      <Tabs defaultValue="points" className="space-y-6" onValueChange={(value) => {
        if (value === 'invoices') {
          loadInvoices();
        }
      }}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Diamond className="h-4 w-4" />
            Pontos
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Resgates
          </TabsTrigger>
        </TabsList>

        {/* Points History */}
        <TabsContent value="points">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Extrato de Pontos
              </CardTitle>
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="earn">Ganhos</SelectItem>
                  <SelectItem value="spend">Gastos</SelectItem>
                  <SelectItem value="redeem">Resgates</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Saldo: {transaction.balance_after}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders History */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Meus Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Pedido #{order.order_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(order.status)}
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            R$ {order.total.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.payment_method || 'Cartão'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                  <Button className="mt-4" onClick={() => navigate('/vip/shop')}>
                    Ir à Loja
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices History */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Faturas e Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-muted-foreground">Carregando faturas...</div>
                </div>
              ) : invoices.length > 0 || charges.length > 0 ? (
                <div className="space-y-3">
                  {/* Invoices */}
                  {invoices.map((invoice, index) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {invoice.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.number ? `Fatura #${invoice.number}` : 'Fatura'} • {format(new Date(invoice.created * 1000), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getInvoiceStatusBadge(invoice.status)}
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {formatCurrency(invoice.amount_total, invoice.currency)}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {invoice.hosted_invoice_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            )}
                            {invoice.invoice_pdf && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* One-time charges */}
                  {charges.map((charge, index) => (
                    <motion.div
                      key={charge.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (invoices.length + index) * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {charge.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {charge.payment_method_type?.toUpperCase() || 'Cartão'} • {format(new Date(charge.created * 1000), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={charge.paid ? 'bg-green-500' : 'bg-yellow-500'}>
                          {charge.paid ? 'Pago' : 'Pendente'}
                        </Badge>
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {formatCurrency(charge.amount, charge.currency)}
                          </p>
                          {charge.receipt_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs mt-1"
                              onClick={() => window.open(charge.receipt_url!, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Recibo
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Suas faturas aparecerão aqui após realizar uma compra
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemptions History */}
        <TabsContent value="redemptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Meus Resgates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {redemptions.length > 0 ? (
                <div className="space-y-3">
                  {redemptions.map((redemption, index) => (
                    <motion.div
                      key={redemption.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                          <Gift className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {redemption.reward_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(redemption.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(redemption.status)}
                        <div className="text-right">
                          <p className="font-bold text-red-500">
                            -{redemption.points_spent} pts
                          </p>
                          {redemption.payout_method && (
                            <p className="text-sm text-muted-foreground">
                              via {redemption.payout_method.toUpperCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum resgate encontrado</p>
                  <Button className="mt-4" onClick={() => navigate('/vip/rewards')}>
                    Ver Recompensas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
