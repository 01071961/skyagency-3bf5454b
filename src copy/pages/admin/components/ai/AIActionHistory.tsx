import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Check, X, AlertTriangle, Trash2, Mail, MessageSquare, Brain, Settings, Database, RefreshCw, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: any;
  created_at: string;
  admin_id: string | null;
}

const actionIcons: Record<string, any> = {
  ai_delete: Trash2,
  ai_send: Mail,
  ai_create: Check,
  ai_update: Settings,
  ai_close: X,
  ai_bulk: Database,
  ai_resolve: Check,
  default: Brain
};

const actionColors: Record<string, string> = {
  delete: 'text-red-500 bg-red-500/10',
  create: 'text-green-500 bg-green-500/10',
  update: 'text-blue-500 bg-blue-500/10',
  send: 'text-purple-500 bg-purple-500/10',
  close: 'text-yellow-500 bg-yellow-500/10',
  bulk: 'text-orange-500 bg-orange-500/10',
  resolve: 'text-cyan-500 bg-cyan-500/10'
};

const getActionIcon = (action: string) => {
  const key = Object.keys(actionIcons).find(k => action.includes(k));
  return actionIcons[key || 'default'];
};

const getActionColor = (action: string) => {
  const key = Object.keys(actionColors).find(k => action.includes(k));
  return actionColors[key] || 'text-muted-foreground bg-muted';
};

const formatAction = (action: string) => {
  return action
    .replace('ai_', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatTable = (table: string | null) => {
  const tableNames: Record<string, string> = {
    chat_messages: 'Mensagens',
    chat_conversations: 'Conversas',
    contact_submissions: 'Contatos',
    email_templates: 'Templates',
    email_campaigns: 'Campanhas',
    ai_learnings: 'Aprendizados IA',
    ai_mode_config: 'Modos IA',
    ai_feedback: 'Feedbacks IA',
    esp_configurations: 'Configs ESP'
  };
  return tableNames[table || ''] || table || 'Sistema';
};

export default function AIActionHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .ilike('action', 'ai_%')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter !== 'all') {
        query = query.ilike('action', `%${filter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, limit]);

  const stats = {
    total: logs.length,
    deletes: logs.filter(l => l.action.includes('delete')).length,
    creates: logs.filter(l => l.action.includes('create')).length,
    updates: logs.filter(l => l.action.includes('update')).length,
    sends: logs.filter(l => l.action.includes('send')).length
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Ações Executadas pela IA</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mt-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <p className="text-lg font-bold text-green-500">{stats.creates}</p>
            <p className="text-xs text-muted-foreground">Criações</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <p className="text-lg font-bold text-blue-500">{stats.updates}</p>
            <p className="text-xs text-muted-foreground">Atualizações</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <p className="text-lg font-bold text-red-500">{stats.deletes}</p>
            <p className="text-xs text-muted-foreground">Deleções</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-500/10">
            <p className="text-lg font-bold text-purple-500">{stats.sends}</p>
            <p className="text-xs text-muted-foreground">Envios</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="delete">Deleções</SelectItem>
              <SelectItem value="create">Criações</SelectItem>
              <SelectItem value="update">Atualizações</SelectItem>
              <SelectItem value="send">Envios</SelectItem>
              <SelectItem value="learning">Aprendizado IA</SelectItem>
              <SelectItem value="mode">Modos IA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-3">
          <AnimatePresence mode="popLayout">
            {logs.length === 0 && !loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma ação executada pela IA ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => {
                  const Icon = getActionIcon(log.action);
                  const colorClass = getActionColor(log.action);
                  const isDestructive = log.action.includes('delete') || log.action.includes('bulk');

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-3 rounded-lg border ${isDestructive ? 'border-red-500/20 bg-red-500/5' : 'border-border/50 bg-card'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{formatAction(log.action)}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatTable(log.target_table)}
                            </Badge>
                            {isDestructive && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Destrutiva
                              </Badge>
                            )}
                          </div>
                          
                          {log.target_id && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                              ID: {log.target_id}
                            </p>
                          )}
                          
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                              <pre className="whitespace-pre-wrap overflow-hidden text-muted-foreground">
                                {JSON.stringify(log.details, null, 2).substring(0, 200)}
                                {JSON.stringify(log.details, null, 2).length > 200 && '...'}
                              </pre>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
