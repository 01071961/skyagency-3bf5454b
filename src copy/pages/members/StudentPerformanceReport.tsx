import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Star,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  BookOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAIInsights } from '@/hooks/useAIInsights';

interface PerformanceData {
  attempts: any[];
  enrollments: any[];
  lessonProgress: any[];
}

interface TopicAnalysis {
  topic: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

export default function StudentPerformanceReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');
  
  // AI Insights Hook
  const { loading: aiLoading, analysis, analyzePerformance, generateAdvancedInsights } = useAIInsights();

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, selectedCourse, timeRange]);

  const fetchPerformanceData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const startDate = subDays(new Date(), parseInt(timeRange));

      // Fetch quiz attempts
      const { data: attempts } = await supabase
        .from('lesson_quiz_attempts')
        .select(`
          *,
          product_lessons!inner(
            id,
            title,
            product_modules!inner(
              id,
              title,
              product_id,
              products(id, name)
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          products(id, name)
        `)
        .eq('user_id', user.id);

      // Fetch lesson progress
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select(`
          *,
          product_lessons!inner(
            id,
            title,
            product_modules!inner(product_id)
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      setData({
        attempts: attempts || [],
        enrollments: enrollments || [],
        lessonProgress: lessonProgress || []
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (!data) return null;

    const { attempts, enrollments, lessonProgress } = data;
    const filteredAttempts = selectedCourse === 'all' 
      ? attempts 
      : attempts.filter((a: any) => a.product_lessons?.product_modules?.product_id === selectedCourse);

    const totalAttempts = filteredAttempts.length;
    const passedAttempts = filteredAttempts.filter((a: any) => a.passed).length;
    const avgScore = totalAttempts > 0 
      ? filteredAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalAttempts 
      : 0;
    const avgTime = totalAttempts > 0 
      ? filteredAttempts.reduce((sum: number, a: any) => sum + (a.time_spent_seconds || 0), 0) / totalAttempts 
      : 0;

    // Calculate trend (compare last 7 days to previous 7 days)
    const last7Days = filteredAttempts.filter((a: any) => 
      new Date(a.created_at) >= subDays(new Date(), 7)
    );
    const prev7Days = filteredAttempts.filter((a: any) => {
      const date = new Date(a.created_at);
      return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
    });

    const last7Avg = last7Days.length > 0 
      ? last7Days.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / last7Days.length 
      : 0;
    const prev7Avg = prev7Days.length > 0 
      ? prev7Days.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / prev7Days.length 
      : 0;
    
    const trend = last7Avg > prev7Avg ? 'up' : last7Avg < prev7Avg ? 'down' : 'stable';
    const trendValue = prev7Avg > 0 ? ((last7Avg - prev7Avg) / prev7Avg) * 100 : 0;

    return {
      totalAttempts,
      passedAttempts,
      avgScore: Math.round(avgScore),
      avgTime: Math.round(avgTime / 60),
      passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      trend,
      trendValue: Math.abs(Math.round(trendValue)),
      totalLessons: lessonProgress.length,
      completedLessons: lessonProgress.filter((l: any) => l.completed).length
    };
  };

  // Generate evolution chart data
  const getEvolutionData = () => {
    if (!data) return [];

    const { attempts } = data;
    const filteredAttempts = selectedCourse === 'all' 
      ? attempts 
      : attempts.filter((a: any) => a.product_lessons?.product_modules?.product_id === selectedCourse);

    // Group by date
    const grouped = filteredAttempts.reduce((acc: any, attempt: any) => {
      const date = format(new Date(attempt.created_at), 'dd/MM', { locale: ptBR });
      if (!acc[date]) {
        acc[date] = { date, scores: [], count: 0 };
      }
      acc[date].scores.push(attempt.score || 0);
      acc[date].count++;
      return acc;
    }, {});

    return Object.values(grouped).map((day: any) => ({
      date: day.date,
      media: Math.round(day.scores.reduce((a: number, b: number) => a + b, 0) / day.scores.length),
      tentativas: day.count
    }));
  };

  // Analyze strengths and weaknesses by topic
  const analyzeTopics = (): TopicAnalysis[] => {
    if (!data) return [];

    const { attempts } = data;
    const topicStats: Record<string, { correct: number; total: number; recent: number[]; }> = {};

    attempts.forEach((attempt: any) => {
      const lessonTitle = attempt.product_lessons?.title || 'Geral';
      if (!topicStats[lessonTitle]) {
        topicStats[lessonTitle] = { correct: 0, total: 0, recent: [] };
      }
      
      const questionsAnswered = attempt.total_questions || 0;
      const correctAnswers = attempt.correct_answers || 0;
      
      topicStats[lessonTitle].total += questionsAnswered;
      topicStats[lessonTitle].correct += correctAnswers;
      topicStats[lessonTitle].recent.push(attempt.score || 0);
    });

    return Object.entries(topicStats).map(([topic, stats]) => {
      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      const recentScores = stats.recent.slice(-5);
      const avgRecent = recentScores.length > 0 
        ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length 
        : 0;
      const trend = avgRecent > percentage ? 'up' : avgRecent < percentage ? 'down' : 'stable';

      return {
        topic,
        totalQuestions: stats.total,
        correct: stats.correct,
        incorrect: stats.total - stats.correct,
        percentage,
        trend: trend as 'up' | 'down' | 'stable'
      };
    }).sort((a, b) => b.totalQuestions - a.totalQuestions);
  };

  // Get radar chart data for skill analysis
  const getSkillRadarData = () => {
    const topics = analyzeTopics().slice(0, 6);
    return topics.map(t => ({
      subject: t.topic.length > 15 ? t.topic.substring(0, 15) + '...' : t.topic,
      score: t.percentage,
      fullMark: 100
    }));
  };

  // Get time distribution data
  const getTimeDistribution = () => {
    if (!data) return [];

    const { attempts } = data;
    const timeRanges = [
      { name: '< 5 min', min: 0, max: 300, count: 0 },
      { name: '5-10 min', min: 300, max: 600, count: 0 },
      { name: '10-20 min', min: 600, max: 1200, count: 0 },
      { name: '20-30 min', min: 1200, max: 1800, count: 0 },
      { name: '> 30 min', min: 1800, max: Infinity, count: 0 }
    ];

    attempts.forEach((a: any) => {
      const time = a.time_spent_seconds || 0;
      const range = timeRanges.find(r => time >= r.min && time < r.max);
      if (range) range.count++;
    });

    return timeRanges.map(r => ({
      name: r.name,
      quantidade: r.count
    }));
  };

  const metrics = calculateMetrics();
  const evolutionData = getEvolutionData();
  const topicAnalysis = analyzeTopics();
  const radarData = getSkillRadarData();
  const timeDistribution = getTimeDistribution();
  
  const strengths = topicAnalysis.filter(t => t.percentage >= 70).slice(0, 5);
  const weaknesses = topicAnalysis.filter(t => t.percentage < 70).sort((a, b) => a.percentage - b.percentage).slice(0, 5);

  // Trigger AI analysis when data changes
  useEffect(() => {
    if (metrics && data) {
      analyzePerformance({
        attempts: data.attempts,
        strengths: strengths.map(s => ({ topic: s.topic, percentage: s.percentage })),
        weaknesses: weaknesses.map(w => ({ topic: w.topic, percentage: w.percentage })),
        avgScore: metrics.avgScore,
        passRate: metrics.passRate,
        totalAttempts: metrics.totalAttempts,
        trend: metrics.trend as 'up' | 'down' | 'stable'
      });
    }
  }, [data, selectedCourse, timeRange]);
  
  // Generate advanced insights on mount
  useEffect(() => {
    if (user) {
      generateAdvancedInsights(user.id);
    }
  }, [user]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Relatório de Desempenho
          </h1>
          <p className="text-muted-foreground">
            Acompanhe sua evolução e identifique áreas para melhorar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os cursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {data?.enrollments.map((e: any) => (
                <SelectItem key={e.product_id} value={e.product_id}>
                  {e.products?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nota Média</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{metrics?.avgScore || 0}%</span>
                  {metrics?.trend === 'up' && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {metrics?.trendValue}%
                    </Badge>
                  )}
                  {metrics?.trend === 'down' && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      {metrics?.trendValue}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                metrics?.avgScore && metrics.avgScore >= 70 ? "bg-green-500/10" : "bg-amber-500/10"
              )}>
                <Target className={cn(
                  "w-6 h-6",
                  metrics?.avgScore && metrics.avgScore >= 70 ? "text-green-500" : "text-amber-500"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                <span className="text-3xl font-bold">{metrics?.passRate || 0}%</span>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Award className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quizzes Realizados</p>
                <span className="text-3xl font-bold">{metrics?.totalAttempts || 0}</span>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Brain className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <span className="text-3xl font-bold">{metrics?.avgTime || 0} min</span>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="topics">Por Tópico</TabsTrigger>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
        </TabsList>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução das Notas
              </CardTitle>
              <CardDescription>
                Acompanhe sua progressão ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="media" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Média"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultado dos Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Aprovados', value: metrics?.passedAttempts || 0 },
                        { name: 'Reprovados', value: (metrics?.totalAttempts || 0) - (metrics?.passedAttempts || 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <Star className="w-5 h-5" />
                  Pontos Fortes
                </CardTitle>
                <CardDescription>
                  Tópicos onde você tem melhor desempenho
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {strengths.length > 0 ? strengths.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">{topic.topic}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          {topic.percentage}%
                        </Badge>
                        {topic.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                    <Progress value={topic.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {topic.correct} acertos de {topic.totalQuestions} questões
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete mais quizzes para ver seus pontos fortes
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                  Áreas para Melhorar
                </CardTitle>
                <CardDescription>
                  Tópicos que precisam de mais atenção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {weaknesses.length > 0 ? weaknesses.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">{topic.topic}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          {topic.percentage}%
                        </Badge>
                        {topic.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    <Progress value={topic.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {topic.incorrect} erros de {topic.totalQuestions} questões
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Excelente! Nenhuma área crítica identificada
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desempenho por Tópico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicAnalysis.map((topic, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{topic.topic}</span>
                        <span className="text-sm text-muted-foreground">
                          {topic.correct}/{topic.totalQuestions}
                        </span>
                      </div>
                      <Progress value={topic.percentage} className="h-2" />
                    </div>
                    <Badge className={cn(
                      "w-16 justify-center",
                      topic.percentage >= 70 ? "bg-green-500" : 
                      topic.percentage >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}>
                      {topic.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Mapa de Habilidades
              </CardTitle>
              <CardDescription>
                Visão geral das suas competências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar 
                    name="Desempenho" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.5} 
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {/* AI-Generated Insights */}
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                    Análise com Inteligência Artificial
                  </CardTitle>
                  <CardDescription>
                    Insights personalizados baseados no seu histórico de desempenho
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => user && generateAdvancedInsights(user.id)}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : analysis?.insights && analysis.insights.length > 0 ? (
                <>
                  {analysis.insights.map((insight, index) => {
                    const bgColors = {
                      warning: 'bg-amber-500/10 border-amber-500/30',
                      weakness: 'bg-red-500/10 border-red-500/30',
                      strength: 'bg-green-500/10 border-green-500/30',
                      tip: 'bg-blue-500/10 border-blue-500/30',
                      recommendation: 'bg-purple-500/10 border-purple-500/30'
                    };
                    const iconColors = {
                      warning: 'text-amber-500',
                      weakness: 'text-red-500',
                      strength: 'text-green-500',
                      tip: 'text-blue-500',
                      recommendation: 'text-purple-500'
                    };
                    const icons = {
                      warning: AlertTriangle,
                      weakness: XCircle,
                      strength: CheckCircle,
                      tip: Lightbulb,
                      recommendation: Target
                    };
                    const Icon = icons[insight.type];
                    
                    return (
                      <div 
                        key={index} 
                        className={cn("p-4 rounded-lg border", bgColors[insight.type])}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={cn("w-5 h-5 mt-0.5", iconColors[insight.type])} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge 
                                variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Study Plan Section */}
                  {analysis.studyPlan && analysis.studyPlan.length > 0 && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mt-6">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Plano de Estudos Recomendado
                      </h4>
                      <ul className="space-y-2">
                        {analysis.studyPlan.map((step, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Prediction Section */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">Próxima Nota Prevista</p>
                      <p className="text-2xl font-bold text-primary">{analysis.predictedScore}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">Próximo Foco</p>
                      <p className="text-lg font-medium">{analysis.nextBestTopic}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Complete mais quizzes para receber insights personalizados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legacy Static Insights */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Recomendações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics && metrics.avgScore < 60 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-600">Revise o Material</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sua média está abaixo de 60%. Recomendamos revisar as aulas antes de tentar os quizzes novamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {weaknesses.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-600">Foco Recomendado</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Dedique mais tempo ao tópico "{weaknesses[0]?.topic}" onde você tem apenas {weaknesses[0]?.percentage}% de acertos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metrics && metrics.trend === 'up' && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-600">Excelente Progresso!</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Suas notas aumentaram {metrics.trendValue}% nos últimos 7 dias. Continue assim!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {strengths.length > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary">Ponto Forte Identificado</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Você tem excelente desempenho em "{strengths[0]?.topic}" com {strengths[0]?.percentage}% de acertos!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
