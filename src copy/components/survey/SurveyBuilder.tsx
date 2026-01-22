import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  ListOrdered,
  CheckSquare,
  Star,
  MessageSquare,
  Settings,
  Eye,
  Save
} from 'lucide-react';

interface SurveyQuestion {
  id: string;
  type: 'text' | 'single' | 'multiple' | 'rating' | 'nps';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyBuilderProps {
  onSave?: (survey: SurveyData) => void;
}

interface SurveyData {
  title: string;
  description: string;
  questions: SurveyQuestion[];
  showProgressBar: boolean;
  allowAnonymous: boolean;
}

export const SurveyBuilder = ({ onSave }: SurveyBuilderProps) => {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    title: '',
    description: '',
    questions: [],
    showProgressBar: true,
    allowAnonymous: false
  });

  const addQuestion = (type: SurveyQuestion['type']) => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'single' || type === 'multiple' ? ['Opção 1', 'Opção 2'] : undefined,
      required: false
    };
    setSurveyData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (id: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const addOption = (questionId: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId && q.options 
          ? { ...q, options: [...q.options, `Opção ${q.options.length + 1}`] }
          : q
      )
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId && q.options 
          ? { ...q, options: q.options.map((o, i) => i === optionIndex ? value : o) }
          : q
      )
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setSurveyData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId && q.options && q.options.length > 2
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    }));
  };

  const getQuestionIcon = (type: SurveyQuestion['type']) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'single': return <ListOrdered className="h-4 w-4" />;
      case 'multiple': return <CheckSquare className="h-4 w-4" />;
      case 'rating': return <Star className="h-4 w-4" />;
      case 'nps': return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getQuestionTypeLabel = (type: SurveyQuestion['type']) => {
    switch (type) {
      case 'text': return 'Texto Livre';
      case 'single': return 'Escolha Única';
      case 'multiple': return 'Múltipla Escolha';
      case 'rating': return 'Avaliação (1-5)';
      case 'nps': return 'NPS (0-10)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Survey Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Criar Pesquisa
          </CardTitle>
          <CardDescription>
            Crie pesquisas para coletar feedback dos seus alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Pesquisa</Label>
            <Input
              id="title"
              placeholder="Ex: Pesquisa de Satisfação do Curso"
              value={surveyData.title}
              onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o objetivo da pesquisa..."
              rows={2}
              value={surveyData.description}
              onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={surveyData.showProgressBar}
                onCheckedChange={(checked) => setSurveyData(prev => ({ ...prev, showProgressBar: checked }))}
              />
              <Label>Mostrar barra de progresso</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={surveyData.allowAnonymous}
                onCheckedChange={(checked) => setSurveyData(prev => ({ ...prev, allowAnonymous: checked }))}
              />
              <Label>Permitir respostas anônimas</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Question Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addQuestion('text')}>
              <Type className="h-4 w-4 mr-2" />
              Texto Livre
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion('single')}>
              <ListOrdered className="h-4 w-4 mr-2" />
              Escolha Única
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion('multiple')}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Múltipla Escolha
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion('rating')}>
              <Star className="h-4 w-4 mr-2" />
              Avaliação (1-5)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion('nps')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              NPS (0-10)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {surveyData.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Badge variant="outline" className="gap-1">
                    {getQuestionIcon(question.type)}
                    {getQuestionTypeLabel(question.type)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Pergunta {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                    />
                    <Label className="text-sm">Obrigatória</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Digite a pergunta..."
                value={question.question}
                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
              />

              {/* Options for single/multiple choice */}
              {(question.type === 'single' || question.type === 'multiple') && question.options && (
                <div className="space-y-2">
                  <Label>Opções</Label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                        placeholder={`Opção ${optionIndex + 1}`}
                      />
                      {question.options && question.options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(question.id, optionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(question.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                </div>
              )}

              {/* Rating preview */}
              {question.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-6 w-6 text-muted-foreground" />
                  ))}
                </div>
              )}

              {/* NPS preview */}
              {question.type === 'nps' && (
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button key={num} variant="outline" size="sm" className="w-8 h-8 p-0">
                      {num}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      {surveyData.questions.length > 0 && (
        <div className="flex gap-4">
          <Button onClick={() => onSave?.(surveyData)} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar Pesquisa
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Pré-visualizar
          </Button>
        </div>
      )}
    </div>
  );
};

export default SurveyBuilder;
