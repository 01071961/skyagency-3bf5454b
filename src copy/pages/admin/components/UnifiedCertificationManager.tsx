import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Search,
  ChevronRight,
  BarChart2,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CertificationCreator from './CertificationCreator';
import EvaluationsManager from './EvaluationsManager';

interface CourseWithStats {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: string;
  total_evaluations: number;
  total_certificates: number;
  total_simulators: number;
  enrolled_students: number;
}

interface DashboardStats {
  totalCourses: number;
  totalEvaluations: number;
  totalCertificates: number;
  totalSimulators: number;
  passRate: number;
}

export default function UnifiedCertificationManager() {
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'create' | 'evaluations'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Load courses with stats
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, description, cover_image_url, status')
        .eq('product_type', 'course')
        .order('created_at', { ascending: false });

      if (!productsData) {
        setCourses([]);
        setStats({ totalCourses: 0, totalEvaluations: 0, totalCertificates: 0, totalSimulators: 0, passRate: 0 });
        return;
      }

      // Enrich with stats
      const enrichedCourses: CourseWithStats[] = await Promise.all(
        (productsData as Array<{ id: string; name: string; description: string | null; cover_image_url: string | null; status: string }>).map(async (course) => {
          const [evalResult, certResult, simResult, enrollResult] = await Promise.all([
            supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('product_id', course.id),
            supabase.from('course_certificates').select('*', { count: 'exact', head: true }).eq('product_id', course.id),
            supabase.from('exam_simulators').select('*', { count: 'exact', head: true }).eq('product_id', course.id),
            supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('product_id', course.id),
          ]);

          return {
            id: course.id,
            name: course.name,
            description: course.description,
            image_url: course.cover_image_url,
            status: course.status,
            total_evaluations: evalResult.count || 0,
            total_certificates: certResult.count || 0,
            total_simulators: simResult.count || 0,
            enrolled_students: enrollResult.count || 0,
          };
        })
      );

      setCourses(enrichedCourses);

      // Calculate overall stats
      const totalEvaluations = enrichedCourses.reduce((acc, c) => acc + c.total_evaluations, 0);
      const totalCertificates = enrichedCourses.reduce((acc, c) => acc + c.total_certificates, 0);
      const totalSimulators = enrichedCourses.reduce((acc, c) => acc + c.total_simulators, 0);

      // Get pass rate from exam attempts
      const { count: totalAttempts } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: passedAttempts } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .eq('passed', true);

      const passRate = totalAttempts && totalAttempts > 0 ? Math.round(((passedAttempts || 0) / totalAttempts) * 100) : 0;

      setStats({
        totalCourses: enrichedCourses.length,
        totalEvaluations,
        totalCertificates,
        totalSimulators,
        passRate,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const filteredCourses = courses.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Course detail view
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
            ← Voltar
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              {selectedCourse.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Gerencie certificações, simulados e avaliações deste curso
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Course stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedCourse.total_evaluations}</p>
                  <p className="text-xs text-muted-foreground">Avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ClipboardCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedCourse.total_simulators}</p>
                  <p className="text-xs text-muted-foreground">Simulados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedCourse.total_certificates}</p>
                  <p className="text-xs text-muted-foreground">Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedCourse.enrolled_students}</p>
                  <p className="text-xs text-muted-foreground">Alunos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course-specific tabs */}
        <Tabs defaultValue="evaluations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="evaluations" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Avaliações & Simulados
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="h-4 w-4" />
              Certificados Emitidos
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart2 className="h-4 w-4" />
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evaluations">
            <EvaluationsManager />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificatesIssuedList productId={selectedCourse.id} />
          </TabsContent>

          <TabsContent value="results">
            <ExamResultsDashboard productId={selectedCourse.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Sistema de Certificação Unificado
          </h2>
          <p className="text-muted-foreground">
            Gerencie certificações, simulados e avaliações de todos os cursos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Cursos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEvaluations}</p>
                  <p className="text-xs text-muted-foreground">Avaliações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ClipboardCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSimulators}</p>
                  <p className="text-xs text-muted-foreground">Simulados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCertificates}</p>
                  <p className="text-xs text-muted-foreground">Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.passRate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Aprovação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="courses">Por Curso</TabsTrigger>
          <TabsTrigger value="create">Criar Nova</TabsTrigger>
          <TabsTrigger value="evaluations">Todas Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cursos com Certificação</CardTitle>
              <CardDescription>
                Selecione um curso para gerenciar suas certificações, simulados e avaliações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cursos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum curso encontrado</p>
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {course.image_url ? (
                              <img
                                src={course.image_url}
                                alt={course.name}
                                className="w-16 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{course.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {course.total_evaluations} avaliações
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {course.total_simulators} simulados
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {course.total_certificates} certificados
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                onClick={() => setSelectedCourse(course)}
              >
                <CardContent className="p-4">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.name}
                      className="w-full h-24 rounded-lg object-cover mb-3"
                    />
                  ) : (
                    <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-3">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <h4 className="font-semibold line-clamp-1">{course.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {course.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      {course.total_evaluations}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <ClipboardCheck className="h-3 w-3 mr-1" />
                      {course.total_simulators}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {course.total_certificates}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <CertificationCreator onBack={() => setActiveTab('overview')} />
        </TabsContent>

        <TabsContent value="evaluations" className="mt-6">
          <EvaluationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component: Certificates issued list
function CertificatesIssuedList({ productId }: { productId: string }) {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, [productId]);

  const loadCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('product_id', productId)
        .order('issued_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificados Emitidos</CardTitle>
        <CardDescription>Lista de certificados emitidos para este curso</CardDescription>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum certificado emitido ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{cert.student_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Emitido em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{cert.certificate_number}</Badge>
                  {cert.final_score && (
                    <Badge variant="secondary">{cert.final_score}%</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-component: Exam results dashboard
function ExamResultsDashboard({ productId }: { productId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [productId]);

  const loadStats = async () => {
    try {
      // Get exam attempts for this product's simulators
      const { data: simulators } = await supabase
        .from('exam_simulators')
        .select('id')
        .eq('product_id', productId);

      if (!simulators || simulators.length === 0) {
        setStats({ total: 0, passed: 0, failed: 0, avgScore: 0 });
        setLoading(false);
        return;
      }

      const simIds = simulators.map((s) => s.id);

      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('*')
        .in('exam_id', simIds)
        .eq('status', 'completed');

      const total = attempts?.length || 0;
      const passed = attempts?.filter((a) => a.passed).length || 0;
      const failed = total - passed;
      const avgScore = total > 0 ? Math.round((attempts?.reduce((acc, a) => acc + (a.score || 0), 0) || 0) / total) : 0;

      setStats({ total, passed, failed, avgScore });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados dos Simulados</CardTitle>
        <CardDescription>Estatísticas de desempenho dos alunos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-3xl font-bold">{stats?.total || 0}</p>
            <p className="text-sm text-muted-foreground">Total Tentativas</p>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.passed || 0}</p>
            <p className="text-sm text-muted-foreground">Aprovados</p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg text-center">
            <p className="text-3xl font-bold text-red-600">{stats?.failed || 0}</p>
            <p className="text-sm text-muted-foreground">Reprovados</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-3xl font-bold text-primary">{stats?.avgScore || 0}%</p>
            <p className="text-sm text-muted-foreground">Média Geral</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
