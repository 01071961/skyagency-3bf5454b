import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Users, ShoppingCart, 
  Calendar, ArrowUpRight, ArrowDownRight, Eye,
  Target, Award, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PerformanceMetrics {
  totalEarnings: number;
  monthlyEarnings: number;
  totalReferrals: number;
  monthlyReferrals: number;
  conversionRate: number;
  averageOrderValue: number;
  pendingCommissions: number;
  paidCommissions: number;
}

interface DailyData {
  date: string;
  earnings: number;
  referrals: number;
}

interface Commission {
  id: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e'];

export default function VIPPerformance() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('30d');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/performance');
      return;
    }

    if (user) {
      loadPerformanceData();
    }
  }, [user, authLoading, navigate, period]);

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);

      // Get affiliate data
      const { data: affiliateData } = await supabase
        .from('vip_affiliates')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'approved')
        .single();

      if (!affiliateData) {
        navigate('/vip/referrals');
        return;
      }

      setAffiliate(affiliateData);

      // Calculate date range
      let startDate: Date;
      const endDate = new Date();
      
      if (period === '7d') {
        startDate = subDays(endDate, 7);
      } else if (period === '30d') {
        startDate = subDays(endDate, 30);
      } else {
        startDate = startOfMonth(endDate);
      }

      // Get referrals
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('referrer_id', affiliateData.id);

      // Get commissions
      const { data: commissionsData } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false });

      setCommissions(commissionsData || []);

      // Calculate metrics
      const monthStart = startOfMonth(endDate);
      const monthlyCommissions = (commissionsData || []).filter(
        c => new Date(c.created_at) >= monthStart
      );
      const monthlyReferrals = (referrals || []).filter(
        r => new Date(r.created_at) >= monthStart
      );

      const totalEarnings = (commissionsData || []).reduce(
        (sum, c) => sum + (c.status !== 'cancelled' ? c.commission_amount : 0), 0
      );
      const monthlyEarnings = monthlyCommissions.reduce(
        (sum, c) => sum + (c.status !== 'cancelled' ? c.commission_amount : 0), 0
      );
      const pendingCommissions = (commissionsData || [])
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const paidCommissions = (commissionsData || [])
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      const convertedReferrals = (referrals || []).filter(r => r.status === 'converted').length;
      const conversionRate = referrals?.length 
        ? (convertedReferrals / referrals.length) * 100 
        : 0;

      const averageOrderValue = convertedReferrals > 0
        ? (commissionsData || []).reduce((sum, c) => sum + c.order_total, 0) / convertedReferrals
        : 0;

      setMetrics({
        totalEarnings,
        monthlyEarnings,
        totalReferrals: referrals?.length || 0,
        monthlyReferrals: monthlyReferrals.length,
        conversionRate,
        averageOrderValue,
        pendingCommissions,
        paidCommissions,
      });

      // Generate daily data for chart
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyStats = days.map(day => {
        const dayCommissions = (commissionsData || []).filter(c => {
          const commissionDate = new Date(c.created_at);
          return commissionDate.toDateString() === day.toDateString();
        });
        const dayReferrals = (referrals || []).filter(r => {
          const refDate = new Date(r.created_at);
          return refDate.toDateString() === day.toDateString();
        });

        return {
          date: format(day, 'dd/MM', { locale: ptBR }),
          earnings: dayCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
          referrals: dayReferrals.length,
        };
      });

      setDailyData(dailyStats);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!affiliate?.id) return;

    const channel = supabase
      .channel('affiliate-performance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'affiliate_commissions',
          filter: `affiliate_id=eq.${affiliate.id}`,
        },
        () => {
          loadPerformanceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [affiliate?.id]);

  if (authLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando métricas...</div>
      </div>
    );
  }

  if (!affiliate || !metrics) {
    return null;
  }

  const pieData = [
    { name: 'Pendente', value: metrics.pendingCommissions },
    { name: 'Pago', value: metrics.paidCommissions },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Performance</h1>
          <p className="text-muted-foreground">
            Acompanhe suas vendas e comissões em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={period === '7d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            7 dias
          </Button>
          <Button 
            variant={period === '30d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 dias
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Este mês
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ganhos do Mês</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {metrics.monthlyEarnings.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {metrics.monthlyEarnings > 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">Em crescimento</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem vendas ainda</span>
                    )}
                  </div>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-foreground">
                    {metrics.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    De {metrics.totalReferrals} indicados
                  </p>
                </div>
                <Target className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-background border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {metrics.averageOrderValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por venda convertida
                  </p>
                </div>
                <ShoppingCart className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-background border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Acumulado</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {metrics.totalEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desde o início
                  </p>
                </div>
                <Award className="h-10 w-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Ganhos
            </CardTitle>
            <CardDescription>
              Acompanhe sua performance diária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Ganhos']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    dot={{ fill: '#ec4899' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Commission Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Comissões</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: R$${value.toFixed(0)}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sem comissões registradas
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ec4899]" />
                <span className="text-sm text-muted-foreground">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                <span className="text-sm text-muted-foreground">Pago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Últimas Comissões
          </CardTitle>
          <CardDescription>
            Atualizações em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor da Venda</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Comissão</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.slice(0, 10).map((commission) => (
                    <tr key={commission.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-foreground">
                        {format(new Date(commission.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        R$ {commission.order_total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-green-500">
                        +R$ {commission.commission_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                          {commission.status === 'paid' ? 'Pago' : 
                           commission.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma comissão ainda</p>
              <p className="text-sm">Compartilhe seu link para começar a ganhar!</p>
              <Button 
                onClick={() => navigate('/vip/referrals')} 
                variant="outline" 
                className="mt-4"
              >
                Ver Link de Indicação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
