import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIInsight {
  type: 'strength' | 'weakness' | 'tip' | 'recommendation' | 'warning';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon?: string;
}

export interface PerformanceAnalysis {
  insights: AIInsight[];
  studyPlan: string[];
  predictedScore: number;
  nextBestTopic: string;
  generatedAt: string;
}

export function useAIInsights() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const { toast } = useToast();

  const analyzePerformance = useCallback(async (performanceData: {
    attempts: any[];
    strengths: { topic: string; percentage: number }[];
    weaknesses: { topic: string; percentage: number }[];
    avgScore: number;
    passRate: number;
    totalAttempts: number;
    trend: 'up' | 'down' | 'stable';
  }) => {
    setLoading(true);
    
    try {
      const { attempts, strengths, weaknesses, avgScore, passRate, totalAttempts, trend } = performanceData;
      
      // Generate insights based on data analysis
      const insights: AIInsight[] = [];
      
      // Analyze average score
      if (avgScore < 50) {
        insights.push({
          type: 'warning',
          title: 'Desempenho Crítico',
          description: `Sua média atual é ${avgScore}%. Recomendamos revisar todo o material básico antes de prosseguir com novos quizzes.`,
          priority: 'high'
        });
      } else if (avgScore < 70) {
        insights.push({
          type: 'recommendation',
          title: 'Oportunidade de Melhoria',
          description: `Com média de ${avgScore}%, você está no caminho certo mas pode melhorar. Foque nos tópicos onde tem dificuldade.`,
          priority: 'medium'
        });
      } else if (avgScore >= 85) {
        insights.push({
          type: 'strength',
          title: 'Excelente Desempenho!',
          description: `Parabéns! Sua média de ${avgScore}% está acima da maioria dos estudantes. Continue assim!`,
          priority: 'low'
        });
      }
      
      // Analyze weaknesses
      if (weaknesses.length > 0) {
        const weakTopic = weaknesses[0];
        insights.push({
          type: 'weakness',
          title: `Foco Recomendado: ${weakTopic.topic}`,
          description: `Este tópico tem apenas ${weakTopic.percentage}% de acertos. Dedique mais tempo estudando este conteúdo.`,
          priority: 'high'
        });
      }
      
      // Analyze strengths
      if (strengths.length > 0) {
        const strongTopic = strengths[0];
        insights.push({
          type: 'strength',
          title: `Ponto Forte: ${strongTopic.topic}`,
          description: `Você domina este tópico com ${strongTopic.percentage}% de acertos. Considere ajudar outros estudantes!`,
          priority: 'low'
        });
      }
      
      // Analyze trend
      if (trend === 'up') {
        insights.push({
          type: 'tip',
          title: 'Tendência Positiva',
          description: 'Suas notas estão melhorando! Mantenha a consistência nos estudos.',
          priority: 'medium'
        });
      } else if (trend === 'down') {
        insights.push({
          type: 'warning',
          title: 'Atenção à Tendência',
          description: 'Suas notas estão caindo. Considere revisar seu método de estudo ou pedir ajuda.',
          priority: 'high'
        });
      }
      
      // Analyze pass rate
      if (passRate < 50 && totalAttempts >= 3) {
        insights.push({
          type: 'recommendation',
          title: 'Taxa de Aprovação Baixa',
          description: `Apenas ${passRate}% dos seus quizzes foram aprovados. Sugerimos estudar mais antes de fazer os testes.`,
          priority: 'high'
        });
      }
      
      // Generate study plan
      const studyPlan: string[] = [];
      
      if (weaknesses.length > 0) {
        studyPlan.push(`1. Revisar conteúdo sobre "${weaknesses[0]?.topic}" - Prioridade Alta`);
      }
      
      if (avgScore < 70) {
        studyPlan.push('2. Assistir novamente às aulas com baixo desempenho');
        studyPlan.push('3. Fazer anotações dos pontos principais');
      }
      
      studyPlan.push('4. Praticar com simulados antes dos quizzes oficiais');
      studyPlan.push('5. Revisar erros anteriores para não repeti-los');
      
      if (strengths.length > 0) {
        studyPlan.push(`6. Consolidar conhecimento em "${strengths[0]?.topic}" com exercícios avançados`);
      }
      
      // Calculate predicted score
      const predictedScore = Math.min(100, Math.round(avgScore * (trend === 'up' ? 1.1 : trend === 'down' ? 0.95 : 1)));
      
      // Next best topic
      const nextBestTopic = weaknesses.length > 0 
        ? weaknesses[0].topic 
        : strengths.length > 0 
          ? strengths[0].topic 
          : 'Revisão Geral';
      
      setAnalysis({
        insights: insights.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        studyPlan,
        predictedScore,
        nextBestTopic,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error analyzing performance:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar análise de desempenho',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const generateAdvancedInsights = useCallback(async (userId: string) => {
    setLoading(true);
    
    try {
      // Fetch comprehensive data
      const [attemptsRes, progressRes, certificatesRes] = await Promise.all([
        supabase
          .from('lesson_quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('course_certificates')
          .select('*')
          .eq('user_id', userId)
      ]);
      
      const attempts = attemptsRes.data || [];
      const progress = progressRes.data || [];
      const certificates = certificatesRes.data || [];
      
      const insights: AIInsight[] = [];
      
      // Completion insights
      const completedLessons = progress.filter(p => p.completed).length;
      const totalLessons = progress.length;
      const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      
      if (completionRate < 30) {
        insights.push({
          type: 'warning',
          title: 'Baixa Taxa de Conclusão',
          description: `Você completou apenas ${completionRate.toFixed(0)}% das aulas. Tente dedicar mais tempo aos estudos.`,
          priority: 'high'
        });
      } else if (completionRate >= 80) {
        insights.push({
          type: 'strength',
          title: 'Excelente Progresso!',
          description: `Você já completou ${completionRate.toFixed(0)}% das aulas. Continue assim!`,
          priority: 'low'
        });
      }
      
      // Certificate insights
      if (certificates.length > 0) {
        insights.push({
          type: 'strength',
          title: `${certificates.length} Certificado(s) Obtido(s)`,
          description: 'Parabéns pelas suas conquistas! Continue buscando mais certificações.',
          priority: 'low'
        });
      }
      
      // Time-based insights
      const recentAttempts = attempts.filter(a => {
        const attemptDate = new Date(a.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return attemptDate >= weekAgo;
      });
      
      if (recentAttempts.length === 0 && attempts.length > 0) {
        insights.push({
          type: 'tip',
          title: 'Retome os Estudos',
          description: 'Você não fez nenhum quiz na última semana. A prática regular é essencial para o aprendizado.',
          priority: 'medium'
        });
      }
      
      // Study time insights
      const totalWatchTime = progress.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0);
      const hoursWatched = totalWatchTime / 3600;
      
      if (hoursWatched >= 10) {
        insights.push({
          type: 'strength',
          title: `${hoursWatched.toFixed(1)} Horas de Estudo`,
          description: 'Sua dedicação é inspiradora! Continue investindo no seu aprendizado.',
          priority: 'low'
        });
      }
      
      setAnalysis(prev => ({
        insights: insights.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        studyPlan: prev?.studyPlan || [],
        predictedScore: prev?.predictedScore || 0,
        nextBestTopic: prev?.nextBestTopic || 'Revisão Geral',
        generatedAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error generating advanced insights:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    analysis,
    analyzePerformance,
    generateAdvancedInsights
  };
}
