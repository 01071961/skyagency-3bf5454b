import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Search, Download, Eye, ShoppingBag, 
  BookOpen, Mail, Phone, Calendar, RefreshCw, 
  FileSpreadsheet, DollarSign, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Customer {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  user_metadata: {
    name?: string;
    phone?: string;
  };
}

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  [key: string]: any; // Allow additional fields from database
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  user_id: string | null;
  order_items: { product_name: string; price: number }[];
}

interface Enrollment {
  id: string;
  product_id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
  expires_at: string | null;
  product: { name: string; product_type: string } | null;
}

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerEnrollments, setCustomerEnrollments] = useState<Enrollment[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load orders with customer info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(product_name, price)')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetails = async (userId: string) => {
    setDetailsLoading(true);
    try {
      // Load enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('*, product:products(name, product_type)')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      setCustomerEnrollments(enrollmentsData || []);

      // Load orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(product_name, price)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setCustomerOrders(ordersData || []);

    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object') return JSON.stringify(value);
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Arquivo exportado com sucesso!');
  };

  const exportCustomers = () => {
    const exportData = profiles.map(p => ({
      ID: p.id,
      Nome: p.name || '',
      Email: p.email || '',
      Telefone: p.phone || '',
      'Data Cadastro': p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
    }));
    exportToCSV(exportData, 'clientes');
  };

  const exportOrders = () => {
    const exportData = orders.map(o => ({
      'Número Pedido': o.order_number,
      Cliente: o.customer_name,
      Email: o.customer_email,
      Telefone: o.customer_phone || '',
      Total: `R$ ${o.total.toFixed(2)}`,
      Status: o.status,
      'Data Criação': format(new Date(o.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      'Data Pagamento': o.paid_at ? format(new Date(o.paid_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
      Produtos: o.order_items?.map(i => i.product_name).join('; ') || '',
    }));
    exportToCSV(exportData, 'pedidos');
  };

  // Get unique customers from orders (for guests without profile)
  const uniqueCustomers = orders.reduce((acc, order) => {
    const key = order.customer_email.toLowerCase();
    if (!acc.has(key)) {
      acc.set(key, {
        email: order.customer_email,
        name: order.customer_name,
        phone: order.customer_phone,
        user_id: order.user_id,
        orders: [order],
        totalSpent: order.status === 'paid' ? order.total : 0,
        firstOrder: order.created_at,
      });
    } else {
      const existing = acc.get(key)!;
      existing.orders.push(order);
      if (order.status === 'paid') {
        existing.totalSpent += order.total;
      }
      if (new Date(order.created_at) < new Date(existing.firstOrder)) {
        existing.firstOrder = order.created_at;
      }
      if (!existing.user_id && order.user_id) {
        existing.user_id = order.user_id;
      }
    }
    return acc;
  }, new Map<string, any>());

  const allCustomers = Array.from(uniqueCustomers.values());

  const filteredCustomers = allCustomers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const stats = {
    totalCustomers: allCustomers.length,
    registeredUsers: profiles.length,
    totalOrders: orders.length,
    paidOrders: orders.filter(o => o.status === 'paid').length,
    totalRevenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0),
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      paid: { label: 'Pago', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      failed: { label: 'Falhou', variant: 'destructive' },
      refunded: { label: 'Reembolsado', variant: 'outline' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gerenciamento de Clientes
          </h1>
          <p className="text-muted-foreground">Visualize e gerencie todos os cadastros e pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportCustomers}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Clientes
          </Button>
          <Button variant="outline" onClick={exportOrders}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Pedidos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.registeredUsers}</p>
                <p className="text-xs text-muted-foreground">Usuários Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.paidOrders}</p>
                <p className="text-xs text-muted-foreground">Pedidos Pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Receita Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, email ou telefone..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">Clientes ({filteredCustomers.length})</TabsTrigger>
          <TabsTrigger value="orders">Pedidos ({orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Primeiro Pedido</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {customer.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium">{customer.name || 'Sem nome'}</p>
                              {customer.user_id && (
                                <Badge variant="outline" className="text-xs">Cadastrado</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.orders.length}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          R$ {customer.totalSpent.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(customer.firstOrder)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer.email);
                                  if (customer.user_id) {
                                    loadCustomerDetails(customer.user_id);
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Cliente: {customer.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{customer.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Telefone</p>
                                    <p className="font-medium">{customer.phone || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                                    <p className="font-medium">{customer.orders.length}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Total Gasto</p>
                                    <p className="font-medium text-green-600">R$ {customer.totalSpent.toFixed(2)}</p>
                                  </div>
                                </div>

                                {/* Orders */}
                                <div>
                                  <h3 className="font-semibold mb-2">Pedidos</h3>
                                  <div className="space-y-2">
                                    {customer.orders.map((order: Order) => (
                                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div>
                                          <p className="font-medium">#{order.order_number}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {order.order_items?.map(i => i.product_name).join(', ')}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">R$ {order.total.toFixed(2)}</p>
                                          {getStatusBadge(order.status)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Enrollments (if user is registered) */}
                                {customer.user_id && customerEnrollments.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-2">Matrículas</h3>
                                    <div className="space-y-2">
                                      {customerEnrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                          <div>
                                            <p className="font-medium">{enrollment.product?.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {enrollment.product?.product_type}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-medium">{enrollment.progress_percent}% concluído</p>
                                            <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                                              {enrollment.status}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">#{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {order.order_items?.map((item, i) => (
                              <p key={i} className="text-sm truncate">{item.product_name}</p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(order.created_at)}</p>
                            {order.paid_at && (
                              <p className="text-xs text-green-600">
                                Pago: {formatDate(order.paid_at)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
