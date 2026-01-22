'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, 
  XCircle, RotateCcw, Trophy, AlertTriangle, BookOpen,
  Timer, ArrowLeft, ListChecks, Award, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCertificateGenerator } from '@/hooks/useCertificateGenerator';

interface SimulatorQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

interface Simulator {
  id: string;
  title: string;
  description: string | null;
  total_questions: number;
  time_limit_minutes: number | null;
  passing_score: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_review: boolean;
  show_correct_answers: boolean;
  max_attempts: number | null;
  product_id: string;
}

interface Answer {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  flagged: boolean;
}

export default function SimulatorPlayer() {
  const { simulatorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const { generateCertificateAsync, isGenerating, downloadCertificate } = useCertificateGenerator();

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [attemptResult, setAttemptResult] = useState<{
    score: number;
    passed: boolean;
    earnedPoints: number;
    totalPoints: number;
  } | null>(null);

  // Fetch simulator details
  const { data: simulator, isLoading: loadingSimulator } = useQuery({
    queryKey: ['simulator', simulatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_simulators')
        .select('*')
        .eq('id', simulatorId)
        .single();
      
      if (error) throw error;
      return data as Simulator;
    },
    enabled: !!simulatorId
  });

  // Fetch questions
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['simulator-questions', simulatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_questions')
        .select('*')
        .eq('simulator_id', simulatorId)
        .order('order_index');
      
      if (error) throw error;
      
      let qs = data as SimulatorQuestion[];
      
      // Shuffle questions if enabled
      if (simulator?.shuffle_questions) {
        qs = [...qs].sort(() => Math.random() - 0.5);
      }
      
      // Shuffle options if enabled
      if (simulator?.shuffle_options) {
        qs = qs.map(q => ({
          ...q,
          options: [...(q.options || [])].sort(() => Math.random() - 0.5)
        }));
      }
      
      return qs;
    },
    enabled: !!simulatorId && !!simulator
  });

  // Fetch previous attempts
  const { data: previousAttempts } = useQuery({
    queryKey: ['simulator-attempts', simulatorId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_attempts')
        .select('*')
        .eq('simulator_id', simulatorId)
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!simulatorId && !!user?.id
  });

  // Check if max attempts reached
  const attemptsRemaining = simulator?.max_attempts 
    ? simulator.max_attempts - (previousAttempts?.length || 0)
    : null;

  // Timer effect
  useEffect(() => {
    if (!startedAt || !simulator?.time_limit_minutes || showResults) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const totalSeconds = simulator.time_limit_minutes * 60;
      const remaining = totalSeconds - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, simulator?.time_limit_minutes, showResults]);

  // Start simulator
  const handleStart = useCallback(() => {
    setStartedAt(new Date());
    if (simulator?.time_limit_minutes) {
      setTimeRemaining(simulator.time_limit_minutes * 60);
    }
    
    // Initialize answers
    const initialAnswers = new Map<string, Answer>();
    questions?.forEach(q => {
      initialAnswers.set(q.id, {
        questionId: q.id,
        selectedOption: null,
        isCorrect: null,
        flagged: false
      });
    });
    setAnswers(initialAnswers);
  }, [simulator, questions]);

  // Select answer
  const handleSelectAnswer = (questionId: string, option: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      const current = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...current!,
        selectedOption: option
      });
      return newAnswers;
    });
  };

  // Toggle flag
  const toggleFlag = (questionId: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      const current = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...current!,
        flagged: !current?.flagged
      });
      return newAnswers;
    });
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!questions || !simulator || !user?.id || !startedAt) return;

      // Calculate results
      let earnedPoints = 0;
      let totalPoints = 0;
      const answersObj: Record<string, { selected: string; correct: string; isCorrect: boolean }> = {};

      questions.forEach(q => {
        const answer = answers.get(q.id);
        const isCorrect = answer?.selectedOption === q.correct_answer;
        totalPoints += q.points;
        if (isCorrect) earnedPoints += q.points;
        
        answersObj[q.id] = {
          selected: answer?.selectedOption || '',
          correct: q.correct_answer,
          isCorrect
        };
      });

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= simulator.passing_score;
      const timeSpent = Math.floor((Date.now() - startedAt.getTime()) / 1000);

      // Save attempt
      const { error } = await supabase
        .from('simulator_attempts')
        .insert({
          simulator_id: simulatorId,
          user_id: user.id,
          score,
          total_points: totalPoints,
          earned_points: earnedPoints,
          time_spent_seconds: timeSpent,
          answers: answersObj,
          passed,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      return { score, passed, earnedPoints, totalPoints };
    },
    onSuccess: async (result) => {
      if (result) {
        setAttemptResult(result);
        setShowResults(true);
        queryClient.invalidateQueries({ queryKey: ['simulator-attempts'] });
        queryClient.invalidateQueries({ queryKey: ['historico-modulos'] });
        
        if (result.passed) {
          toast.success('Parabéns! Você foi aprovado!');
          
          // Try to generate certificate automatically
          if (simulator?.product_id) {
            try {
              // Get product and profile info for certificate
              const [{ data: product }, { data: profile }] = await Promise.all([
                supabase.from('products').select('name').eq('id', simulator.product_id).single(),
                supabase.from('profiles').select('name').eq('user_id', user?.id).single()
              ]);
              
              if (product && profile) {
                await generateCertificateAsync({
                  productId: simulator.product_id,
                  courseName: product.name,
                  courseHours: 10, // Default hours
                  score: result.score,
                  studentName: profile.name || 'Aluno'
                });
              }
            } catch (err) {
              console.warn('Certificate generation skipped:', err);
            }
          }
        } else {
          toast.error('Você não atingiu a pontuação mínima');
        }
      }
    },
    onError: (error) => {
      console.error('Submit error:', error);
      toast.error('Erro ao enviar respostas');
    }
  });

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitMutation.mutate();
    setIsSubmitting(false);
    setShowConfirmSubmit(false);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loadingSimulator || loadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!simulator || !questions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Simulado não encontrado</h1>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  // Check if max attempts reached
  if (attemptsRemaining !== null && attemptsRemaining <= 0 && !showResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <AlertTriangle className="h-16 w-16 text-warning" />
        <h1 className="text-2xl font-bold text-center">Limite de Tentativas Atingido</h1>
        <p className="text-muted-foreground text-center">
          Você já utilizou todas as {simulator.max_attempts} tentativas permitidas.
        </p>
        {previousAttempts && previousAttempts.length > 0 && (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Suas Tentativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {previousAttempts.map((attempt, idx) => (
                <div key={attempt.id} className="flex justify-between items-center">
                  <span>Tentativa {previousAttempts.length - idx}</span>
                  <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                    {attempt.score?.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        <Button onClick={() => navigate(`/members/course/${productId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Curso
        </Button>
      </div>
    );
  }

  // Pre-start screen
  if (!startedAt) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{simulator.title}</CardTitle>
              {simulator.description && (
                <CardDescription>{simulator.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted">
                  <ListChecks className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{questions.length}</div>
                  <div className="text-xs text-muted-foreground">Questões</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted">
                  <Timer className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">
                    {simulator.time_limit_minutes || '∞'}
                  </div>
                  <div className="text-xs text-muted-foreground">Minutos</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{simulator.passing_score}%</div>
                  <div className="text-xs text-muted-foreground">Para Aprovação</div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">
                    {attemptsRemaining ?? '∞'}
                  </div>
                  <div className="text-xs text-muted-foreground">Tentativas</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Leia cada questão com atenção antes de responder</p>
                <p>• Use a flag para marcar questões para revisar depois</p>
                {simulator.time_limit_minutes && (
                  <p>• O tempo começará a contar assim que iniciar</p>
                )}
                {!simulator.show_correct_answers && (
                  <p>• As respostas corretas não serão exibidas ao final</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button size="lg" onClick={handleStart} className="w-full max-w-xs">
                Iniciar Simulado
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults && attemptResult) {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className={cn(
                "mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center",
                attemptResult.passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
              )}>
                {attemptResult.passed ? (
                  <Trophy className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {attemptResult.passed ? 'Parabéns!' : 'Não foi dessa vez'}
              </CardTitle>
              <CardDescription className="text-lg">
                {attemptResult.passed 
                  ? 'Você foi aprovado no simulado!' 
                  : `Você precisa de ${simulator.passing_score}% para aprovação`}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary">
                  {attemptResult.score.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">
                  {attemptResult.earnedPoints} de {attemptResult.totalPoints} pontos
                </div>
              </div>
              
              <Progress 
                value={attemptResult.score} 
                className="h-3 mb-8"
              />

              {simulator.allow_review && (
                <>
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Revisar Respostas</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {questions.map((q, idx) => {
                        const answer = answers.get(q.id);
                        const isCorrect = answer?.selectedOption === q.correct_answer;
                        
                        return (
                          <Button
                            key={q.id}
                            variant={currentQuestionIndex === idx ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "w-10 h-10",
                              simulator.show_correct_answers && (
                                isCorrect 
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                                  : "border-red-500 bg-red-50 dark:bg-red-900/20"
                              )
                            )}
                            onClick={() => setCurrentQuestionIndex(idx)}
                          >
                            {idx + 1}
                          </Button>
                        );
                      })}
                    </div>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <Badge variant="outline" className="mb-2">
                            Questão {currentQuestionIndex + 1}
                          </Badge>
                          <p className="text-lg font-medium">{currentQuestion.question_text}</p>
                        </div>

                        <div className="space-y-2">
                          {currentQuestion.options.map((option, idx) => {
                            const answer = answers.get(currentQuestion.id);
                            const isSelected = answer?.selectedOption === option;
                            const isCorrect = option === currentQuestion.correct_answer;
                            
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "p-3 rounded-lg border transition-colors",
                                  simulator.show_correct_answers && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
                                  simulator.show_correct_answers && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
                                  !simulator.show_correct_answers && isSelected && "border-primary bg-primary/5"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {simulator.show_correct_answers && isCorrect && (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  )}
                                  {simulator.show_correct_answers && isSelected && !isCorrect && (
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                  )}
                                  <span>{option}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {simulator.show_correct_answers && currentQuestion.explanation && (
                          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Explicação:
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowResults(false);
                    setStartedAt(null);
                    setAttemptResult(null);
                    setCurrentQuestionIndex(0);
                    queryClient.invalidateQueries({ queryKey: ['simulator-questions'] });
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tentar Novamente ({attemptsRemaining} restantes)
                </Button>
              )}
              <Button onClick={() => navigate(`/members/course/${productId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Curso
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Active simulator
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const answeredCount = Array.from(answers.values()).filter(a => a.selectedOption !== null).length;
  const flaggedCount = Array.from(answers.values()).filter(a => a.flagged).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-medium truncate max-w-[200px]">{simulator.title}</span>
            <Badge variant="outline">
              {answeredCount}/{questions.length} respondidas
            </Badge>
            {flaggedCount > 0 && (
              <Badge variant="secondary">
                <Flag className="w-3 h-3 mr-1" />
                {flaggedCount}
              </Badge>
            )}
          </div>
          
          {timeRemaining !== null && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full font-mono",
              timeRemaining <= 60 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-muted"
            )}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      <div className="container py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question navigation */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Navegação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const answer = answers.get(q.id);
                    return (
                      <Button
                        key={q.id}
                        variant={currentQuestionIndex === idx ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "w-full h-10 relative",
                          answer?.selectedOption && currentQuestionIndex !== idx && "bg-green-100 border-green-300 dark:bg-green-900/30",
                          answer?.flagged && "ring-2 ring-yellow-400"
                        )}
                        onClick={() => setCurrentQuestionIndex(idx)}
                      >
                        {idx + 1}
                        {answer?.flagged && (
                          <Flag className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <Separator className="my-4" />
                
                <Button 
                  className="w-full"
                  onClick={() => setShowConfirmSubmit(true)}
                  disabled={isSubmitting}
                >
                  Finalizar Simulado
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main question area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        Questão {currentQuestionIndex + 1} de {questions.length}
                      </Badge>
                      <Button
                        variant={currentAnswer?.flagged ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => toggleFlag(currentQuestion.id)}
                      >
                        <Flag className={cn(
                          "w-4 h-4",
                          currentAnswer?.flagged && "fill-current"
                        )} />
                      </Button>
                    </div>
                    <CardTitle className="text-xl mt-4">
                      {currentQuestion.question_text}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <RadioGroup
                      value={currentAnswer?.selectedOption || ''}
                      onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                            currentAnswer?.selectedOption === option 
                              ? "border-primary bg-primary/5" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                        >
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label 
                            htmlFor={`option-${idx}`} 
                            className="flex-1 cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>
                    
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowConfirmSubmit(true)}
                        disabled={isSubmitting}
                      >
                        Finalizar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirm submit dialog */}
      <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Simulado?</DialogTitle>
            <DialogDescription>
              Você respondeu {answeredCount} de {questions.length} questões.
              {flaggedCount > 0 && ` Há ${flaggedCount} questão(ões) marcada(s) para revisão.`}
            </DialogDescription>
          </DialogHeader>
          
          {answeredCount < questions.length && (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Atenção!</span>
              </div>
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                Existem {questions.length - answeredCount} questão(ões) não respondida(s).
                Questões em branco serão consideradas incorretas.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
              Continuar Respondendo
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Finalizar Agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
