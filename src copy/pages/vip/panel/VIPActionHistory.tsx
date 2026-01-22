import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History, Users, ShoppingBag, Target, TrendingUp,
  Zap, ChevronRight, Gift, Trophy, ArrowLeft, Filter,
  Calendar, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';

const actionConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  new_affiliate: { icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Novo Afiliado' },
  sale: { icon: ShoppingBag, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Venda' },
  monthly_goal: { icon: Target, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Meta Mensal' },
  tier_upgrade: { icon: TrendingUp, color: 'text-violet-500', bgColor: 'bg-violet-500/10', label: 'Subida de Nível' },
  event: { icon: Zap, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Evento' },
  share: { icon: ChevronRight, color: 'text-slate-500', bgColor: 'bg-slate-500/10', label: 'Compartilhamento' },
  first_sale: { icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Primeira Venda' },
  referral_bonus: { icon: Gift, color: 'text-pink-500', bgColor: 'bg-pink-500/10', label: 'Bônus de Indicação' },
  milestone: { icon: Trophy, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Marco Atingido' }
};

interface Action {
  id: string;
  action_type: string;
  points_earned: number;
  description: string | null;
  created_at: string;
  metadata: any;
}

export default function VIPActionHistory() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [actions, setActions] = useState<Action[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/vip/panel/history');
      return;
    }
    if (user) {
      loadActions();
    }
  }, [user, authLoading, filter]);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('vip_affiliate_actions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('action_type', filter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setActions(data || []);
      setTotalPoints(data?.reduce((sum, a) => sum + a.points_earned, 0) || 0);
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const groupActionsByDate = (actions: Action[]) => {
    const grouped: Record<string, Action[]> = {};
    actions.forEach(action => {
      const date = new Date(action.created_at).toLocaleDateString('pt-BR');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(action);
    });
    return grouped;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const groupedActions = groupActionsByDate(actions);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/vip/panel')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <History className="h-7 w-7 text-primary" />
              Histórico de Ações
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe todas as suas atividades e pontos ganhos
            </p>
          </div>

          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total de Pontos</p>
                <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-wrap gap-4"
      >
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(actionConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Actions List */}
      {Object.keys(groupedActions).length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma ação encontrada</h3>
            <p className="text-muted-foreground">
              Suas atividades aparecerão aqui conforme você interage com o programa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActions).map(([date, dayActions], groupIndex) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {dayActions.map((action, index) => {
                  const config = actionConfig[action.action_type] || actionConfig.share;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${config.bgColor}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{config.label}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  +{action.points_earned} pts
                                </Badge>
                              </div>
                              {action.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(action.created_at)}
                              </p>
                            </div>
                            <div className={`text-lg font-bold ${config.color}`}>
                              +{action.points_earned}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
