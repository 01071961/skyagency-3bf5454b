import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, ClipboardList, Users, Search, Filter, FileSpreadsheet, Calendar, Weight, BookOpen, Wand2, Sparkles, CheckCircle, AlertCircle, Award, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  position?: number;
}

interface Evaluation {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  peso: number;
  data_aplicacao: string | null;
  nota_maxima: number;
  nota_minima_aprovacao: number;
  is_active: boolean;
  modulo_id: string | null;
  product_id: string | null;
  created_at: string;
  modulo?: { name: string };
  product?: { name: string };
  generates_certificate?: boolean;
  certificate_template_id?: string | null;
}

interface Module {
  id: string;
  name: string;
  product_id: string;
}

interface Product {
  id: string;
  name: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
}

export default function EvaluationsManager() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGradesDialogOpen, setIsGradesDialogOpen] = useState(false);
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    tipo: 'prova',
    peso: 1,
    data_aplicacao: '',
    nota_maxima: 10,
    nota_minima_aprovacao: 6,
    modulo_id: '',
    product_id: '',
    generates_certificate: false,
    certificate_template_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (form.product_id) {
      setFilteredModules(modules.filter(m => m.product_id === form.product_id));
    } else {
      setFilteredModules([]);
    }
  }, [form.product_id, modules]);

  const fetchData = async () => {
    try {
      const [evalRes, prodRes, modRes, certRes] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('*, modulo:product_modules(name), product:products(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name')
          .eq('product_type', 'course')
          .eq('status', 'published'),
        supabase
          .from('product_modules')
          .select('id, name, product_id')
          .order('position'),
        supabase
          .from('certificate_templates')
          .select('id, name')
          .eq('is_active', true)
      ]);

      if (evalRes.data) setEvaluations(evalRes.data as unknown as Evaluation[]);
      if (prodRes.data) setProducts(prodRes.data);
      if (modRes.data) setModules(modRes.data);
      if (certRes.data) setCertificateTemplates(certRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo || !form.modulo_id) {
      toast.error('Preencha título e módulo');
      return;
    }

    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        tipo: form.tipo,
        peso: form.peso,
        data_aplicacao: form.data_aplicacao || null,
        nota_maxima: form.nota_maxima,
        nota_minima_aprovacao: form.nota_minima_aprovacao,
        modulo_id: form.modulo_id,
        product_id: form.product_id,
        generates_certificate: form.generates_certificate,
        certificate_template_id: form.certificate_template_id || null
      };

      if (selectedEvaluation) {
        const { error } = await supabase
          .from('avaliacoes')
          .update(payload)
          .eq('id', selectedEvaluation.id);
        if (error) throw error;
        toast.success('Avaliação atualizada!');
      } else {
        const { error } = await supabase
          .from('avaliacoes')
          .insert(payload);
        if (error) throw error;
        toast.success('Avaliação criada!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Erro ao salvar avaliação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      const { error } = await supabase
        .from('avaliacoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Avaliação excluída!');
      fetchData();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error('Erro ao excluir avaliação');
    }
  };

  const handleEdit = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setForm({
      titulo: evaluation.titulo,
      descricao: evaluation.descricao || '',
      tipo: evaluation.tipo,
      peso: evaluation.peso,
      data_aplicacao: evaluation.data_aplicacao || '',
      nota_maxima: evaluation.nota_maxima,
      nota_minima_aprovacao: evaluation.nota_minima_aprovacao,
      modulo_id: evaluation.modulo_id || '',
      product_id: evaluation.product_id || '',
      generates_certificate: evaluation.generates_certificate || false,
      certificate_template_id: evaluation.certificate_template_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenQuestions = async (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsQuestionsDialogOpen(true);
    setIsLoadingQuestions(true);
    
    try {
      const { data, error } = await supabase
        .from('avaliacao_questoes')
        .select('*')
        .eq('avaliacao_id', evaluation.id)
        .order('position');
      
      if (error) throw error;
      setQuestions(data?.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options as string[],
        correct_index: q.correct_index,
        explanation: q.explanation || undefined,
        difficulty: q.difficulty || 'medium',
        topic: q.topic || undefined,
        position: q.position
      })) || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Erro ao carregar questões');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!selectedEvaluation) return;
    
    try {
      // Delete existing questions
      await supabase
        .from('avaliacao_questoes')
        .delete()
        .eq('avaliacao_id', selectedEvaluation.id);
      
      // Insert new questions
      if (questions.length > 0) {
        const { error } = await supabase
          .from('avaliacao_questoes')
          .insert(questions.map((q, index) => ({
            avaliacao_id: selectedEvaluation.id,
            question: q.question,
            options: q.options,
            correct_index: q.correct_index,
            explanation: q.explanation || null,
            difficulty: q.difficulty || 'medium',
            topic: q.topic || null,
            position: index
          })));
        
        if (error) throw error;
      }
      
      toast.success(`${questions.length} questões salvas com sucesso!`);
      setIsQuestionsDialogOpen(false);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Erro ao salvar questões');
    }
  };

  const handleOpenGrades = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsGradesDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedEvaluation(null);
    setForm({
      titulo: '',
      descricao: '',
      tipo: 'prova',
      peso: 1,
      data_aplicacao: '',
      nota_maxima: 10,
      nota_minima_aprovacao: 6,
      modulo_id: '',
      product_id: '',
      generates_certificate: false,
      certificate_template_id: ''
    });
  };

  const filteredEvaluations = evaluations.filter(e => {
    if (filterProduct !== 'all' && e.product_id !== filterProduct) return false;
    if (filterModule !== 'all' && e.modulo_id !== filterModule) return false;
    if (searchTerm && !e.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      prova: { label: 'Prova', variant: 'default' },
      trabalho: { label: 'Trabalho', variant: 'secondary' },
      quiz: { label: 'Quiz', variant: 'outline' },
      projeto: { label: 'Projeto', variant: 'secondary' }
    };
    return tipos[tipo] || { label: tipo, variant: 'outline' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Avaliações</h2>
          <p className="text-muted-foreground">Gerencie provas, trabalhos e quizzes</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar avaliação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-[200px]">
                <BookOpen className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {modules
                  .filter(m => filterProduct === 'all' || m.product_id === filterProduct)
                  .map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avaliação</TableHead>
                <TableHead>Curso/Módulo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Peso</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma avaliação encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvaluations.map(evaluation => {
                  const tipoInfo = getTipoLabel(evaluation.tipo);
                  return (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{evaluation.titulo}</p>
                          {evaluation.descricao && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {evaluation.descricao}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{evaluation.product?.name}</p>
                          <p className="text-muted-foreground">{evaluation.modulo?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tipoInfo.variant}>{tipoInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          <Weight className="w-3 h-3 mr-1" />
                          {evaluation.peso}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {evaluation.data_aplicacao ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(evaluation.data_aplicacao), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenQuestions(evaluation)}
                          >
                            <HelpCircle className="w-4 h-4 mr-1" />
                            Questões
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenGrades(evaluation)}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Notas
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(evaluation)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(evaluation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEvaluation ? 'Editar Avaliação' : 'Nova Avaliação'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Prova Final - Módulo 1"
                />
              </div>
              
              <div>
                <Label>Curso *</Label>
                <Select 
                  value={form.product_id} 
                  onValueChange={(v) => setForm({ ...form, product_id: v, modulo_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Módulo *</Label>
                <Select 
                  value={form.modulo_id} 
                  onValueChange={(v) => setForm({ ...form, modulo_id: v })}
                  disabled={!form.product_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredModules.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prova">Prova</SelectItem>
                    <SelectItem value="trabalho">Trabalho</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="projeto">Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Peso</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3"
                  value={form.peso}
                  onChange={(e) => setForm({ ...form, peso: parseFloat(e.target.value) || 1 })}
                />
              </div>
              
              <div>
                <Label>Data de Aplicação</Label>
                <Input
                  type="date"
                  value={form.data_aplicacao}
                  onChange={(e) => setForm({ ...form, data_aplicacao: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Nota Máxima</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.nota_maxima}
                  onChange={(e) => setForm({ ...form, nota_maxima: parseFloat(e.target.value) || 10 })}
                />
              </div>
              
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Instruções ou observações sobre a avaliação..."
                  rows={3}
                />
              </div>

              {/* Certificate Section */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <Label className="text-base font-medium">Gerar Certificado</Label>
                  </div>
                  <Switch
                    checked={form.generates_certificate}
                    onCheckedChange={(checked) => setForm({ ...form, generates_certificate: checked })}
                  />
                </div>
                {form.generates_certificate && (
                  <div>
                    <Label>Template do Certificado</Label>
                    <Select 
                      value={form.certificate_template_id} 
                      onValueChange={(v) => setForm({ ...form, certificate_template_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificateTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Alunos aprovados receberão o certificado automaticamente
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedEvaluation ? 'Salvar Alterações' : 'Criar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grades Dialog */}
      {selectedEvaluation && (
        <GradesDialog
          open={isGradesDialogOpen}
          onOpenChange={setIsGradesDialogOpen}
          evaluation={selectedEvaluation}
        />
      )}

      {/* Questions Dialog */}
      {selectedEvaluation && (
        <QuestionsDialog
          open={isQuestionsDialogOpen}
          onOpenChange={setIsQuestionsDialogOpen}
          evaluation={selectedEvaluation}
          questions={questions}
          setQuestions={setQuestions}
          isLoading={isLoadingQuestions}
          onSave={handleSaveQuestions}
        />
      )}
    </div>
  );
}

// Separate component for grades management
function GradesDialog({ 
  open, 
  onOpenChange, 
  evaluation 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  evaluation: Evaluation;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, { nota: number | null; observacoes: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && evaluation) {
      fetchStudentsAndGrades();
    }
  }, [open, evaluation]);

  const fetchStudentsAndGrades = async () => {
    setIsLoading(true);
    try {
      // Fetch enrolled students
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id, profiles:user_id(id, name, email)')
        .eq('product_id', evaluation.product_id)
        .eq('status', 'active');

      // Fetch existing grades
      const { data: existingGrades } = await supabase
        .from('notas_alunos')
        .select('*')
        .eq('avaliacao_id', evaluation.id);

      if (enrollments) {
        const studentList = enrollments.map((e: any) => ({
          user_id: e.user_id,
          name: e.profiles?.name || 'Aluno',
          email: e.profiles?.email || ''
        }));
        setStudents(studentList);

        // Initialize grades state
        const gradesMap: Record<string, { nota: number | null; observacoes: string }> = {};
        studentList.forEach((s: any) => {
          const existingGrade = existingGrades?.find(g => g.user_id === s.user_id);
          gradesMap[s.user_id] = {
            nota: existingGrade?.nota ?? null,
            observacoes: existingGrade?.observacoes || ''
          };
        });
        setGrades(gradesMap);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = (userId: string, nota: number | null) => {
    setGrades(prev => ({
      ...prev,
      [userId]: { ...prev[userId], nota }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const upserts = Object.entries(grades)
        .filter(([_, g]) => g.nota !== null)
        .map(([userId, g]) => ({
          avaliacao_id: evaluation.id,
          user_id: userId,
          nota: g.nota,
          observacoes: g.observacoes || null
        }));

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('notas_alunos')
          .upsert(upserts, { onConflict: 'avaliacao_id,user_id' });

        if (error) throw error;
      }

      toast.success(`${upserts.length} notas salvas com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Erro ao salvar notas');
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeStatus = (nota: number | null) => {
    if (nota === null) return null;
    return nota >= evaluation.nota_minima_aprovacao ? 'approved' : 'failed';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Lançar Notas - {evaluation.titulo}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum aluno matriculado neste curso</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-center w-32">Nota (0-{evaluation.nota_maxima})</TableHead>
                  <TableHead className="text-center w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => {
                  const grade = grades[student.user_id];
                  const status = getGradeStatus(grade?.nota);
                  
                  return (
                    <TableRow key={student.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={evaluation.nota_maxima}
                          step="0.1"
                          value={grade?.nota ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                            handleGradeChange(student.user_id, val);
                          }}
                          className="text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {status === 'approved' && (
                          <Badge className="bg-green-500">Aprovado</Badge>
                        )}
                        {status === 'failed' && (
                          <Badge variant="destructive">Reprovado</Badge>
                        )}
                        {status === null && (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
            <span>Nota mínima: {evaluation.nota_minima_aprovacao}</span>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || students.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Todas as Notas'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Questions management dialog with AI generation
function QuestionsDialog({ 
  open, 
  onOpenChange, 
  evaluation,
  questions,
  setQuestions,
  isLoading,
  onSave
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  evaluation: Evaluation;
  questions: QuizQuestion[];
  setQuestions: (questions: QuizQuestion[]) => void;
  isLoading: boolean;
  onSave: () => void;
}) {
  const [activeTab, setActiveTab] = useState('questions');
  const [generating, setGenerating] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [customContent, setCustomContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateWithAI = async () => {
    const content = customContent.trim();
    
    if (!content && !evaluation.titulo) {
      toast.error('Forneça o conteúdo ou título da avaliação para gerar as questões');
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz-questions', {
        body: {
          lessonTitle: evaluation.titulo,
          lessonContent: content || `Avaliação: ${evaluation.titulo}. ${evaluation.descricao || ''}`,
          numberOfQuestions,
          difficulty
        }
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions([...questions, ...data.questions.map((q: any, i: number) => ({
          ...q,
          position: questions.length + i
        }))]);
        setActiveTab('questions');
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

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'easy': return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Fácil</Badge>;
      case 'hard': return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Difícil</Badge>;
      default: return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Médio</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Questões - {evaluation.titulo}
          </DialogTitle>
          <DialogDescription>
            Gerencie as questões da avaliação ou gere automaticamente com IA
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">
                Questões ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="generate">
                <Wand2 className="w-4 h-4 mr-2" />
                Gerar com IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="flex-1 overflow-y-auto mt-4 space-y-3">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma questão adicionada</p>
                  <p className="text-sm">Use a aba "Gerar com IA" para criar questões automaticamente</p>
                </div>
              ) : (
                questions.map((q, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{index + 1}.</span>
                        <span className="font-medium">{q.question}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDifficultyBadge(q.difficulty)}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                ))
              )}
            </TabsContent>

            <TabsContent value="generate" className="mt-4 space-y-4">
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
                <Label>Conteúdo Base</Label>
                <Textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder={`Cole aqui o conteúdo da matéria, texto do módulo, ou tópicos específicos para gerar questões mais precisas baseadas na avaliação "${evaluation.titulo}".`}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto mais conteúdo você fornecer, mais precisas serão as questões geradas
                </p>
              </div>

              {questions.length > 0 && (
                <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Esta avaliação já tem {questions.length} questões. 
                      As novas serão adicionadas às existentes.
                    </span>
                  </div>
                </Card>
              )}

              <Button 
                onClick={handleGenerateWithAI} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando questões...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar {numberOfQuestions} Questões com IA
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
            <span>{questions.length} questões</span>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Questões'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}