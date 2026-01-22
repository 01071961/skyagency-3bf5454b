'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wand2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  difficulty?: string;
  topic?: string;
}

interface AIQuizGeneratorProps {
  lessonTitle: string;
  lessonContent?: string;
  videoUrl?: string;
  onQuestionsGenerated: (questions: QuizQuestion[]) => void;
  existingQuestions: QuizQuestion[];
}

export default function AIQuizGenerator({ 
  lessonTitle, 
  lessonContent,
  videoUrl,
  onQuestionsGenerated,
  existingQuestions 
}: AIQuizGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [customContent, setCustomContent] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState<'config' | 'preview'>('config');

  const handleGenerate = async () => {
    const content = customContent.trim() || lessonContent || '';
    
    if (!content && !lessonTitle) {
      toast.error('Forneça o conteúdo ou título da aula para gerar as questões');
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz-questions', {
        body: {
          lessonTitle,
          lessonContent: content || `Aula: ${lessonTitle}. ${videoUrl ? `Conteúdo de vídeo disponível em: ${videoUrl}` : ''}`,
          numberOfQuestions,
          difficulty
        }
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        setStep('preview');
        toast.success(`${data.questions.length} questões geradas com sucesso!`);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast.error(error.message || 'Erro ao gerar questões');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyQuestions = (replace: boolean) => {
    if (replace) {
      onQuestionsGenerated(generatedQuestions);
    } else {
      onQuestionsGenerated([...existingQuestions, ...generatedQuestions]);
    }
    toast.success(`${generatedQuestions.length} questões ${replace ? 'aplicadas' : 'adicionadas'}!`);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setStep('config');
    setGeneratedQuestions([]);
    setCustomContent('');
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'easy': return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Fácil</Badge>;
      case 'hard': return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Difícil</Badge>;
      default: return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Médio</Badge>;
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Wand2 className="w-4 h-4" />
        Gerar com IA
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gerar Questões com IA
            </DialogTitle>
            <DialogDescription>
              {step === 'config' 
                ? 'Configure e gere questões automaticamente baseadas no conteúdo da aula'
                : 'Revise as questões geradas antes de aplicar'}
            </DialogDescription>
          </DialogHeader>

          {step === 'config' ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número de Questões</Label>
                  <Select 
                    value={String(numberOfQuestions)} 
                    onValueChange={(v) => setNumberOfQuestions(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questões</SelectItem>
                      <SelectItem value="5">5 questões</SelectItem>
                      <SelectItem value="10">10 questões</SelectItem>
                      <SelectItem value="15">15 questões</SelectItem>
                      <SelectItem value="20">20 questões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dificuldade</Label>
                  <Select 
                    value={difficulty} 
                    onValueChange={(v) => setDifficulty(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                      <SelectItem value="mixed">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Conteúdo Base (opcional)</Label>
                <Textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder={`A IA usará o título da aula "${lessonTitle}" como base. Cole aqui textos adicionais, transcrição do vídeo, ou tópicos específicos para gerar questões mais precisas.`}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto mais conteúdo você fornecer, mais precisas serão as questões geradas
                </p>
              </div>

              {existingQuestions.length > 0 && (
                <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Esta aula já tem {existingQuestions.length} questões. 
                      Você poderá escolher entre substituir ou adicionar.
                    </span>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-2">
              {generatedQuestions.map((q, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary">{index + 1}.</span>
                      <span className="font-medium">{q.question}</span>
                    </div>
                    {getDifficultyBadge(q.difficulty)}
                  </div>
                  
                  <div className="space-y-2 ml-6">
                    {q.options.map((opt, optIndex) => (
                      <div 
                        key={optIndex}
                        className={`flex items-center gap-2 p-2 rounded ${
                          optIndex === q.correct_index 
                            ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900' 
                            : 'bg-muted/50'
                        }`}
                      >
                        {optIndex === q.correct_index && (
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        )}
                        <span className="text-sm">
                          {String.fromCharCode(65 + optIndex)}) {opt}
                        </span>
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-sm text-muted-foreground mt-3 ml-6 p-2 bg-muted/30 rounded">
                      <strong>Explicação:</strong> {q.explanation}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === 'config' ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Questões
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep('config')}>
                  Voltar
                </Button>
                {existingQuestions.length > 0 && (
                  <Button variant="secondary" onClick={() => handleApplyQuestions(false)}>
                    Adicionar às Existentes
                  </Button>
                )}
                <Button onClick={() => handleApplyQuestions(true)}>
                  {existingQuestions.length > 0 ? 'Substituir Todas' : 'Aplicar Questões'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
