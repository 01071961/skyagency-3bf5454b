import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Brain, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Loader2,
  Lightbulb,
  Trash2,
  Edit,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

interface AIQuestionGeneratorProps {
  lessonTitle: string;
  lessonContent?: string;
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
  existingQuestions?: GeneratedQuestion[];
}

export default function AIQuestionGenerator({
  lessonTitle,
  lessonContent = '',
  onQuestionsGenerated,
  existingQuestions = []
}: AIQuestionGeneratorProps) {
  const [content, setContent] = useState(lessonContent);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = async () => {
    if (!content.trim()) {
      toast.error('Adicione o conteúdo da aula para gerar questões');
      return;
    }

    if (content.length < 100) {
      toast.error('O conteúdo precisa ter pelo menos 100 caracteres');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error: functionError } = await supabase.functions.invoke('generate-quiz-questions', {
        body: {
          lessonContent: content,
          lessonTitle,
          numberOfQuestions,
          difficulty
        }
      });

      clearInterval(progressInterval);

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Formato de resposta inválido');
      }

      setProgress(100);
      setGeneratedQuestions(data.questions);
      toast.success(`${data.questions.length} questões geradas com sucesso!`);

    } catch (err) {
      console.error('Error generating questions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar questões';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const addQuestion = (question: GeneratedQuestion) => {
    onQuestionsGenerated([...existingQuestions, question]);
    setGeneratedQuestions(prev => prev.filter(q => q.question !== question.question));
    toast.success('Questão adicionada ao quiz');
  };

  const addAllQuestions = () => {
    onQuestionsGenerated([...existingQuestions, ...generatedQuestions]);
    setGeneratedQuestions([]);
    toast.success('Todas as questões foram adicionadas');
  };

  const removeGeneratedQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card className="border-2 border-purple-500/30 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <Sparkles className="w-5 h-5" />
            Gerador de Questões com IA
          </CardTitle>
          <CardDescription>
            Cole o conteúdo da aula e a IA irá criar questões automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Conteúdo da Aula</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o texto, transcrição do vídeo ou resumo da aula..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} caracteres • Mínimo: 100
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Questões</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[numberOfQuestions]}
                  onValueChange={([value]) => setNumberOfQuestions(value)}
                  min={3}
                  max={15}
                  step={1}
                  className="flex-1"
                />
                <Badge variant="outline" className="w-12 justify-center">
                  {numberOfQuestions}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                  <SelectItem value="mixed">Misto (Recomendado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Gerando questões...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={generateQuestions}
            disabled={isGenerating || content.length < 100}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Questões...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Gerar Questões com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Questões Geradas ({generatedQuestions.length})
                </CardTitle>
                <CardDescription>
                  Revise e adicione as questões ao quiz
                </CardDescription>
              </div>
              <Button onClick={addAllQuestions} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedQuestions.map((question, index) => (
              <Card key={index} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-primary">{index + 1}.</span>
                        <p className="font-medium">{question.question}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pl-6">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={cn(
                              "p-2 rounded-lg text-sm",
                              optIndex === question.correct_index
                                ? "bg-green-500/10 border border-green-500/30"
                                : "bg-muted"
                            )}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optIndex)})
                            </span>
                            {option}
                            {optIndex === question.correct_index && (
                              <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
                            )}
                          </div>
                        ))}
                      </div>

                      {question.explanation && (
                        <div className="pl-6 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Explicação:</strong> {question.explanation}
                          </p>
                        </div>
                      )}

                      <div className="pl-6 flex items-center gap-2">
                        {question.difficulty && (
                          <Badge 
                            variant="outline" 
                            className={getDifficultyColor(question.difficulty)}
                          >
                            {question.difficulty === 'easy' ? 'Fácil' :
                             question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                          </Badge>
                        )}
                        {question.topic && (
                          <Badge variant="secondary">{question.topic}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => addQuestion(question)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeGeneratedQuestion(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium">Dicas para melhores resultados:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use textos claros e bem estruturados</li>
                <li>• Inclua conceitos-chave e definições</li>
                <li>• Quanto mais conteúdo, questões mais variadas</li>
                <li>• Revise sempre as questões antes de usar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
