'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, Clock, Trophy, Target, ChevronRight, 
  CheckCircle, RotateCcw, AlertTriangle 
} from 'lucide-react';

interface Simulator {
  id: string;
  title: string;
  description: string | null;
  total_questions: number;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number | null;
  is_active: boolean;
  product_id: string;
  products: {
    name: string;
    cover_image_url: string | null;
  } | null;
}

interface SimulatorAttempt {
  id: string;
  simulator_id: string;
  score: number;
  passed: boolean;
  completed_at: string | null;
}

export default function VIPSimulators() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch enrolled products
  const { data: enrolledProductIds } = useQuery({
    queryKey: ['enrolled-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('product_id')
        .eq('user_id', user?.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data.map(e => e.product_id);
    },
    enabled: !!user?.id
  });

  // Fetch simulators for enrolled products
  const { data: simulators, isLoading } = useQuery({
    queryKey: ['vip-simulators', enrolledProductIds],
    queryFn: async () => {
      if (!enrolledProductIds?.length) return [];
      
      const { data, error } = await supabase
        .from('exam_simulators')
        .select(`
          *,
          products:product_id (
            name,
            cover_image_url
          )
        `)
        .in('product_id', enrolledProductIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Simulator[];
    },
    enabled: !!enrolledProductIds?.length
  });

  // Fetch user's attempts
  const { data: attempts } = useQuery({
    queryKey: ['simulator-attempts-all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_attempts')
        .select('id, simulator_id, score, passed, completed_at')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as SimulatorAttempt[];
    },
    enabled: !!user?.id
  });

  // Group attempts by simulator
  const attemptsBySimulator = attempts?.reduce((acc, attempt) => {
    if (!acc[attempt.simulator_id]) {
      acc[attempt.simulator_id] = [];
    }
    acc[attempt.simulator_id].push(attempt);
    return acc;
  }, {} as Record<string, SimulatorAttempt[]>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!simulators?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Nenhum Simulado Disponível</h2>
        <p className="text-muted-foreground mb-4">
          Você ainda não tem acesso a simulados. Verifique seus cursos inscritos.
        </p>
        <Button asChild>
          <Link to="/vip/my-products">Ver Meus Cursos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Simulados</h1>
        <p className="text-muted-foreground">
          Pratique e teste seus conhecimentos com simulados
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {simulators.map((simulator) => {
          const simAttempts = attemptsBySimulator[simulator.id] || [];
          const bestAttempt = simAttempts.reduce((best, current) => 
            (!best || current.score > best.score) ? current : best
          , null as SimulatorAttempt | null);
          const hasPassed = simAttempts.some(a => a.passed);
          const attemptsRemaining = simulator.max_attempts 
            ? simulator.max_attempts - simAttempts.length 
            : null;

          return (
            <Card key={simulator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {simulator.products?.cover_image_url && (
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={simulator.products.cover_image_url} 
                    alt={simulator.title}
                    className="w-full h-full object-cover"
                  />
                  {hasPassed && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aprovado
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{simulator.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {simulator.products?.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {simulator.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {simulator.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{simulator.total_questions} questões</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{simulator.time_limit_minutes || '∞'} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>{simulator.passing_score}% mínimo</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {attemptsRemaining !== null 
                        ? `${attemptsRemaining} tentativas` 
                        : 'Ilimitado'}
                    </span>
                  </div>
                </div>

                {bestAttempt && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Melhor resultado:</span>
                        <span className="font-medium">{bestAttempt.score.toFixed(1)}%</span>
                      </div>
                      <Progress value={bestAttempt.score} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {simAttempts.length} tentativa{simAttempts.length !== 1 ? 's' : ''} realizada{simAttempts.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </>
                )}

                {attemptsRemaining !== null && attemptsRemaining <= 0 && (
                  <div className="flex items-center gap-2 p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Limite de tentativas atingido</span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/members/simulator/${simulator.id}?productId=${simulator.product_id}`)}
                  disabled={attemptsRemaining !== null && attemptsRemaining <= 0}
                >
                  {hasPassed ? 'Refazer Simulado' : 'Iniciar Simulado'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
