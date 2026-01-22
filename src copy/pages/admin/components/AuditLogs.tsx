import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, User, Clock, Filter, RefreshCw, Download, Shield, 
  AlertTriangle, CheckCircle, XCircle, Search, Calendar,
  ChevronDown, Eye, Lock, Unlock, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
}

interface ComplianceStats {
  totalActions: number;
  sensitiveActions: number;
  failedActions: number;
  uniqueAdmins: number;
  lastActivity: string | null;
}

const SENSITIVE_ACTIONS = ['delete', 'DELETE', 'update_role', 'export', 'access_pii'];
const LGPD_ACTIONS = ['data_export', 'data_deletion', 'consent_update', 'anonymize'];

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState<ComplianceStats>({
    totalActions: 0,
    sensitiveActions: 0,
    failedActions: 0,
    uniqueAdmins: 0,
    lastActivity: null
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
      
      // Calculate stats
      const uniqueAdmins = new Set(data?.map(l => l.admin_id).filter(Boolean)).size;
      const sensitiveCount = data?.filter(l => 
        SENSITIVE_ACTIONS.some(sa => l.action.toLowerCase().includes(sa.toLowerCase()))
      ).length || 0;
      
      setStats({
        totalActions: data?.length || 0,
        sensitiveActions: sensitiveCount,
        failedActions: data?.filter(l => l.action.includes('fail') || l.action.includes('error')).length || 0,
        uniqueAdmins,
        lastActivity: data?.[0]?.created_at || null
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = logs;
    
    // Date filter
    if (dateFilter !== 'all') {
      const daysAgo = subDays(new Date(), parseInt(dateFilter));
      result = result.filter(log => isAfter(parseISO(log.created_at), daysAgo));
    }
    
    // Action filter
    if (actionFilter !== 'all') {
      if (actionFilter === 'sensitive') {
        result = result.filter(log => 
          SENSITIVE_ACTIONS.some(sa => log.action.toLowerCase().includes(sa.toLowerCase()))
        );
      } else if (actionFilter === 'lgpd') {
        result = result.filter(log => 
          LGPD_ACTIONS.some(la => log.action.toLowerCase().includes(la.toLowerCase()))
        );
      } else {
        result = result.filter(log => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
      }
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.action.toLowerCase().includes(term) ||
        log.target_table?.toLowerCase().includes(term) ||
        log.ip_address?.toLowerCase().includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }
    
    setFilteredLogs(result);
  }, [logs, searchTerm, actionFilter, dateFilter]);

  const exportLogs = (exportFormat: 'csv' | 'json') => {
    const dataToExport = filteredLogs.map(log => ({
      id: log.id,
      action: log.action,
      target_table: log.target_table,
      target_id: log.target_id,
      admin_id: log.admin_id,
      ip_address: log.ip_address,
      created_at: log.created_at,
      details: JSON.stringify(log.details)
    }));

    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === 'csv') {
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const rows = dataToExport.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      content = [headers, ...rows].join('\n');
      filename = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(dataToExport, null, 2);
      filename = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Logs exportados em ${exportFormat.toUpperCase()}`);
  };

  const getActionBadge = (action: string) => {
    const isSensitive = SENSITIVE_ACTIONS.some(sa => action.toLowerCase().includes(sa.toLowerCase()));
    const isLGPD = LGPD_ACTIONS.some(la => action.toLowerCase().includes(la.toLowerCase()));
    
    if (isSensitive) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
          <AlertTriangle className="w-3 h-3" />
          {action}
        </Badge>
      );
    }
    if (isLGPD) {
      return (
        <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 gap-1">
          <Shield className="w-3 h-3" />
          {action}
        </Badge>
      );
    }
    if (action.includes('delete') || action.includes('DELETE')) {
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">{action}</Badge>;
    }
    if (action.includes('update') || action.includes('UPDATE') || action.includes('edit')) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">{action}</Badge>;
    }
    if (action.includes('create') || action.includes('INSERT') || action.includes('add')) {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">{action}</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Logs de Auditoria
          </h1>
          <p className="text-muted-foreground mt-2">
            Histórico completo de ações administrativas • LGPD Compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportLogs('csv')}>
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLogs('json')}>
                Exportar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalActions}</p>
                <p className="text-xs text-muted-foreground">Total de ações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.sensitiveActions}</p>
                <p className="text-xs text-muted-foreground">Ações sensíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.uniqueAdmins}</p>
                <p className="text-xs text-muted-foreground">Admins ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm font-bold">
                  {stats.lastActivity 
                    ? format(parseISO(stats.lastActivity), 'HH:mm', { locale: ptBR })
                    : '--:--'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Última atividade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ação, tabela, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="sensitive">🔴 Ações sensíveis</SelectItem>
                <SelectItem value="lgpd">🟣 LGPD</SelectItem>
                <SelectItem value="create">🟢 Criação</SelectItem>
                <SelectItem value="update">🟡 Atualização</SelectItem>
                <SelectItem value="delete">🔴 Exclusão</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Últimas 24h</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <span>Mostrando {filteredLogs.length} de {logs.length} registros</span>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajuste os filtros ou aguarde novas ações.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getActionBadge(log.action)}
                          {log.target_table && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.target_table}
                            </Badge>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {JSON.stringify(log.details).slice(0, 80)}...
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes do Log
            </DialogTitle>
            <DialogDescription>
              Informações completas da ação registrada
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ação</p>
                  {getActionBadge(selectedLog.action)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tabela alvo</p>
                  <Badge variant="outline" className="font-mono">
                    {selectedLog.target_table || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID do registro</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {selectedLog.target_id || 'N/A'}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Endereço IP</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {selectedLog.ip_address || 'N/A'}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admin ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                    {selectedLog.admin_id || 'Sistema'}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data/Hora</p>
                  <span className="text-sm">
                    {format(parseISO(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Detalhes (JSON)</p>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2) || 'Sem detalhes'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;
