import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  ClipboardCheck, Plus, Clock, Target, Users, 
  Edit, Trash2, Eye, Play, BarChart3, CheckCircle2,
  XCircle, Timer, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Certification = 'ancord' | 'cea' | 'cfp' | 'cpa_10' | 'cpa_20' | 'cnpi' | 'other';
type ExamStatus = 'draft' | 'published' | 'archived';

interface Exam {
  id: string;
  product_id: string | null;
  certification: Certification;
  title: string;
  description: string | null;
  exam_type: string;
  total_questions: number;
  passing_score: number;
  time_limit_minutes: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_answers_after: boolean;
  allow_review: boolean;
  max_attempts: number | null;
  status: ExamStatus;
  is_free: boolean;
  created_at: string;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  passed: boolean | null;
  status: string;
}

const CERTIFICATION_INFO: Record<Certification, { label: string; color: string; icon: string }> = {
  ancord: { label: 'ANCORD', color: 'bg-blue-500', icon: '📊' },
  cea: { label: 'CEA', color: 'bg-green-500', icon: '💼' },
  cfp: { label: 'CFP', color: 'bg-purple-500', icon: '🎯' },
  cpa_10: { label: 'CPA-10', color: 'bg-orange-500', icon: '📈' },
  cpa_20: { label: 'CPA-20', color: 'bg-red-500', icon: '📉' },
  cnpi: { label: 'CNPI', color: 'bg-teal-500', icon: '🔬' },
  other: { label: 'Outro', color: 'bg-gray-500', icon: '📚' },
};

const STATUS_INFO: Record<ExamStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-800' },
  archived: { label: 'Arquivado', color: 'bg-red-100 text-red-800' },
};

export default function ExamManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const [form, setForm] = useState({
    certification: 'ancord' as Certification,
    title: '',
    description: '',
    exam_type: 'practice',
    total_questions: 50,
    passing_score: 70,
    time_limit_minutes: 120,
    shuffle_questions: true,
    shuffle_options: true,
    show_answers_after: true,
    allow_review: true,
    max_attempts: null as number | null,
    is_free: false,
    status: 'draft' as ExamStatus,
  });

  // Fetch exams
  const { data: exams, isLoading } = useQuery({
    queryKey: ['financial-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_exams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Exam[];
    },
  });

  // Fetch attempts for selected exam
  const { data: attempts } = useQuery({
    queryKey: ['exam-attempts', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam) return [];
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', selectedExam.id)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as ExamAttempt[];
    },
    enabled: !!selectedExam,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['exam-stats'],
    queryFn: async () => {
      const { data: examData } = await supabase
        .from('financial_exams')
        .select('status');

      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .select('status, passed');

      return {
        totalExams: examData?.length || 0,
        publishedExams: examData?.filter(e => e.status === 'published').length || 0,
        totalAttempts: attemptData?.length || 0,
        passedAttempts: attemptData?.filter(a => a.passed).length || 0,
        passRate: attemptData?.length 
          ? ((attemptData.filter(a => a.passed).length / attemptData.length) * 100).toFixed(1)
          : '0',
      };
    },
  });

  // Save exam mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const { id, ...rest } = data;
      
      if (id) {
        const { data: result, error } = await supabase
          .from('financial_exams')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('financial_exams')
          .insert([rest])
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast.success(editingExam ? 'Simulado atualizado!' : 'Simulado criado!');
      queryClient.invalidateQueries({ queryKey: ['financial-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
      setIsCreateOpen(false);
      setEditingExam(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Delete exam mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_exams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Simulado excluído!');
      queryClient.invalidateQueries({ queryKey: ['financial-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-stats'] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ExamStatus }) => {
      const { error } = await supabase
        .from('financial_exams')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['financial-exams'] });
    },
  });

  const resetForm = () => {
    setForm({
      certification: 'ancord',
      title: '',
      description: '',
      exam_type: 'practice',
      total_questions: 50,
      passing_score: 70,
      time_limit_minutes: 120,
      shuffle_questions: true,
      shuffle_options: true,
      show_answers_after: true,
      allow_review: true,
      max_attempts: null,
      is_free: false,
      status: 'draft',
    });
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      certification: exam.certification,
      title: exam.title,
      description: exam.description || '',
      exam_type: exam.exam_type,
      total_questions: exam.total_questions,
      passing_score: exam.passing_score,
      time_limit_minutes: exam.time_limit_minutes,
      shuffle_questions: exam.shuffle_questions,
      shuffle_options: exam.shuffle_options,
      show_answers_after: exam.show_answers_after,
      allow_review: exam.allow_review,
      max_attempts: exam.max_attempts,
      is_free: exam.is_free,
      status: exam.status,
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            Simulados & Exames
          </h2>
          <p className="text-muted-foreground">
            Crie e gerencie simulados para certificações financeiras
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingExam(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Simulado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExam ? 'Editar Simulado' : 'Criar Novo Simulado'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certificação</Label>
                  <Select 
                    value={form.certification} 
                    onValueChange={(v) => setForm(prev => ({ ...prev, certification: v as Certification }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CERTIFICATION_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.icon} {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Exame</Label>
                  <Select 
                    value={form.exam_type} 
                    onValueChange={(v) => setForm(prev => ({ ...prev, exam_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice">Prática</SelectItem>
                      <SelectItem value="mock">Simulado Oficial</SelectItem>
                      <SelectItem value="official_simulation">Simulação Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Título do Simulado</Label>
                <Input 
                  placeholder="Ex: ANCORD - Simulado Completo 2025"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  placeholder="Descrição do simulado..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nº de Questões</Label>
                  <Input 
                    type="number" 
                    min={5} 
                    max={100}
                    value={form.total_questions}
                    onChange={(e) => setForm(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 50 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nota de Aprovação (%)</Label>
                  <Input 
                    type="number" 
                    min={50} 
                    max={100}
                    value={form.passing_score}
                    onChange={(e) => setForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 70 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tempo (minutos)</Label>
                  <Input 
                    type="number" 
                    min={30} 
                    max={300}
                    value={form.time_limit_minutes}
                    onChange={(e) => setForm(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 120 }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Embaralhar Questões</Label>
                    <p className="text-xs text-muted-foreground">Ordem aleatória</p>
                  </div>
                  <Switch 
                    checked={form.shuffle_questions}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, shuffle_questions: v }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Embaralhar Alternativas</Label>
                    <p className="text-xs text-muted-foreground">Opções aleatórias</p>
                  </div>
                  <Switch 
                    checked={form.shuffle_options}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, shuffle_options: v }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Mostrar Gabarito</Label>
                    <p className="text-xs text-muted-foreground">Após finalizar</p>
                  </div>
                  <Switch 
                    checked={form.show_answers_after}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, show_answers_after: v }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Permitir Revisão</Label>
                    <p className="text-xs text-muted-foreground">Durante o exame</p>
                  </div>
                  <Switch 
                    checked={form.allow_review}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, allow_review: v }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Simulado Gratuito</Label>
                  <p className="text-xs text-muted-foreground">Acesso liberado para todos</p>
                </div>
                <Switch 
                  checked={form.is_free}
                  onCheckedChange={(v) => setForm(prev => ({ ...prev, is_free: v }))}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => saveMutation.mutate({
                  ...form,
                  id: editingExam?.id,
                })}
                disabled={!form.title || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando...' : (editingExam ? 'Atualizar Simulado' : 'Criar Simulado')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalExams || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Simulados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.publishedExams || 0}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalAttempts || 0}</p>
                <p className="text-xs text-muted-foreground">Tentativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.passRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : exams?.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Nenhum simulado criado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro simulado para certificação financeira
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Simulado
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Simulados</CardTitle>
            <CardDescription>
              Gerencie todos os seus simulados e exames
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Simulado</TableHead>
                  <TableHead>Certificação</TableHead>
                  <TableHead>Questões</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams?.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        {exam.is_free && (
                          <Badge variant="outline" className="mt-1 text-green-600">
                            Gratuito
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={CERTIFICATION_INFO[exam.certification].color}>
                        {CERTIFICATION_INFO[exam.certification].icon} {CERTIFICATION_INFO[exam.certification].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {exam.total_questions}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {exam.time_limit_minutes}min
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={exam.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: exam.id, status: v as ExamStatus })}
                      >
                        <SelectTrigger className="w-[130px]">
                          <Badge className={STATUS_INFO[exam.status].color}>
                            {STATUS_INFO[exam.status].label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              {info.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedExam(exam)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(exam)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Excluir este simulado?')) {
                              deleteMutation.mutate(exam.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Attempts Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tentativas - {selectedExam?.title}
            </DialogTitle>
          </DialogHeader>
          
          {attempts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tentativa registrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts?.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      {new Date(attempt.started_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={attempt.status === 'completed' ? 'default' : 'secondary'}>
                        {attempt.status === 'completed' ? 'Finalizado' : 
                         attempt.status === 'in_progress' ? 'Em andamento' : 'Abandonado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {attempt.score !== null ? `${attempt.score}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {attempt.passed !== null && (
                        <Badge className={attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {attempt.passed ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Reprovado</>
                          )}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
