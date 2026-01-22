import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ClipboardCheck, Clock, Target, Users, Play, History,
  Trophy, Award, TrendingUp, Lock, CheckCircle, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

const CERTIFICATION_INFO: Record<string, { label: string; color: string; icon: string }> = {
  ancord: { label: 'ANCORD', color: 'bg-blue-500', icon: '📊' },
  cea: { label: 'CEA', color: 'bg-green-500', icon: '💼' },
  cfp: { label: 'CFP', color: 'bg-purple-500', icon: '🎯' },
  cpa_10: { label: 'CPA-10', color: 'bg-orange-500', icon: '📈' },
  cpa_20: { label: 'CPA-20', color: 'bg-red-500', icon: '📉' },
  cnpi: { label: 'CNPI', color: 'bg-teal-500', icon: '🔬' },
  other: { label: 'Outro', color: 'bg-gray-500', icon: '📚' },
};

export default function ExamsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch available exams
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['available-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's attempts
  const { data: myAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['my-exam-attempts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, financial_exams(title, certification)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's certification progress
  const { data: progress } = useQuery({
    queryKey: ['my-certification-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('certification_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Start exam mutation
  const startExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert({
          exam_id: examId,
          user_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (attempt) => {
      navigate(`/members/exams/${attempt.exam_id}/play/${attempt.id}`);
    },
    onError: (error) => {
      toast.error('Erro ao iniciar simulado: ' + error.message);
      setIsStarting(false);
    },
  });

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam);
  };

  const confirmStartExam = () => {
    if (!selectedExam) return;
    setIsStarting(true);
    startExamMutation.mutate(selectedExam.id);
  };

  const getProgressForCertification = (cert: string) => {
    return progress?.find(p => p.certification === cert);
  };

  const getAttemptsForExam = (examId: string) => {
    return myAttempts?.filter(a => a.exam_id === examId) || [];
  };

  const getBestScore = (examId: string) => {
    const attempts = getAttemptsForExam(examId);
    if (!attempts.length) return null;
    return Math.max(...attempts.map(a => a.score || 0));
  };

  const isLoading = examsLoading || attemptsLoading;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            Simulados
          </h1>
          <p className="text-muted-foreground">
            Prepare-se para as certificações financeiras
          </p>
        </div>
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{myAttempts?.length || 0}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Simulados Feitos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">
                  {myAttempts?.filter(a => a.passed).length || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Aprovações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">
                  {myAttempts?.length 
                    ? Math.round(myAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / myAttempts.length) 
                    : 0}%
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Média Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">
                  {progress?.filter(p => p.is_certified).length || 0}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Certificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="available">Disponíveis</TabsTrigger>
          <TabsTrigger value="history">Meu Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
            </div>
          ) : exams?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum simulado disponível</h3>
                <p className="text-muted-foreground">
                  Novos simulados serão adicionados em breve.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exams?.map((exam, index) => {
                const certInfo = CERTIFICATION_INFO[exam.certification] || CERTIFICATION_INFO.other;
                const bestScore = getBestScore(exam.id);
                const attemptsCount = getAttemptsForExam(exam.id).length;
                const certProgress = getProgressForCertification(exam.certification);
                
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge className={`${certInfo.color} text-white`}>
                            {certInfo.icon} {certInfo.label}
                          </Badge>
                          {exam.is_free && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Gratuito
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mt-2 line-clamp-2">
                          {exam.title}
                        </CardTitle>
                        {exam.description && (
                          <CardDescription className="line-clamp-2">
                            {exam.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="flex-1">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="w-4 h-4" />
                            <span>{exam.total_questions} questões</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{exam.time_limit_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4" />
                            <span>{exam.passing_score}% p/ aprovar</span>
                          </div>
                          {attemptsCount > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <History className="w-4 h-4" />
                              <span>{attemptsCount} tentativa{attemptsCount > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        
                        {bestScore !== null && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Melhor nota</span>
                              <span className={`font-bold ${bestScore >= exam.passing_score ? 'text-green-600' : 'text-orange-600'}`}>
                                {bestScore}%
                              </span>
                            </div>
                            <Progress value={bestScore} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => handleStartExam(exam)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {attemptsCount > 0 ? 'Fazer Novamente' : 'Iniciar Simulado'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {myAttempts?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum histórico</h3>
                <p className="text-muted-foreground">
                  Faça seu primeiro simulado para ver seu histórico aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myAttempts?.map((attempt) => (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {attempt.financial_exams?.title || 'Simulado'}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>
                            {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {attempt.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {attempt.status === 'completed' && (
                          <div className={`text-center px-4 py-2 rounded-lg ${
                            attempt.passed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            <div className="text-xl font-bold">{attempt.score}%</div>
                            <div className="text-xs">
                              {attempt.passed ? 'Aprovado' : 'Reprovado'}
                            </div>
                          </div>
                        )}
                        
                        {attempt.status === 'in_progress' && (
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/members/exams/${attempt.exam_id}/play/${attempt.id}`)}
                          >
                            Continuar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Start Exam Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={() => !isStarting && setSelectedExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Simulado</DialogTitle>
            <DialogDescription>
              Você está prestes a iniciar o simulado: <strong>{selectedExam?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg text-center">
                <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="font-bold">{selectedExam?.total_questions}</p>
                <p className="text-xs text-muted-foreground">Questões</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="font-bold">{selectedExam?.time_limit_minutes} min</p>
                <p className="text-xs text-muted-foreground">Tempo Limite</p>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="font-medium text-yellow-800 mb-1">⚠️ Atenção:</p>
              <ul className="text-yellow-700 space-y-1 text-xs">
                <li>• O tempo começará a contar assim que você iniciar</li>
                <li>• Seu progresso será salvo automaticamente</li>
                <li>• Nota mínima para aprovação: {selectedExam?.passing_score}%</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedExam(null)} disabled={isStarting}>
              Cancelar
            </Button>
            <Button onClick={confirmStartExam} disabled={isStarting}>
              {isStarting ? 'Iniciando...' : 'Começar Agora'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
