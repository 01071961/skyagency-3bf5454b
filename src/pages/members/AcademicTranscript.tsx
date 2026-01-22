import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  FileText, 
  Award, 
  Calendar, 
  Clock, 
  TrendingUp, 
  BookOpen,
  CheckCircle,
  XCircle,
  Printer,
  GraduationCap,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Weight,
  FileSpreadsheet,
  Shield,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRealtimeCompanySettings, CompanySettingsData } from '@/hooks/useRealtimeCompanySettings';

interface CourseRecord {
  id: string;
  productId: string;
  courseName: string;
  enrolledAt: string;
  completedAt: string | null;
  progressPercent: number;
  status: 'active' | 'completed' | 'expired';
  totalLessons: number;
  completedLessons: number;
  quizAttempts: QuizAttempt[];
  certificate: CertificateInfo | null;
  totalHours: number;
  modules: ModuleRecord[];
}

interface ModuleRecord {
  id: string;
  name: string;
  position: number;
  cargaHoraria: number;
  mediaFinal: number | null;
  frequencia: number;
  situacao: 'aprovado' | 'reprovado' | 'cursando';
  conceito: string | null;
  avaliacoes: EvaluationDetail[];
}

interface EvaluationDetail {
  id: string;
  titulo: string;
  tipo: string;
  peso: number;
  nota: number | null;
  notaMaxima: number;
  dataAplicacao: string | null;
}

interface QuizAttempt {
  lessonName: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface CertificateInfo {
  id: string;
  certificateNumber: string;
  validationCode: string;
  issuedAt: string;
  finalScore: number | null;
}

interface Profile {
  name: string | null;
  email: string;
}

const AcademicTranscript = () => {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Use realtime company settings hook
  const { settings: companySettings, loading: companyLoading, refresh: refreshCompanySettings } = useRealtimeCompanySettings();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('user_id', user?.id)
        .maybeSingle();

      setProfile(profileData || { name: user?.user_metadata?.name || null, email: user?.email || '' });

      // Fetch enrollments with product info
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          enrolled_at,
          progress_percent,
          status,
          last_accessed_at,
          product:products(
            id,
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Process each enrollment
      const courseRecords: CourseRecord[] = [];

      for (const enrollment of enrollments || []) {
        const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;
        if (!product) continue;

        // Get lessons count
        const { data: modules } = await supabase
          .from('product_modules')
          .select('id')
          .eq('product_id', enrollment.product_id);

        const moduleIds = modules?.map(m => m.id) || [];
        let totalLessons = 0;
        let completedLessons = 0;

        if (moduleIds.length > 0) {
          const { count: lessonCount } = await supabase
            .from('product_lessons')
            .select('id', { count: 'exact', head: true })
            .in('module_id', moduleIds);

          totalLessons = lessonCount || 0;

          // Get completed lessons
          const { data: lessonsData } = await supabase
            .from('product_lessons')
            .select('id')
            .in('module_id', moduleIds);

          const lessonIds = lessonsData?.map(l => l.id) || [];

          if (lessonIds.length > 0) {
            const { count: completedCount } = await supabase
              .from('lesson_progress')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user?.id)
              .in('lesson_id', lessonIds)
              .eq('completed', true);

            completedLessons = completedCount || 0;
          }
        }

        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from('lesson_quiz_attempts')
          .select(`
            id,
            score,
            passed,
            completed_at,
            total_questions,
            correct_answers,
            lesson:product_lessons(name)
          `)
          .eq('user_id', user?.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        const formattedQuizAttempts: QuizAttempt[] = (quizAttempts || [])
          .filter(attempt => {
            const lesson = Array.isArray(attempt.lesson) ? attempt.lesson[0] : attempt.lesson;
            return lesson?.name;
          })
          .map(attempt => {
            const lesson = Array.isArray(attempt.lesson) ? attempt.lesson[0] : attempt.lesson;
            return {
              lessonName: lesson?.name || 'Quiz',
              score: attempt.score || 0,
              passed: attempt.passed || false,
              attemptedAt: attempt.completed_at || '',
              totalQuestions: attempt.total_questions || 0,
              correctAnswers: attempt.correct_answers || 0,
            };
          });

        // Get certificate
        const { data: certificate } = await supabase
          .from('course_certificates')
          .select('id, certificate_number, validation_code, issued_at, final_score')
          .eq('user_id', user?.id)
          .eq('product_id', enrollment.product_id)
          .maybeSingle();

        // Fetch module records with evaluations
        const moduleRecords: ModuleRecord[] = [];
        
        if (moduleIds.length > 0) {
          // Get product modules
          const { data: modulesData } = await supabase
            .from('product_modules')
            .select('id, name, position')
            .eq('product_id', enrollment.product_id)
            .order('position');

          for (const mod of modulesData || []) {
            // Get historico_modulos for this module
            const { data: historico } = await supabase
              .from('historico_modulos')
              .select('*')
              .eq('user_id', user?.id)
              .eq('modulo_id', mod.id)
              .maybeSingle();

            // Get avaliacoes for this module
            const { data: avaliacoes } = await supabase
              .from('avaliacoes')
              .select('id, titulo, tipo, peso, data_aplicacao, nota_maxima')
              .eq('modulo_id', mod.id)
              .eq('is_active', true);

            // Get notas for each avaliacao
            const evaluationDetails: EvaluationDetail[] = [];
            for (const av of avaliacoes || []) {
              const { data: nota } = await supabase
                .from('notas_alunos')
                .select('nota')
                .eq('avaliacao_id', av.id)
                .eq('user_id', user?.id)
                .maybeSingle();

              evaluationDetails.push({
                id: av.id,
                titulo: av.titulo,
                tipo: av.tipo,
                peso: av.peso,
                nota: nota?.nota ?? null,
                notaMaxima: av.nota_maxima,
                dataAplicacao: av.data_aplicacao
              });
            }

            moduleRecords.push({
              id: mod.id,
              name: mod.name,
              position: mod.position,
              cargaHoraria: 20, // Default hours per module
              mediaFinal: historico?.media_final ?? null,
              frequencia: historico?.frequencia ?? 100,
              situacao: (historico?.situacao as 'aprovado' | 'reprovado' | 'cursando') || 'cursando',
              conceito: historico?.conceito ?? null,
              avaliacoes: evaluationDetails
            });
          }
        }

        const record: CourseRecord = {
          id: enrollment.id,
          productId: enrollment.product_id,
          courseName: product.name,
          enrolledAt: enrollment.enrolled_at,
          completedAt: enrollment.progress_percent >= 100 ? enrollment.last_accessed_at : null,
          progressPercent: enrollment.progress_percent || 0,
          status: enrollment.status as 'active' | 'completed' | 'expired',
          totalLessons,
          completedLessons,
          quizAttempts: formattedQuizAttempts,
          certificate: certificate ? {
            id: certificate.id,
            certificateNumber: certificate.certificate_number,
            validationCode: certificate.validation_code,
            issuedAt: certificate.issued_at,
            finalScore: certificate.final_score,
          } : null,
          totalHours: moduleRecords.reduce((acc, m) => acc + m.cargaHoraria, 0) || Math.round(totalLessons * 0.5),
          modules: moduleRecords
        };

        courseRecords.push(record);
      }

      setCourses(courseRecords);
    } catch (error) {
      console.error('Error fetching academic data:', error);
      toast.error('Erro ao carregar histórico acadêmico');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateLong = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateOverallStats = () => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progressPercent >= 100).length;
    const totalHours = courses.reduce((acc, c) => acc + c.totalHours, 0);
    const certificates = courses.filter(c => c.certificate).length;
    
    const allQuizAttempts = courses.flatMap(c => c.quizAttempts);
    const avgScore = allQuizAttempts.length > 0 
      ? Math.round(allQuizAttempts.reduce((acc, q) => acc + q.score, 0) / allQuizAttempts.length)
      : 0;

    return { totalCourses, completedCourses, totalHours, certificates, avgScore };
  };

  const calculateCourseAverage = (modules: ModuleRecord[]): number => {
    const modulesWithGrades = modules.filter(m => m.mediaFinal !== null);
    if (modulesWithGrades.length === 0) return 0;
    return modulesWithGrades.reduce((acc, m) => acc + (m.mediaFinal || 0), 0) / modulesWithGrades.length;
  };

  const calculateTotalFrequency = (modules: ModuleRecord[]): number => {
    if (modules.length === 0) return 100;
    return modules.reduce((acc, m) => acc + m.frequencia, 0) / modules.length;
  };

  const getSituacaoBadge = (situacao: 'aprovado' | 'reprovado' | 'cursando') => {
    switch (situacao) {
      case 'aprovado':
        return <Badge className="bg-green-600 text-white text-xs px-2">Aprovado</Badge>;
      case 'reprovado':
        return <Badge className="bg-red-600 text-white text-xs px-2">Reprovado</Badge>;
      default:
        return <Badge className="bg-amber-500 text-white text-xs px-2">Cursando</Badge>;
    }
  };

  const getSituacaoText = (situacao: 'aprovado' | 'reprovado' | 'cursando') => {
    switch (situacao) {
      case 'aprovado': return 'APROVADO';
      case 'reprovado': return 'REPROVADO';
      default: return 'CURSANDO';
    }
  };

  const getConceito = (nota: number | null): string => {
    if (nota === null) return '-';
    if (nota >= 9) return 'A';
    if (nota >= 7) return 'B';
    if (nota >= 6) return 'C';
    if (nota >= 4) return 'D';
    return 'E';
  };

  const generateDocumentNumber = () => {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const stats = calculateOverallStats();

  const filteredCourses = selectedCourse === 'all' 
    ? courses 
    : courses.filter(c => c.productId === selectedCourse);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Screen Only */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            Histórico Escolar
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho acadêmico completo
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Cursos</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.productId} value={course.productId}>
                  {course.courseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={refreshCompanySettings}
            disabled={companyLoading}
            title="Sincronizar configurações da empresa"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", companyLoading && "animate-spin")} />
            Sincronizar
          </Button>

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>

          <Button onClick={handlePrint} className="bg-primary">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Stats Overview - Screen Only */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden no-print">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-xs text-muted-foreground">Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedCourses}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalHours}h</p>
                <p className="text-xs text-muted-foreground">Total Horas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.certificates}</p>
                <p className="text-xs text-muted-foreground">Certificados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgScore}%</p>
                <p className="text-xs text-muted-foreground">Média Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printable Academic Transcript */}
      <div ref={printRef} className="print:block print-content">
        {filteredCourses.map((course) => (
          <div key={course.id} className="mb-8 print:mb-0 print:break-after-page">
            {/* Official Document - Print Version */}
            <div className="hidden print:block bg-white text-black p-8 min-h-[297mm] relative academic-transcript-print">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <GraduationCap className="w-[400px] h-[400px] text-gray-500" />
              </div>

              {/* Document Border */}
              <div className="border-4 border-double border-gray-800 p-6 relative">
                {/* Corner Decorations */}
                <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-gray-800"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-gray-800"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-gray-800"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-gray-800"></div>

                {/* Header */}
                <div className="text-center mb-6 border-b-2 border-gray-300 pb-6">
                  <div className="flex justify-center items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold tracking-wide text-gray-800 uppercase">
                    {companySettings?.company_name || 'Instituição de Ensino'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">{companySettings?.legal_name || ''}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {companySettings?.cnpj ? `CNPJ: ${companySettings.cnpj}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {[
                      companySettings?.address_street,
                      companySettings?.address_number,
                      companySettings?.address_city,
                      companySettings?.address_state
                    ].filter(Boolean).join(', ')}
                    {companySettings?.address_zip ? ` - CEP: ${companySettings.address_zip}` : ''}
                  </p>
                </div>

                {/* Document Title */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800 border-b-2 border-t-2 border-gray-300 py-2">
                    Histórico Escolar
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">
                    Documento Nº: {generateDocumentNumber()}
                  </p>
                </div>

                {/* Student Information */}
                <div className="mb-6 bg-gray-50 p-4 rounded border">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700 mb-3 border-b pb-2">
                    Dados do Aluno
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="font-semibold text-gray-600 w-28">Nome:</span>
                      <span className="text-gray-800 uppercase">{profile?.name || 'Não informado'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-600 w-28">E-mail:</span>
                      <span className="text-gray-800">{profile?.email}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-600 w-28">Curso:</span>
                      <span className="text-gray-800 uppercase font-medium">{course.courseName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-600 w-28">Carga Horária:</span>
                      <span className="text-gray-800">{course.totalHours} horas</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-600 w-28">Data Matrícula:</span>
                      <span className="text-gray-800">{formatDate(course.enrolledAt)}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-600 w-28">Data Conclusão:</span>
                      <span className="text-gray-800">
                        {course.completedAt ? formatDate(course.completedAt) : 'Em andamento'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grades Table */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700 mb-3 border-b pb-2">
                    Rendimento Escolar
                  </h3>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-3 py-2 text-left font-bold text-gray-700">
                          Disciplina/Módulo
                        </th>
                        <th className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-700 w-16">
                          C.H.
                        </th>
                        <th className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-700 w-14">
                          Nota
                        </th>
                        <th className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-700 w-16">
                          Conceito
                        </th>
                        <th className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-700 w-14">
                          Freq.
                        </th>
                        <th className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-700 w-24">
                          Situação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.modules.sort((a, b) => a.position - b.position).map((mod, idx) => (
                        <tr key={mod.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-400 px-3 py-2 text-gray-800">
                            {mod.name}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center text-gray-800">
                            {mod.cargaHoraria}h
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-mono text-gray-800">
                            {mod.mediaFinal !== null ? mod.mediaFinal.toFixed(1) : '-'}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center font-bold text-gray-800">
                            {mod.conceito || getConceito(mod.mediaFinal)}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center text-gray-800">
                            {mod.frequencia.toFixed(0)}%
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center text-gray-800 text-xs font-medium">
                            {getSituacaoText(mod.situacao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200 font-bold">
                        <td className="border border-gray-400 px-3 py-2 text-gray-800">
                          TOTAIS / MÉDIAS
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center text-gray-800">
                          {course.totalHours}h
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center font-mono text-gray-800">
                          {calculateCourseAverage(course.modules).toFixed(1)}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center text-gray-800">
                          {getConceito(calculateCourseAverage(course.modules))}
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center text-gray-800">
                          {calculateTotalFrequency(course.modules).toFixed(0)}%
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center text-gray-800 text-xs">
                          {calculateCourseAverage(course.modules) >= 6 && calculateTotalFrequency(course.modules) >= 75 
                            ? 'APROVADO' 
                            : calculateCourseAverage(course.modules) > 0 
                              ? 'REPROVADO' 
                              : 'CURSANDO'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Grade Legend */}
                <div className="mb-6 text-xs text-gray-600 bg-gray-50 p-3 rounded border">
                  <p className="font-semibold mb-1">Legenda de Conceitos:</p>
                  <p>A (9,0 a 10,0) - Excelente | B (7,0 a 8,9) - Bom | C (6,0 a 6,9) - Regular | D (4,0 a 5,9) - Insuficiente | E (0,0 a 3,9) - Reprovado</p>
                  <p className="mt-1">Critério de Aprovação: Nota ≥ 6,0 e Frequência ≥ 75%</p>
                </div>

                {/* Certificate Info if exists */}
                {course.certificate && (
                  <div className="mb-6 bg-green-50 border border-green-300 p-4 rounded">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-green-800 mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certificado de Conclusão
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Nº do Certificado: </span>
                        <span className="font-mono font-bold">{course.certificate.certificateNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Código de Validação: </span>
                        <span className="font-mono font-bold">{course.certificate.validationCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data de Emissão: </span>
                        <span className="font-bold">{formatDate(course.certificate.issuedAt)}</span>
                      </div>
                      {course.certificate.finalScore && (
                        <div>
                          <span className="text-gray-600">Nota Final: </span>
                          <span className="font-bold">{course.certificate.finalScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observations */}
                <div className="mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700 mb-2 border-b pb-2">
                    Observações
                  </h3>
                  <div className="h-16 border border-gray-300 rounded p-2 text-xs text-gray-500 italic">
                    {course.progressPercent >= 100 
                      ? `O(a) aluno(a) concluiu satisfatoriamente o curso "${course.courseName}" com carga horária total de ${course.totalHours} horas.`
                      : `O(a) aluno(a) encontra-se regularmente matriculado(a) no curso "${course.courseName}". Progresso atual: ${course.progressPercent}%.`
                    }
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-8 pt-4">
                  <p className="text-center text-sm text-gray-600 mb-8">
                    {[companySettings?.address_city, companySettings?.address_state].filter(Boolean).join(' - ') || 'Local'}, {formatDateLong(new Date().toISOString())}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8 mt-8">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-800 pt-2 mx-8">
                        <p className="font-bold text-sm text-gray-800">{companySettings?.academic_coordinator_name || 'Coordenador Acadêmico'}</p>
                        <p className="text-xs text-gray-600">Coordenador(a) Acadêmico(a)</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-800 pt-2 mx-8">
                        <p className="font-bold text-sm text-gray-800">{companySettings?.legal_representative_name || 'Diretor'}</p>
                        <p className="text-xs text-gray-600">Diretor(a)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Stamp Simulation */}
                <div className="absolute bottom-32 right-16 opacity-50">
                  <div className="w-24 h-24 border-4 border-blue-800 rounded-full flex items-center justify-center rotate-[-15deg]">
                    <div className="text-center">
                      <p className="text-[6px] font-bold text-blue-800 uppercase leading-tight">{companySettings?.company_name?.split(' ')[0] || 'Ensino'}</p>
                      <p className="text-[5px] text-blue-800">Profissionalizante</p>
                      <Shield className="w-4 h-4 text-blue-800 mx-auto my-0.5" />
                      <p className="text-[5px] text-blue-800">Documento</p>
                      <p className="text-[5px] text-blue-800">Autêntico</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-4 left-6 right-6 text-center text-[8px] text-gray-500 border-t pt-2">
                  <p>Este documento é válido como comprovante de estudos. Verifique a autenticidade em: {companySettings?.website || 'instituicao.com.br'}/verificar</p>
                  <p>Dúvidas: {companySettings?.phone || ''} {companySettings?.phone && companySettings?.email ? '|' : ''} {companySettings?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Screen Version - Interactive Card */}
            <Card className="overflow-hidden print:hidden no-print">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      {course.courseName}
                      {course.certificate && (
                        <Badge className="bg-green-500 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          Certificado
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Início: {formatDate(course.enrolledAt)}
                      </span>
                      {course.completedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Conclusão: {formatDate(course.completedAt)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.totalHours}h
                      </span>
                    </div>
                  </div>
                  <Badge variant={course.progressPercent >= 100 ? 'default' : 'secondary'} className="text-sm">
                    {course.progressPercent}% Concluído
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{course.modules.length}</p>
                    <p className="text-xs text-muted-foreground">Módulos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{calculateCourseAverage(course.modules).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Média</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{calculateTotalFrequency(course.modules).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Frequência</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-500">{course.quizAttempts.length}</p>
                    <p className="text-xs text-muted-foreground">Avaliações</p>
                  </div>
                </div>

                {/* Modules Table */}
                {course.modules.length > 0 && (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Módulo</TableHead>
                          <TableHead className="text-center w-16">C.H.</TableHead>
                          <TableHead className="text-center w-16">Nota</TableHead>
                          <TableHead className="text-center w-16">Conc.</TableHead>
                          <TableHead className="text-center w-16">Freq.</TableHead>
                          <TableHead className="text-center w-24">Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.modules.sort((a, b) => a.position - b.position).map((mod) => (
                          <>
                            <TableRow 
                              key={mod.id} 
                              className={`cursor-pointer hover:bg-muted/50 transition-colors ${mod.avaliacoes.length > 0 ? 'group' : ''}`}
                              onClick={() => mod.avaliacoes.length > 0 && toggleModule(mod.id)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {mod.avaliacoes.length > 0 && (
                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedModules.has(mod.id) ? 'rotate-90' : ''}`} />
                                  )}
                                  {mod.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">{mod.cargaHoraria}h</TableCell>
                              <TableCell className="text-center font-mono font-bold">
                                {mod.mediaFinal !== null ? mod.mediaFinal.toFixed(1) : '-'}
                              </TableCell>
                              <TableCell className="text-center font-bold text-primary">
                                {mod.conceito || getConceito(mod.mediaFinal)}
                              </TableCell>
                              <TableCell className="text-center">{mod.frequencia.toFixed(0)}%</TableCell>
                              <TableCell className="text-center">{getSituacaoBadge(mod.situacao)}</TableCell>
                            </TableRow>
                            {expandedModules.has(mod.id) && mod.avaliacoes.length > 0 && mod.avaliacoes.map((av) => (
                              <TableRow key={av.id} className="bg-muted/20">
                                <TableCell className="pl-10 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3 h-3" />
                                    {av.titulo}
                                    <Badge variant="outline" className="text-xs">Peso: {av.peso}x</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">
                                  {av.dataAplicacao ? format(new Date(av.dataAplicacao), 'dd/MM', { locale: ptBR }) : '-'}
                                </TableCell>
                                <TableCell className="text-center font-mono text-sm">
                                  {av.nota !== null ? `${av.nota.toFixed(1)}` : '-'}
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {av.nota !== null ? getConceito(av.nota) : '-'}
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-center">
                                  {av.nota !== null && (
                                    <Badge variant={av.nota >= 6 ? 'default' : 'destructive'} className="text-xs">
                                      {av.nota >= 6 ? 'OK' : 'REP'}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Course Summary */}
                <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-full">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Resultado Final</p>
                        <p className="text-sm text-muted-foreground">Média: {calculateCourseAverage(course.modules).toFixed(1)} | Frequência: {calculateTotalFrequency(course.modules).toFixed(0)}%</p>
                      </div>
                    </div>
                    <Badge 
                      variant={calculateCourseAverage(course.modules) >= 6 && calculateTotalFrequency(course.modules) >= 75 ? 'default' : 'destructive'}
                      className="text-sm px-4 py-1"
                    >
                      {calculateCourseAverage(course.modules) >= 6 && calculateTotalFrequency(course.modules) >= 75 ? '✓ APROVADO' : calculateCourseAverage(course.modules) > 0 ? '✗ REPROVADO' : 'EM CURSO'}
                    </Badge>
                  </div>
                </div>

                {/* Certificate Info */}
                {course.certificate && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-700">Certificado Emitido</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Número</span>
                        <span className="font-mono font-bold">{course.certificate.certificateNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Código</span>
                        <span className="font-mono font-bold">{course.certificate.validationCode}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Emissão</span>
                        <span className="font-bold">{formatDate(course.certificate.issuedAt)}</span>
                      </div>
                      {course.certificate.finalScore && (
                        <div>
                          <span className="text-muted-foreground block">Nota Final</span>
                          <span className="font-bold">{course.certificate.finalScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <Card className="text-center py-12 print:hidden">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não está matriculado em nenhum curso.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:break-after-page {
            break-after: page;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AcademicTranscript;
