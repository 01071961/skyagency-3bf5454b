import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, GraduationCap, FileText, 
  Plus, Trash2, Save, ArrowLeft, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIQuizGenerator from '@/components/admin/AIQuizGenerator';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

interface CertificationForm {
  name: string;
  description: string;
  certification_type: 'course_completion' | 'financial' | 'module';
  product_id: string | null;
  module_id: string | null;
  passing_score: number;
  time_limit_minutes: number;
  questions: QuizQuestion[];
  is_active: boolean;
}

export default function CertificationCreator({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<CertificationForm>({
    name: '',
    description: '',
    certification_type: 'course_completion',
    product_id: null,
    module_id: null,
    passing_score: 70,
    time_limit_minutes: 60,
    questions: [],
    is_active: true,
  });
  
  const [courses, setCourses] = useState<Array<{id: string; name: string}>>([]);
  const [modules, setModules] = useState<Array<{id: string; name: string; position: number}>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (form.product_id) {
      loadModules(form.product_id);
    } else {
      setModules([]);
    }
  }, [form.product_id]);

  const loadCourses = async () => {
    const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?type=eq.course&is_active=eq.true&select=id,name&order=name`, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      }
    }).then(r => r.json()).catch(() => []);
    
    if (Array.isArray(result)) {
      setCourses(result);
    }
  };

  const loadModules = async (productId: string) => {
    const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/product_modules?product_id=eq.${productId}&select=id,name,position&order=position`, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      }
    }).then(r => r.json()).catch(() => []);
    
    if (Array.isArray(result)) {
      setModules(result);
    }
  };

  const handleAIQuestionsGenerated = (generatedQuestions: QuizQuestion[]) => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, ...generatedQuestions]
    }));
    
    toast.success(`${generatedQuestions.length} questões geradas com IA!`);
  };

  const addQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
      }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === qIndex 
          ? { ...q, options: q.options.map((o, oi) => oi === optIndex ? value : o) }
          : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome da certificação é obrigatório');
      return;
    }

    if (form.questions.length === 0) {
      toast.error('Adicione pelo menos uma questão');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('avaliacoes')
        .insert({
          titulo: form.name,
          descricao: form.description,
          tipo: form.certification_type,
          product_id: form.product_id,
          modulo_id: form.module_id,
          nota_minima_aprovacao: form.passing_score,
          nota_maxima: 100,
          peso: 1,
          is_active: form.is_active,
        });

      if (error) throw error;

      toast.success('Certificação criada com sucesso!');
      onBack();
    } catch (error: any) {
      console.error('Error saving certification:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Criar Certificação
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure a avaliação para emissão de certificado
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Certificação'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome da Certificação *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Certificação ANCORD"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva a certificação..."
                rows={3}
              />
            </div>

            <div>
              <Label>Tipo de Certificação</Label>
              <Select
                value={form.certification_type}
                onValueChange={(v: 'course_completion' | 'financial' | 'module') => setForm(prev => ({ ...prev, certification_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_completion">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Conclusão de Curso
                    </span>
                  </SelectItem>
                  <SelectItem value="financial">
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certificação Financeira
                    </span>
                  </SelectItem>
                  <SelectItem value="module">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Módulo Específico
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(form.certification_type === 'course_completion' || form.certification_type === 'module') && (
              <>
                <div>
                  <Label>Vincular a Curso</Label>
                  <Select
                    value={form.product_id || ''}
                    onValueChange={(v) => setForm(prev => ({ ...prev, product_id: v || null, module_id: null }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.certification_type === 'module' && form.product_id && (
                  <div>
                    <Label>Vincular a Módulo</Label>
                    <Select
                      value={form.module_id || ''}
                      onValueChange={(v) => setForm(prev => ({ ...prev, module_id: v || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map(mod => (
                          <SelectItem key={mod.id} value={mod.id}>
                            {mod.position}. {mod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nota Mínima (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passing_score}
                  onChange={(e) => setForm(prev => ({ ...prev, passing_score: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Tempo (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.time_limit_minutes}
                  onChange={(e) => setForm(prev => ({ ...prev, time_limit_minutes: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Certificação Ativa</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Questões ({form.questions.length})
              </CardTitle>
              <div className="flex gap-2">
                <AIQuizGenerator
                  lessonTitle={form.name || 'Certificação'}
                  lessonContent={form.description || 'Conteúdo da certificação'}
                  onQuestionsGenerated={handleAIQuestionsGenerated}
                  existingQuestions={form.questions}
                />
                <Button variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Manual
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {form.questions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma questão adicionada</p>
                <p className="text-sm">Use a IA para gerar ou adicione manualmente</p>
              </div>
            ) : (
              form.questions.map((q, qIndex) => (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label>Questão {qIndex + 1}</Label>
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Digite a pergunta..."
                        rows={2}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correct_index === optIndex}
                          onChange={() => updateQuestion(qIndex, 'correct_index', optIndex)}
                          className="w-4 h-4"
                        />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Opção ${String.fromCharCode(65 + optIndex)}`}
                          className={q.correct_index === optIndex ? 'border-green-500' : ''}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Explicação (opcional)</Label>
                    <Input
                      value={q.explanation || ''}
                      onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                      placeholder="Explique a resposta correta..."
                    />
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
