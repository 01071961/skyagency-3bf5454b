import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Brain, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown, 
  Target, AlertCircle, CheckCircle, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIMetricsDashboardProps {
  feedback: Array<{
    id: string;
    rating: number;
    resolved: boolean;
    created_at: string;
    comment?: string | null;
  }>;
  conversations: Array<{
    current_mode?: string;
    ai_confidence?: number;
    escalation_reason?: string;
    rating?: number;
    status: string;
    created_at: string;
  }>;
  learnings: Array<{
    pattern: string;
    category: string;
    success_score: number;
    fail_score: number;
    is_active: boolean;
  }>;
}

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

const modeLabels: Record<string, string> = {
  support: 'Suporte',
  sales: 'Vendas',
  marketing: 'Marketing',
  handoff_human: 'Humano',
};

export function AIMetricsDashboard({ feedback, conversations, learnings }: AIMetricsDashboardProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const positiveCount = feedback.filter(f => f.rating === 1).length;
    const negativeCount = feedback.filter(f => f.rating === -1).length;
    const totalFeedback = positiveCount + negativeCount;
    const satisfactionRate = totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;

    // Confidence distribution
    const confidenceData = conversations
      .filter(c => c.ai_confidence != null)
      .reduce((acc, c) => {
        const range = Math.floor((c.ai_confidence! * 100) / 10) * 10;
        const label = `${range}-${range + 10}%`;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Mode distribution
    const modeData = conversations.reduce((acc, c) => {
      if (c.current_mode) {
        acc[c.current_mode] = (acc[c.current_mode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Escalation rate
    const escalatedCount = conversations.filter(c => c.escalation_reason).length;
    const escalationRate = conversations.length > 0 ? (escalatedCount / conversations.length) * 100 : 0;

    // Average confidence
    const confidences = conversations.filter(c => c.ai_confidence != null).map(c => c.ai_confidence!);
    const avgConfidence = confidences.length > 0 
      ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100 
      : 0;

    // Feedback over time (last 7 days)
    const feedbackByDay = feedback.reduce((acc, f) => {
      const date = new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!acc[date]) {
        acc[date] = { positive: 0, negative: 0 };
      }
      if (f.rating === 1) acc[date].positive++;
      else if (f.rating === -1) acc[date].negative++;
      return acc;
    }, {} as Record<string, { positive: number; negative: number }>);

    // Learning patterns by category
    const patternsByCategory = learnings.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      positiveCount,
      negativeCount,
      totalFeedback,
      satisfactionRate,
      confidenceData: Object.entries(confidenceData).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)),
      modeData: Object.entries(modeData).map(([name, value]) => ({ name: modeLabels[name] || name, value })),
      escalationRate,
      avgConfidence,
      feedbackByDay: Object.entries(feedbackByDay).map(([date, data]) => ({ date, ...data })).slice(-7),
      patternsByCategory: Object.entries(patternsByCategory).map(([name, value]) => ({ name, value })),
      totalLearnings: learnings.length,
      activeLearnings: learnings.filter(l => l.is_active).length,
    };
  }, [feedback, conversations, learnings]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confiança Média</p>
                  <p className="text-2xl font-bold">{metrics.avgConfidence.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Satisfação</p>
                  <p className="text-2xl font-bold">{metrics.satisfactionRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Escalonamento</p>
                  <p className="text-2xl font-bold">{metrics.escalationRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversas Analisadas</p>
                  <p className="text-2xl font-bold">{conversations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Distribuição de Confiança
            </CardTitle>
            <CardDescription>
              Níveis de confiança da IA nas respostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.confidenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Conversas"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados de confiança disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mode Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              Distribuição por Modo
            </CardTitle>
            <CardDescription>
              Modos da IA utilizados nas conversas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.modeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.modeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.modeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados de modo disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Feedback ao Longo do Tempo
          </CardTitle>
          <CardDescription>
            Avaliações positivas e negativas dos últimos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.feedbackByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.feedbackByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="positive" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                  name="Positivo"
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                  name="Negativo"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Sem dados de feedback disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patterns by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Padrões por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição de padrões aprendidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.patternsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.patternsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="Padrões"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sem padrões categorizados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              Resumo de Aprendizado
            </CardTitle>
            <CardDescription>
              Estatísticas de padrões aprendidos pela IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Total de Padrões</span>
              </div>
              <Badge variant="secondary">{metrics.totalLearnings}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Padrões Ativos</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {metrics.activeLearnings}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Feedbacks Positivos</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {metrics.positiveCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-500" />
                <span className="text-sm">Feedbacks Negativos</span>
              </div>
              <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                {metrics.negativeCount}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
