import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, 
  XCircle, AlertTriangle, Trophy, RotateCcw, Home, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  question_text: string;
  options: { id: string; text: string; is_correct: boolean }[];
  topic: string;
  difficulty: string;
  explanation: string | null;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  certification: string;
  total_questions: number;
  passing_score: number;
  time_limit_minutes: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_answers_after: boolean;
  allow_review: boolean;
}

interface Answer {
  questionId: string;
  selected: string | null;
  is_correct: boolean | null;
  flagged: boolean;
}

export default function ExamPlayer() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    wrong: number;
    unanswered: number;
  } | null>(null);

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam-detail', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_exams')
        .select('*')
        .eq('id', examId)
        .single();
      if (error) throw error;
      return data as Exam;
    },
  });

  // Fetch questions for this exam's certification
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: async () => {
      if (!exam) return [];
      
      const { data, error } = await supabase
        .from('financial_questions')
        .select('*')
        .eq('certification', exam.certification as any)
        .eq('is_active', true)
        .limit(exam.total_questions);
      
      if (error) throw error;
      
      let processedQuestions = (data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      }));
      
      // Shuffle if needed
      if (exam.shuffle_questions) {
        processedQuestions = processedQuestions.sort(() => Math.random() - 0.5);
      }
      
      // Shuffle options if needed
      if (exam.shuffle_options) {
        processedQuestions = processedQuestions.map((q: any) => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5),
        }));
      }
      
      return processedQuestions as Question[];
    },
    enabled: !!exam,
  });

  // Fetch or create attempt
  const { data: attempt } = useQuery({
    queryKey: ['exam-attempt', attemptId],
    queryFn: async () => {
      if (!attemptId || !user) return null;
      
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();
      
      if (error) throw error;
      
      // Restore saved answers if any
      if (data.answers && typeof data.answers === 'object' && !Array.isArray(data.answers)) {
        setAnswers(data.answers as unknown as Record<string, Answer>);
      }
      
      return data;
    },
    enabled: !!attemptId && !!user,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (currentAnswers: Record<string, Answer>) => {
      if (!attemptId) return;
      
      const { error } = await supabase
        .from('exam_attempts')
        .update({ 
          answers: currentAnswers as unknown as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId);
      
      if (error) throw error;
    },
  });

  // Finish exam mutation
  const finishExamMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId || !questions || !exam) return;
      
      // Calculate results
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;
      
      const finalAnswers: Record<string, Answer> = {};
      
      questions.forEach((q) => {
        const answer = answers[q.id];
        if (!answer || !answer.selected) {
          unanswered++;
          finalAnswers[q.id] = { 
            questionId: q.id, 
            selected: null, 
            is_correct: false,
            flagged: answer?.flagged || false 
          };
        } else {
          const selectedOption = q.options.find(opt => opt.id === answer.selected);
          const isCorrect = selectedOption?.is_correct || false;
          if (isCorrect) {
            correct++;
          } else {
            wrong++;
          }
          finalAnswers[q.id] = { 
            ...answer, 
            is_correct: isCorrect 
          };
        }
      });
      
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= exam.passing_score;
      
      // Update attempt
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          answers: finalAnswers as unknown as any,
          status: 'completed' as const,
          completed_at: new Date().toISOString(),
          time_spent_seconds: exam.time_limit_minutes * 60 - (timeRemaining || 0),
          score,
          passed,
          total_correct: correct,
          total_wrong: wrong,
          total_unanswered: unanswered,
        })
        .eq('id', attemptId);
      
      if (error) throw error;
      
      return { score, passed, correct, wrong, unanswered };
    },
    onSuccess: (data) => {
      if (data) {
        setResults(data);
        setShowResults(true);
        queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
        toast.success(data.passed ? '🎉 Parabéns, você foi aprovado!' : 'Simulado finalizado!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao finalizar: ' + error.message);
    },
  });

  // Timer effect
  useEffect(() => {
    if (exam && timeRemaining === null && attempt?.status === 'in_progress') {
      // Calculate remaining time
      if (attempt.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
        const total = exam.time_limit_minutes * 60;
        setTimeRemaining(Math.max(0, total - elapsed));
      } else {
        setTimeRemaining(exam.time_limit_minutes * 60);
      }
    }
  }, [exam, attempt]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          // Auto-finish when time runs out
          finishExamMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Auto-save periodically
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    
    const timeout = setTimeout(() => {
      saveProgressMutation.mutate(answers);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        selected: optionId,
        is_correct: null,
        flagged: prev[questionId]?.flagged || false,
      },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        selected: prev[questionId]?.selected || null,
        is_correct: null,
        flagged: !prev[questionId]?.flagged,
      },
    }));
  };

  const currentQuestion = questions?.[currentIndex];
  const answeredCount = Object.values(answers).filter(a => a.selected).length;
  const flaggedCount = Object.values(answers).filter(a => a.flagged).length;

  const isLoading = examLoading || questionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando simulado...</p>
        </div>
      </div>
    );
  }

  if (!exam || !questions?.length) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Simulado não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar o simulado solicitado.
        </p>
        <Button onClick={() => navigate('/members/exams')}>
          Voltar aos Simulados
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header with timer and progress */}
      <Card className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                {exam.title}
              </h1>
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1}/{questions.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono ${
                timeRemaining && timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-muted'
              }`}>
                <Clock className="w-4 h-4" />
                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
              </div>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsFinishing(true)}
              >
                Finalizar
              </Button>
            </div>
          </div>
          
          <Progress 
            value={(answeredCount / questions.length) * 100} 
            className="mt-3 h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{answeredCount} respondidas</span>
            {flaggedCount > 0 && (
              <span className="text-yellow-600">{flaggedCount} marcadas para revisão</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Badge variant="outline" className="text-xs mb-2">
                    {currentQuestion?.topic}
                  </Badge>
                  <CardTitle className="text-lg leading-relaxed">
                    {currentQuestion?.question_text}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => currentQuestion && toggleFlag(currentQuestion.id)}
                  className={answers[currentQuestion?.id || '']?.flagged ? 'text-yellow-500' : ''}
                >
                  <Flag className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion?.id || '']?.selected || ''}
                onValueChange={(value) => currentQuestion && handleAnswer(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion?.options.map((option, idx) => (
                  <div 
                    key={option.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                      answers[currentQuestion.id]?.selected === option.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}
                    onClick={() => handleAnswer(currentQuestion.id, option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <Label 
                      htmlFor={option.id} 
                      className="flex-1 cursor-pointer font-normal leading-relaxed"
                    >
                      <span className="font-semibold mr-2">
                        {String.fromCharCode(65 + idx)})
                      </span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        
        {/* Question navigator */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1 justify-center flex-wrap max-w-md mx-auto">
            {questions.slice(0, 20).map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  idx === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : answers[q.id]?.selected
                    ? 'bg-green-100 text-green-700'
                    : answers[q.id]?.flagged
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            {questions.length > 20 && (
              <span className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
                +{questions.length - 20}
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          Próxima
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Finish Confirmation Dialog */}
      <Dialog open={isFinishing} onOpenChange={setIsFinishing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Simulado?</DialogTitle>
            <DialogDescription>
              Você respondeu {answeredCount} de {questions.length} questões.
              {questions.length - answeredCount > 0 && (
                <span className="text-yellow-600 block mt-2">
                  ⚠️ {questions.length - answeredCount} questões ainda não foram respondidas.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsFinishing(false)}>
              Continuar Respondendo
            </Button>
            <Button 
              onClick={() => {
                setIsFinishing(false);
                finishExamMutation.mutate();
              }}
              disabled={finishExamMutation.isPending}
            >
              {finishExamMutation.isPending ? 'Finalizando...' : 'Confirmar e Finalizar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            {results?.passed ? (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-2">
              {results?.passed ? '🎉 Aprovado!' : 'Não foi dessa vez'}
            </h2>
            
            <div className="text-4xl font-bold my-4">
              <span className={results?.passed ? 'text-green-600' : 'text-red-600'}>
                {results?.score}%
              </span>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Nota mínima: {exam.passing_score}%
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-600">{results?.correct}</p>
                <p className="text-xs text-muted-foreground">Corretas</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-600">{results?.wrong}</p>
                <p className="text-xs text-muted-foreground">Erradas</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-600">{results?.unanswered}</p>
                <p className="text-xs text-muted-foreground">Em branco</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {exam.show_answers_after && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowResults(false);
                    navigate(`/members/exams/${examId}/review/${attemptId}`);
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Revisar Respostas
                </Button>
              )}
              <Button 
                className="w-full"
                onClick={() => navigate('/members/exams')}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar aos Simulados
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
