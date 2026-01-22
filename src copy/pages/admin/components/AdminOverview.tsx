import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, Users, TrendingUp, Clock, CheckCircle, RefreshCw, Loader2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSystemHealth } from '@/hooks/useSystemHealth';

interface Stats {
  totalMessages: number;
  unreadMessages: number;
  totalEmails: number;
  recentActivity: number;
  totalConversations: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
}

interface TrendData {
  date: string;
  label: string;
  contacts: number;
  conversations: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

const AdminOverview = () => {
  const { services, isChecking, runHealthCheck, lastUpdate } = useSystemHealth();
  
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    unreadMessages: 0,
    totalEmails: 0,
    recentActivity: 0,
    totalConversations: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<'7' | '30'>('7');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [
        { count: totalMessages },
        { count: unreadMessages },
        { count: totalEmails },
        { count: totalConversations },
        { count: totalUsers },
        { count: totalProducts },
        { count: totalOrders },
      ] = await Promise.all([
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).is('read_at', null),
        supabase.from('email_logs').select('*', { count: 'exact', head: true }),
        supabase.from('chat_conversations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentActivity } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      setStats({
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        totalEmails: totalEmails || 0,
        recentActivity: recentActivity || 0,
        totalConversations: totalConversations || 0,
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      // Fetch admin emails from admin_emails table
      const { data: adminEmails } = await supabase
        .from('admin_emails')
        .select('email, name, is_active')
        .eq('is_active', true);

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get profiles for admin users
      const adminUsers: AdminUser[] = [];
      
      if (adminEmails) {
        for (const admin of adminEmails) {
          adminUsers.push({
            id: admin.email,
            email: admin.email,
            name: admin.name || admin.email.split('@')[0],
            role: 'admin',
          });
        }
      }

      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchAdmins(), fetchTrendData()]);
    toast.success('Dados atualizados!');
    setIsRefreshing(false);
  };

  const fetchTrendData = useCallback(async () => {
    setLoadingTrend(true);
    try {
      const days = parseInt(trendPeriod);
      const startDate = startOfDay(subDays(new Date(), days - 1));
      const endDate = new Date();
      
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Fetch contacts
      const { data: contacts } = await supabase
        .from('contact_submissions')
        .select('created_at')
        .gte('created_at', startDate.toISOString());
      
      // Fetch conversations
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('created_at')
        .gte('created_at', startDate.toISOString());
      
      // Group by day
      const dataByDay: Record<string, { contacts: number; conversations: number }> = {};
      
      dateRange.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        dataByDay[key] = { contacts: 0, conversations: 0 };
      });
      
      contacts?.forEach(c => {
        const key = format(new Date(c.created_at), 'yyyy-MM-dd');
        if (dataByDay[key]) dataByDay[key].contacts++;
      });
      
      conversations?.forEach(c => {
        const key = format(new Date(c.created_at), 'yyyy-MM-dd');
        if (dataByDay[key]) dataByDay[key].conversations++;
      });
      
      const trend: TrendData[] = dateRange.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        label: format(date, 'dd/MM', { locale: ptBR }),
        contacts: dataByDay[format(date, 'yyyy-MM-dd')]?.contacts || 0,
        conversations: dataByDay[format(date, 'yyyy-MM-dd')]?.conversations || 0,
      }));
      
      setTrendData(trend);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoadingTrend(false);
    }
  }, [trendPeriod]);

  useEffect(() => {
    fetchStats();
    fetchAdmins();
  }, [fetchStats, fetchAdmins]);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const statCards = [
    {
      title: 'Mensagens Totais',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'from-primary to-pink-500',
      description: 'Total de contatos recebidos',
    },
    {
      title: 'Não Lidas',
      value: stats.unreadMessages,
      icon: Clock,
      color: 'from-secondary to-blue-500',
      description: 'Aguardando resposta',
    },
    {
      title: 'E-mails Enviados',
      value: stats.totalEmails,
      icon: Mail,
      color: 'from-accent to-orange-500',
      description: 'Total de e-mails enviados',
    },
    {
      title: 'Conversas Chat',
      value: stats.totalConversations,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      description: 'Total de conversas no chat',
    },
  ];

  const chartConfig = {
    contacts: { label: 'Contatos', color: 'hsl(var(--primary))' },
    conversations: { label: 'Conversas', color: 'hsl(var(--secondary))' },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo ao painel administrativo do SKY BRASIL
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sincronizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {isLoading ? '...' : card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tendência de Contatos
            </CardTitle>
            <Tabs value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as '7' | '30')}>
              <TabsList className="h-8">
                <TabsTrigger value="7" className="text-xs px-2">7 dias</TabsTrigger>
                <TabsTrigger value="30" className="text-xs px-2">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={trendPeriod === '30' ? 4 : 0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    width={30}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="contacts" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorContacts)" 
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary" />
              Conversas por Dia
            </CardTitle>
            <Tabs value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as '7' | '30')}>
              <TabsList className="h-8">
                <TabsTrigger value="7" className="text-xs px-2">7 dias</TabsTrigger>
                <TabsTrigger value="30" className="text-xs px-2">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={trendPeriod === '30' ? 4 : 0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    width={30}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="conversations" 
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Status do Sistema
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={runHealthCheck}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => {
                const statusColors = {
                  operational: 'text-green-500',
                  degraded: 'text-yellow-500',
                  down: 'text-red-500',
                  maintenance: 'text-blue-500'
                };
                const statusLabels = {
                  operational: 'Operacional',
                  degraded: 'Degradado',
                  down: 'Fora do ar',
                  maintenance: 'Manutenção'
                };
                const serviceLabels: Record<string, string> = {
                  backend: 'Backend',
                  database: 'Banco de Dados',
                  email_api: 'API de E-mail',
                  payment_api: 'API de Pagamento',
                  storage: 'Armazenamento',
                  edge_functions: 'Edge Functions'
                };
                
                return (
                  <div key={service.service_name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">{serviceLabels[service.service_name] || service.service_name}</span>
                    <div className="flex items-center gap-2">
                      {service.response_time_ms && (
                        <span className="text-xs text-muted-foreground">{service.response_time_ms}ms</span>
                      )}
                      <span className={`flex items-center gap-2 ${statusColors[service.status]} text-sm`}>
                        <span className={`w-2 h-2 rounded-full ${service.status === 'operational' ? 'bg-green-500 animate-pulse' : service.status === 'degraded' ? 'bg-yellow-500' : service.status === 'down' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        {statusLabels[service.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
              {lastUpdate && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Última verificação: {format(lastUpdate, 'HH:mm:ss', { locale: ptBR })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Administradores ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admins.length > 0 ? (
                admins.map((admin, index) => (
                  <div key={admin.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-10 h-10 bg-gradient-to-br ${index % 2 === 0 ? 'from-primary to-secondary' : 'from-secondary to-primary'} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-sm font-bold">
                        {admin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum administrador configurado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
