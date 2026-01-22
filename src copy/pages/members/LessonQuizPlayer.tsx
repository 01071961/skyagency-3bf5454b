import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  Flag,
  RotateCcw,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

interface LessonQuizPlayerProps {
  lessonId: string;
  lessonName: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number | null; // in minutes
  onComplete: (passed: boolean, score: number) => void;
  onBack: () => void;
}

export function LessonQuizPlayer({
  lessonId,
  lessonName,
  questions,
  passingScore,
  timeLimit,
  onComplete,
  onBack
}: LessonQuizPlayerProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(timeLimit ? timeLimit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ 
    score: number; 
    passed: boolean; 
    correct: number; 
    total: number;
    details: { questionIndex: number; correct: boolean; userAnswer: number; correctAnswer: number }[];
  } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Create attempt on mount
  useEffect(() => {
    const createAttempt = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('lesson_quiz_attempts')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            started_at: new Date().toISOString(),
            total_questions: questions.length
          })
          .select('id')
          .single();
        
        if (error) throw error;
        setAttemptId(data.id);
      } catch (error) {
        console.error('Error creating attempt:', error);
      }
    };
    
    createAttempt();
  }, [user, lessonId, questions.length]);

  // Timer
  useEffect(() => {
    if (timeRemaining === null || showResults) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Auto-submit when time runs out
          if (prev === 0) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Calculate results
      let correctCount = 0;
      const details: { questionIndex: number; correct: boolean; userAnswer: number; correctAnswer: number }[] = [];
      
      questions.forEach((q, index) => {
        const userAnswer = answers[index] ?? -1;
        const isCorrect = userAnswer === q.correct_index;
        if (isCorrect) correctCount++;
        details.push({
          questionIndex: index,
          correct: isCorrect,
          userAnswer,
          correctAnswer: q.correct_index
        });
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= passingScore;

      // Calculate time spent
      const timeSpent = timeLimit ? (timeLimit * 60) - (timeRemaining || 0) : 0;

      // Update attempt in database
      if (attemptId && user) {
        await supabase
          .from('lesson_quiz_attempts')
          .update({
            completed_at: new Date().toISOString(),
            answers: answers,
            score,
            correct_answers: correctCount,
            passed,
            time_spent_seconds: timeSpent
          })
          .eq('id', attemptId);
      }

      setResults({
        score,
        passed,
        correct: correctCount,
        total: questions.length,
        details
      });
      setShowResults(true);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Erro ao enviar respostas');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, attemptId, isSubmitting, passingScore, questions, timeLimit, timeRemaining, user]);

  const handleRetry = () => {
    setAnswers({});
    setFlagged(new Set());
    setCurrentIndex(0);
    setShowResults(false);
    setResults(null);
    setTimeRemaining(timeLimit ? timeLimit * 60 : null);
    setAttemptId(null);
  };

  // Results screen
  if (showResults && results) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Card className={cn(
          "text-center border-2",
          results.passed ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"
        )}>
          <CardContent className="pt-8 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className={cn(
                "w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center",
                results.passed ? "bg-green-500" : "bg-destructive"
              )}
            >
              {results.passed ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">
              {results.passed ? 'Parabéns! Você foi aprovado!' : 'Não foi dessa vez...'}
            </h2>
            
            <div className="flex items-center justify-center gap-4 my-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{results.score}%</div>
                <div className="text-sm text-muted-foreground">Sua Nota</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl font-bold">{results.correct}/{results.total}</div>
                <div className="text-sm text-muted-foreground">Acertos</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl font-bold text-muted-foreground">{passingScore}%</div>
                <div className="text-sm text-muted-foreground">Mínimo</div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              {results.passed 
                ? 'Excelente trabalho! Você pode prosseguir para a próxima aula.'
                : `Você precisa de ${passingScore}% para ser aprovado. Revise o conteúdo e tente novamente.`}
            </p>

            <div className="flex justify-center gap-3">
              {results.passed ? (
                <Button onClick={() => onComplete(true, results.score)} size="lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Continuar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={onBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Revisar Conteúdo
                  </Button>
                  <Button onClick={handleRetry}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revisão das Questões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.details.map((detail, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border",
                  detail.correct ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-3">
                  {detail.correct ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-2">{index + 1}. {questions[index].question}</p>
                    <p className="text-sm text-muted-foreground">
                      Sua resposta: {detail.userAnswer >= 0 ? questions[index].options[detail.userAnswer] : 'Não respondida'}
                    </p>
                    {!detail.correct && (
                      <p className="text-sm text-green-600 mt-1">
                        Resposta correta: {questions[index].options[detail.correctAnswer]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header with timer and progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <div>
                <h2 className="font-semibold">{lessonName}</h2>
                <p className="text-sm text-muted-foreground">
                  Questão {currentIndex + 1} de {questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Respondidas</div>
                <div className="font-medium">{answeredCount}/{questions.length}</div>
              </div>
              
              {timeRemaining !== null && (
                <Badge 
                  variant={timeRemaining < 60 ? 'destructive' : 'secondary'}
                  className="text-lg px-3 py-1"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </div>
          </div>
          
          <Progress value={progressPercent} className="mt-4 h-2" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Question navigation sidebar */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Navegação</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    "w-full aspect-square rounded-lg text-sm font-medium transition-all",
                    "flex items-center justify-center relative",
                    currentIndex === index && "ring-2 ring-primary",
                    answers[index] !== undefined 
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80",
                    flagged.has(index) && "ring-2 ring-orange-500"
                  )}
                >
                  {index + 1}
                  {flagged.has(index) && (
                    <Flag className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span>Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted" />
                <span>Não respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted ring-2 ring-orange-500" />
                <span>Marcada para revisão</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question content */}
        <Card className="lg:col-span-3 order-1 lg:order-2">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-lg font-medium">
                    <span className="text-primary mr-2">{currentIndex + 1}.</span>
                    {currentQuestion.question}
                  </h3>
                  <Button
                    variant={flagged.has(currentIndex) ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleFlag}
                    className={cn(flagged.has(currentIndex) && "bg-orange-500 hover:bg-orange-600")}
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {flagged.has(currentIndex) ? 'Marcada' : 'Marcar'}
                  </Button>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() => handleAnswer(optIndex)}
                      className={cn(
                        "w-full p-4 text-left rounded-lg border-2 transition-all",
                        "hover:border-primary/50",
                        answers[currentIndex] === optIndex
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                          answers[currentIndex] === optIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {currentIndex === questions.length - 1 ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalizar
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            {/* Warning if not all answered */}
            {answeredCount < questions.length && currentIndex === questions.length - 1 && (
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="text-sm">
                  Você ainda não respondeu {questions.length - answeredCount} questão(ões).
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LessonQuizPlayer;
