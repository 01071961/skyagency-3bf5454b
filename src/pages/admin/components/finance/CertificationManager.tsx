import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Award, Plus, FileQuestion, BookOpen, TrendingUp, 
  Users, Target, Search, Filter, Edit, Trash2, Eye,
  GraduationCap, BarChart3, Clock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Certification = 'ancord' | 'cea' | 'cfp' | 'cpa_10' | 'cpa_20' | 'cnpi' | 'other';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface QuestionBank {
  id: string;
  certification: Certification;
  title: string;
  description: string | null;
  total_questions: number;
  is_active: boolean;
  created_at: string;
}

interface Question {
  id: string;
  bank_id: string;
  certification: Certification;
  topic: string;
  subtopic: string | null;
  question_text: string;
  question_type: string;
  options: { id: string; text: string; is_correct: boolean }[];
  explanation: string | null;
  difficulty: Difficulty;
  points: number;
  time_limit_seconds: number;
  tags: string[];
  usage_count: number;
  success_rate: number;
  is_active: boolean;
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

const DIFFICULTY_INFO: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'Difícil', color: 'bg-orange-100 text-orange-800' },
  expert: { label: 'Expert', color: 'bg-red-100 text-red-800' },
};

const ANCORD_TOPICS = [
  'Mercado de Capitais',
  'Renda Fixa',
  'Renda Variável',
  'Derivativos',
  'Fundos de Investimento',
  'Ética e Regulamentação',
  'Economia e Finanças',
  'Matemática Financeira',
  'Tributação',
  'Lavagem de Dinheiro',
];

export default function CertificationManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('banks');
  const [selectedCertification, setSelectedCertification] = useState<Certification | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateBankOpen, setIsCreateBankOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states
  const [bankForm, setBankForm] = useState({
    certification: 'ancord' as Certification,
    title: '',
    description: '',
  });

  const [questionForm, setQuestionForm] = useState({
    bank_id: '',
    certification: 'ancord' as Certification,
    topic: '',
    subtopic: '',
    question_text: '',
    question_type: 'multiple_choice',
    options: [
      { id: 'a', text: '', is_correct: false },
      { id: 'b', text: '', is_correct: false },
      { id: 'c', text: '', is_correct: false },
      { id: 'd', text: '', is_correct: false },
    ],
    explanation: '',
    difficulty: 'medium' as Difficulty,
    points: 1,
    time_limit_seconds: 120,
    tags: [] as string[],
  });

  // Fetch question banks
  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ['question-banks', selectedCertification],
    queryFn: async () => {
      let query = supabase
        .from('question_banks')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCertification !== 'all') {
        query = query.eq('certification', selectedCertification);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QuestionBank[];
    },
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['financial-questions', selectedBank?.id, searchQuery],
    queryFn: async () => {
      if (!selectedBank) return [];

      let query = supabase
        .from('financial_questions')
        .select('*')
        .eq('bank_id', selectedBank.id)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`question_text.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      })) as Question[];
    },
    enabled: !!selectedBank,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['certification-stats'],
    queryFn: async () => {
      const { data: bankStats } = await supabase
        .from('question_banks')
        .select('certification, total_questions')
        .eq('is_active', true);

      const { data: progressStats } = await supabase
        .from('certification_progress')
        .select('certification, exams_passed');

      const totalQuestions = bankStats?.reduce((acc, b) => acc + (b.total_questions || 0), 0) || 0;
      const totalPassed = progressStats?.reduce((acc, p) => acc + (p.exams_passed || 0), 0) || 0;

      return {
        totalBanks: bankStats?.length || 0,
        totalQuestions,
        totalPassed,
        byCertification: Object.keys(CERTIFICATION_INFO).reduce((acc, cert) => {
          acc[cert] = bankStats?.filter(b => b.certification === cert).reduce((sum, b) => sum + (b.total_questions || 0), 0) || 0;
          return acc;
        }, {} as Record<string, number>),
      };
    },
  });

  // Create bank mutation
  const createBankMutation = useMutation({
    mutationFn: async (data: typeof bankForm) => {
      const { data: result, error } = await supabase
        .from('question_banks')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Banco de questões criado!');
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
      setIsCreateBankOpen(false);
      setBankForm({ certification: 'ancord', title: '', description: '' });
    },
    onError: (error) => {
      toast.error('Erro ao criar banco: ' + error.message);
    },
  });

  // Create/Update question mutation
  const saveQuestionMutation = useMutation({
    mutationFn: async (data: typeof questionForm & { id?: string }) => {
      const { id, ...rest } = data;
      
      if (id) {
        const { data: result, error } = await supabase
          .from('financial_questions')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('financial_questions')
          .insert([rest])
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast.success(editingQuestion ? 'Questão atualizada!' : 'Questão criada!');
      queryClient.invalidateQueries({ queryKey: ['financial-questions'] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
      setIsCreateQuestionOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
    },
    onError: (error) => {
      toast.error('Erro ao salvar questão: ' + error.message);
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Questão excluída!');
      queryClient.invalidateQueries({ queryKey: ['financial-questions'] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
    },
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      bank_id: selectedBank?.id || '',
      certification: selectedBank?.certification || 'ancord',
      topic: '',
      subtopic: '',
      question_text: '',
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: '', is_correct: false },
        { id: 'b', text: '', is_correct: false },
        { id: 'c', text: '', is_correct: false },
        { id: 'd', text: '', is_correct: false },
      ],
      explanation: '',
      difficulty: 'medium',
      points: 1,
      time_limit_seconds: 120,
      tags: [],
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      bank_id: question.bank_id,
      certification: question.certification,
      topic: question.topic,
      subtopic: question.subtopic || '',
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options,
      explanation: question.explanation || '',
      difficulty: question.difficulty,
      points: question.points,
      time_limit_seconds: question.time_limit_seconds,
      tags: question.tags || [],
    });
    setIsCreateQuestionOpen(true);
  };

  const handleOptionChange = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
    setQuestionForm(prev => {
      const newOptions = [...prev.options];
      if (field === 'is_correct' && value === true) {
        // Desmarcar outras opções
        newOptions.forEach((opt, i) => {
          opt.is_correct = i === index;
        });
      } else {
        newOptions[index] = { ...newOptions[index], [field]: value };
      }
      return { ...prev, options: newOptions };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            Certificações Financeiras
          </h2>
          <p className="text-muted-foreground">
            Gerencie bancos de questões e simulados para ANCORD, CEA, CFP e mais
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCertification} onValueChange={(v) => setSelectedCertification(v as Certification | 'all')}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CERTIFICATION_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.icon} {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalBanks || 0}</p>
                <p className="text-xs text-muted-foreground">Bancos de Questões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileQuestion className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalQuestions || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Questões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPassed || 0}</p>
                <p className="text-xs text-muted-foreground">Aprovações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.byCertification?.ancord || 0}</p>
                <p className="text-xs text-muted-foreground">Questões ANCORD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="banks">Bancos de Questões</TabsTrigger>
          <TabsTrigger value="questions" disabled={!selectedBank}>
            Questões {selectedBank && `(${selectedBank.title})`}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar bancos..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isCreateBankOpen} onOpenChange={setIsCreateBankOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Banco
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Banco de Questões</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Certificação</Label>
                    <Select 
                      value={bankForm.certification} 
                      onValueChange={(v) => setBankForm(prev => ({ ...prev, certification: v as Certification }))}
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
                    <Label>Título do Banco</Label>
                    <Input 
                      placeholder="Ex: ANCORD - Módulo Renda Variável"
                      value={bankForm.title}
                      onChange={(e) => setBankForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      placeholder="Descrição do banco de questões..."
                      value={bankForm.description}
                      onChange={(e) => setBankForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => createBankMutation.mutate(bankForm)}
                    disabled={!bankForm.title || createBankMutation.isPending}
                  >
                    {createBankMutation.isPending ? 'Criando...' : 'Criar Banco'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {banksLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {banks?.map((bank) => (
                  <motion.div
                    key={bank.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedBank?.id === bank.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedBank(bank);
                        setActiveTab('questions');
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <Badge className={CERTIFICATION_INFO[bank.certification].color}>
                            {CERTIFICATION_INFO[bank.certification].icon} {CERTIFICATION_INFO[bank.certification].label}
                          </Badge>
                          <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                            {bank.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">{bank.title}</CardTitle>
                        {bank.description && (
                          <CardDescription className="line-clamp-2">{bank.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileQuestion className="w-4 h-4" />
                            {bank.total_questions} questões
                          </span>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver questões
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {selectedBank && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedBank(null); setActiveTab('banks'); }}>
                    ← Voltar
                  </Button>
                  <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar questões..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Dialog open={isCreateQuestionOpen} onOpenChange={(open) => {
                  setIsCreateQuestionOpen(open);
                  if (!open) {
                    setEditingQuestion(null);
                    resetQuestionForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      resetQuestionForm();
                      setQuestionForm(prev => ({ 
                        ...prev, 
                        bank_id: selectedBank.id,
                        certification: selectedBank.certification 
                      }));
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Questão
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingQuestion ? 'Editar Questão' : 'Criar Nova Questão'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tópico</Label>
                          <Select 
                            value={questionForm.topic} 
                            onValueChange={(v) => setQuestionForm(prev => ({ ...prev, topic: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tópico" />
                            </SelectTrigger>
                            <SelectContent>
                              {ANCORD_TOPICS.map(topic => (
                                <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Dificuldade</Label>
                          <Select 
                            value={questionForm.difficulty} 
                            onValueChange={(v) => setQuestionForm(prev => ({ ...prev, difficulty: v as Difficulty }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(DIFFICULTY_INFO).map(([key, info]) => (
                                <SelectItem key={key} value={key}>{info.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Enunciado da Questão</Label>
                        <Textarea 
                          placeholder="Digite o enunciado completo da questão..."
                          rows={4}
                          value={questionForm.question_text}
                          onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Alternativas (marque a correta)</Label>
                        {questionForm.options.map((option, index) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={option.is_correct ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => handleOptionChange(index, 'is_correct', true)}
                            >
                              {option.id.toUpperCase()}
                            </Button>
                            <Input 
                              placeholder={`Alternativa ${option.id.toUpperCase()}`}
                              value={option.text}
                              onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                              className={option.is_correct ? 'border-green-500 bg-green-50' : ''}
                            />
                            {option.is_correct && (
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Explicação da Resposta</Label>
                        <Textarea 
                          placeholder="Explique por que a alternativa correta é a resposta certa..."
                          rows={3}
                          value={questionForm.explanation}
                          onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pontos</Label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            value={questionForm.points}
                            onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tempo Limite (segundos)</Label>
                          <Input 
                            type="number" 
                            min={30} 
                            max={600}
                            value={questionForm.time_limit_seconds}
                            onChange={(e) => setQuestionForm(prev => ({ ...prev, time_limit_seconds: parseInt(e.target.value) || 120 }))}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => saveQuestionMutation.mutate({
                          ...questionForm,
                          id: editingQuestion?.id,
                        })}
                        disabled={!questionForm.question_text || !questionForm.topic || saveQuestionMutation.isPending}
                      >
                        {saveQuestionMutation.isPending ? 'Salvando...' : (editingQuestion ? 'Atualizar Questão' : 'Criar Questão')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {questionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando questões...</div>
              ) : questions?.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma questão ainda</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece adicionando questões a este banco
                  </p>
                  <Button onClick={() => setIsCreateQuestionOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Questão
                  </Button>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Questão</TableHead>
                      <TableHead>Tópico</TableHead>
                      <TableHead>Dificuldade</TableHead>
                      <TableHead>Taxa de Acerto</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions?.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2 text-sm">{question.question_text}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{question.topic}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={DIFFICULTY_INFO[question.difficulty].color}>
                            {DIFFICULTY_INFO[question.difficulty].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500" 
                                style={{ width: `${question.success_rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {question.success_rate.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm('Excluir esta questão?')) {
                                  deleteQuestionMutation.mutate(question.id);
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
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics de Certificações
              </CardTitle>
              <CardDescription>
                Acompanhe o desempenho dos alunos por certificação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(CERTIFICATION_INFO).map(([cert, info]) => (
                  <Card key={cert} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${info.color} text-white`}>
                        <span className="text-xl">{info.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{info.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stats?.byCertification?.[cert] || 0} questões
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
