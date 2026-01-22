'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Edit, BookOpen, Clock, Target, 
  Shuffle, Eye, RotateCcw, GripVertical, Save,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvaluationsStepProps {
  productId: string;
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
  is_active: boolean;
}

interface SimulatorQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  order_index: number;
}

const defaultSimulator: Partial<Simulator> = {
  title: '',
  description: '',
  total_questions: 10,
  time_limit_minutes: 60,
  passing_score: 70,
  shuffle_questions: true,
  shuffle_options: true,
  allow_review: true,
  show_correct_answers: false,
  max_attempts: null,
  is_active: true
};

const defaultQuestion: SimulatorQuestion = {
  question_text: '',
  question_type: 'multiple_choice',
  options: ['', '', '', ''],
  correct_answer: '',
  explanation: '',
  points: 1,
  order_index: 0
};

export default function EvaluationsStep({ productId }: EvaluationsStepProps) {
  const queryClient = useQueryClient();
  const [simulatorDialogOpen, setSimulatorDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingSimulator, setEditingSimulator] = useState<Simulator | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SimulatorQuestion | null>(null);
  const [selectedSimulatorId, setSelectedSimulatorId] = useState<string | null>(null);
  const [simulatorForm, setSimulatorForm] = useState(defaultSimulator);
  const [questionForm, setQuestionForm] = useState<SimulatorQuestion>(defaultQuestion);

  // Fetch simulators
  const { data: simulators, isLoading: loadingSimulators } = useQuery({
    queryKey: ['product-simulators', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_simulators')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Simulator[];
    },
    enabled: !!productId
  });

  // Fetch questions for selected simulator
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['simulator-questions', selectedSimulatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_questions')
        .select('*')
        .eq('simulator_id', selectedSimulatorId)
        .order('order_index');
      
      if (error) throw error;
      return data as SimulatorQuestion[];
    },
    enabled: !!selectedSimulatorId
  });

  // Create/Update simulator
  const simulatorMutation = useMutation({
    mutationFn: async (data: Partial<Simulator>) => {
      if (editingSimulator?.id) {
        const { error } = await supabase
          .from('exam_simulators')
          .update({
            title: data.title,
            description: data.description,
            total_questions: data.total_questions,
            time_limit_minutes: data.time_limit_minutes,
            passing_score: data.passing_score,
            shuffle_questions: data.shuffle_questions,
            shuffle_options: data.shuffle_options,
            allow_review: data.allow_review,
            show_correct_answers: data.show_correct_answers,
            max_attempts: data.max_attempts,
            is_active: data.is_active
          })
          .eq('id', editingSimulator.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exam_simulators')
          .insert({
            product_id: productId,
            title: data.title || '',
            description: data.description,
            total_questions: data.total_questions,
            time_limit_minutes: data.time_limit_minutes,
            passing_score: data.passing_score,
            shuffle_questions: data.shuffle_questions,
            shuffle_options: data.shuffle_options,
            allow_review: data.allow_review,
            show_correct_answers: data.show_correct_answers,
            max_attempts: data.max_attempts,
            is_active: data.is_active
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-simulators', productId] });
      setSimulatorDialogOpen(false);
      setEditingSimulator(null);
      setSimulatorForm(defaultSimulator);
      toast.success(editingSimulator ? 'Simulado atualizado!' : 'Simulado criado!');
    },
    onError: (error) => {
      console.error('Simulator mutation error:', error);
      toast.error('Erro ao salvar simulado');
    }
  });

  // Delete simulator
  const deleteSimulatorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_simulators')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-simulators', productId] });
      if (selectedSimulatorId) setSelectedSimulatorId(null);
      toast.success('Simulado excluído!');
    }
  });

  // Create/Update question
  const questionMutation = useMutation({
    mutationFn: async (data: SimulatorQuestion) => {
      if (data.id) {
        const { error } = await supabase
          .from('simulator_questions')
          .update({
            question_text: data.question_text,
            question_type: data.question_type,
            options: data.options,
            correct_answer: data.correct_answer,
            explanation: data.explanation,
            points: data.points,
            order_index: data.order_index
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('simulator_questions')
          .insert({
            simulator_id: selectedSimulatorId,
            ...data
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-questions', selectedSimulatorId] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      setQuestionForm(defaultQuestion);
      toast.success(editingQuestion ? 'Questão atualizada!' : 'Questão adicionada!');
    },
    onError: (error) => {
      console.error('Question mutation error:', error);
      toast.error('Erro ao salvar questão');
    }
  });

  // Delete question
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simulator_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulator-questions', selectedSimulatorId] });
      toast.success('Questão excluída!');
    }
  });

  const handleOpenSimulatorDialog = (simulator?: Simulator) => {
    if (simulator) {
      setEditingSimulator(simulator);
      setSimulatorForm(simulator);
    } else {
      setEditingSimulator(null);
      setSimulatorForm(defaultSimulator);
    }
    setSimulatorDialogOpen(true);
  };

  const handleOpenQuestionDialog = (question?: SimulatorQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm(question);
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        ...defaultQuestion,
        order_index: (questions?.length || 0) + 1
      });
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveSimulator = () => {
    if (!simulatorForm.title) {
      toast.error('Título é obrigatório');
      return;
    }
    simulatorMutation.mutate(simulatorForm);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question_text) {
      toast.error('Texto da questão é obrigatório');
      return;
    }
    if (!questionForm.correct_answer) {
      toast.error('Selecione a resposta correta');
      return;
    }
    questionMutation.mutate(questionForm);
  };

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  if (loadingSimulators) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Simulados e Avaliações</h3>
          <p className="text-sm text-muted-foreground">
            Crie simulados para testar os conhecimentos dos alunos
          </p>
        </div>
        <Button onClick={() => handleOpenSimulatorDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Simulado
        </Button>
      </div>

      {!simulators?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Nenhum simulado criado</h4>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Crie simulados para seus alunos praticarem e testarem seus conhecimentos
            </p>
            <Button variant="outline" onClick={() => handleOpenSimulatorDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Simulado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Simulators list */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Simulados ({simulators.length})
            </h4>
            {simulators.map((simulator) => (
              <Card 
                key={simulator.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedSimulatorId === simulator.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedSimulatorId(simulator.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{simulator.title}</h5>
                        {!simulator.is_active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      {simulator.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {simulator.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          {simulator.total_questions} questões
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {simulator.time_limit_minutes || '∞'} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {simulator.passing_score}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenSimulatorDialog(simulator)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Simulado</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza? Esta ação não pode ser desfeita. Todas as questões e tentativas serão removidas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteSimulatorMutation.mutate(simulator.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Questões {selectedSimulatorId && `(${questions?.length || 0})`}
              </h4>
              {selectedSimulatorId && (
                <Button size="sm" variant="outline" onClick={() => handleOpenQuestionDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            
            {!selectedSimulatorId ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Selecione um simulado para gerenciar as questões
                </CardContent>
              </Card>
            ) : loadingQuestions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : !questions?.length ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma questão adicionada</p>
                  <Button variant="outline" size="sm" onClick={() => handleOpenQuestionDialog()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Questão
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {questions.map((question, idx) => (
                  <Card key={question.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-mono">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{question.question_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {question.question_type === 'true_false' ? 'V/F' : 'Múltipla'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {question.points} pt{question.points !== 1 && 's'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenQuestionDialog(question)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Questão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta questão?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteQuestionMutation.mutate(question.id!)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulator Dialog */}
      <Dialog open={simulatorDialogOpen} onOpenChange={setSimulatorDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSimulator ? 'Editar Simulado' : 'Novo Simulado'}
            </DialogTitle>
            <DialogDescription>
              Configure as opções do simulado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={simulatorForm.title || ''}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, title: e.target.value })}
                placeholder="Ex: Simulado Final - Módulo 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={simulatorForm.description || ''}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, description: e.target.value })}
                placeholder="Descrição do simulado..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tempo (min)</Label>
                <Input
                  type="number"
                  value={simulatorForm.time_limit_minutes || ''}
                  onChange={(e) => setSimulatorForm({ 
                    ...simulatorForm, 
                    time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label>% Aprovação</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={simulatorForm.passing_score || 70}
                  onChange={(e) => setSimulatorForm({ 
                    ...simulatorForm, 
                    passing_score: parseInt(e.target.value) || 70 
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Máx. Tentativas</Label>
                <Input
                  type="number"
                  min={1}
                  value={simulatorForm.max_attempts || ''}
                  onChange={(e) => setSimulatorForm({ 
                    ...simulatorForm, 
                    max_attempts: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={simulatorForm.is_active}
                    onCheckedChange={(checked) => setSimulatorForm({ ...simulatorForm, is_active: checked })}
                  />
                  <span className="text-sm">{simulatorForm.is_active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Embaralhar questões</span>
                </div>
                <Switch
                  checked={simulatorForm.shuffle_questions}
                  onCheckedChange={(checked) => setSimulatorForm({ ...simulatorForm, shuffle_questions: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Embaralhar opções</span>
                </div>
                <Switch
                  checked={simulatorForm.shuffle_options}
                  onCheckedChange={(checked) => setSimulatorForm({ ...simulatorForm, shuffle_options: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Permitir revisão</span>
                </div>
                <Switch
                  checked={simulatorForm.allow_review}
                  onCheckedChange={(checked) => setSimulatorForm({ ...simulatorForm, allow_review: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Mostrar gabarito</span>
                </div>
                <Switch
                  checked={simulatorForm.show_correct_answers}
                  onCheckedChange={(checked) => setSimulatorForm({ ...simulatorForm, show_correct_answers: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSimulatorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSimulator} disabled={simulatorMutation.isPending}>
              {simulatorMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Editar Questão' : 'Nova Questão'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pergunta *</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="w-full h-9 px-3 rounded-md border bg-background"
                  value={questionForm.question_type}
                  onChange={(e) => {
                    const type = e.target.value as 'multiple_choice' | 'true_false';
                    setQuestionForm({ 
                      ...questionForm, 
                      question_type: type,
                      options: type === 'true_false' ? ['Verdadeiro', 'Falso'] : ['', '', '', '']
                    });
                  }}
                >
                  <option value="multiple_choice">Múltipla Escolha</option>
                  <option value="true_false">Verdadeiro/Falso</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Pontos</Label>
                <Input
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opções de Resposta</Label>
              <div className="space-y-2">
                {questionForm.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={questionForm.correct_answer === option && option !== ''}
                      onChange={() => setQuestionForm({ ...questionForm, correct_answer: option })}
                      className="w-4 h-4"
                      disabled={!option}
                    />
                    <Input
                      value={option}
                      onChange={(e) => updateQuestionOption(idx, e.target.value)}
                      placeholder={`Opção ${idx + 1}`}
                      disabled={questionForm.question_type === 'true_false'}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione o botão ao lado da resposta correta
              </p>
            </div>

            <div className="space-y-2">
              <Label>Explicação (opcional)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explicação da resposta correta..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuestion} disabled={questionMutation.isPending}>
              {questionMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
