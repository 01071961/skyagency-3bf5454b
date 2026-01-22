import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, Users, Award, TrendingUp, Target, 
  BarChart3, PieChart, Clock, Heart, Building2,
  ArrowUp, ArrowDown, Minus, Download
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CertificationStats {
  certification: string;
  total_students: number;
  exams_taken: number;
  exams_passed: number;
  pass_rate: number;
  average_score: number;
}

interface ImpactMetric {
  metric_date: string;
  total_students: number;
  active_students: number;
  exams_taken: number;
  pass_rate: number;
  new_certifications: number;
  social_impact_students: number;
}

const CERTIFICATION_COLORS: Record<string, string> = {
  ancord: '#3b82f6',
  cea: '#10b981',
  cfp: '#8b5cf6',
  cpa_10: '#f59e0b',
  cpa_20: '#ef4444',
  cnpi: '#14b8a6',
};

export default function EducationImpactDashboard() {
  // Fetch overview stats
  const { data: overview } = useQuery({
    queryKey: ['education-overview'],
    queryFn: async () => {
      // Aggregate data from various tables
      const { data: progressData } = await supabase
        .from('certification_progress')
        .select('certification, exams_passed, exams_completed, average_score, total_study_hours');

      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('passed, score')
        .eq('status', 'completed');

      const { data: partnersData } = await supabase
        .from('b2b_partners')
        .select('status, enrolled_employees')
        .eq('status', 'active');

      const totalStudents = progressData?.length || 0;
      const totalExams = attemptsData?.length || 0;
      const passedExams = attemptsData?.filter(a => a.passed).length || 0;
      const avgScore = attemptsData?.length 
        ? (attemptsData.reduce((sum, a) => sum + (a.score || 0), 0) / attemptsData.length) 
        : 0;
      const totalStudyHours = progressData?.reduce((sum, p) => sum + (p.total_study_hours || 0), 0) || 0;
      const b2bStudents = partnersData?.reduce((sum, p) => sum + (p.enrolled_employees || 0), 0) || 0;

      return {
        totalStudents,
        totalExams,
        passedExams,
        passRate: totalExams ? ((passedExams / totalExams) * 100).toFixed(1) : '0',
        avgScore: avgScore.toFixed(1),
        totalStudyHours: Math.round(totalStudyHours),
        totalCertified: progressData?.filter(p => (p.exams_passed || 0) > 0).length || 0,
        b2bStudents,
        activePartners: partnersData?.length || 0,
      };
    },
  });

  // Fetch certification breakdown
  const { data: certStats } = useQuery({
    queryKey: ['certification-breakdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('certification_progress')
        .select('certification, exams_completed, exams_passed, average_score');

      // Aggregate by certification
      const stats: Record<string, CertificationStats> = {};
      
      data?.forEach(row => {
        const cert = row.certification;
        if (!stats[cert]) {
          stats[cert] = {
            certification: cert,
            total_students: 0,
            exams_taken: 0,
            exams_passed: 0,
            pass_rate: 0,
            average_score: 0,
          };
        }
        stats[cert].total_students++;
        stats[cert].exams_taken += row.exams_completed || 0;
        stats[cert].exams_passed += row.exams_passed || 0;
        stats[cert].average_score += row.average_score || 0;
      });

      // Calculate averages
      Object.values(stats).forEach(stat => {
        stat.pass_rate = stat.exams_taken > 0 
          ? (stat.exams_passed / stat.exams_taken) * 100 
          : 0;
        stat.average_score = stat.total_students > 0 
          ? stat.average_score / stat.total_students 
          : 0;
      });

      return Object.values(stats);
    },
  });

  // Trend indicator component
  const TrendIndicator = ({ value, isPositive }: { value: number; isPositive?: boolean }) => {
    if (value === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    const positive = isPositive ?? value > 0;
    return positive ? (
      <ArrowUp className="w-3 h-3 text-green-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-500" />
    );
  };

  const getCertLabel = (cert: string) => {
    const labels: Record<string, string> = {
      ancord: 'ANCORD',
      cea: 'CEA',
      cfp: 'CFP',
      cpa_10: 'CPA-10',
      cpa_20: 'CPA-20',
      cnpi: 'CNPI',
    };
    return labels[cert] || cert.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Impacto Educacional
          </h2>
          <p className="text-muted-foreground">
            Métricas de desempenho e impacto da educação financeira
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {overview?.totalStudents || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <TrendIndicator value={12} />
                <span className="ml-1">+12% este mês</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {overview?.passRate || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <TrendIndicator value={5} />
                <span className="ml-1">Meta: 80%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {overview?.totalCertified || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Certificados</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <TrendIndicator value={8} />
                <span className="ml-1">+8 novos este mês</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {overview?.totalStudyHours?.toLocaleString() || 0}h
                  </p>
                  <p className="text-sm text-muted-foreground">Horas de Estudo</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <span>Média: 15h/aluno</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="certifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certifications">Por Certificação</TabsTrigger>
          <TabsTrigger value="b2b">Impacto B2B</TabsTrigger>
          <TabsTrigger value="social">Impacto Social</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certStats?.map((stat, index) => (
              <motion.div
                key={stat.certification}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        style={{ backgroundColor: CERTIFICATION_COLORS[stat.certification] }}
                        className="text-white"
                      >
                        {getCertLabel(stat.certification)}
                      </Badge>
                      <span className="text-2xl font-bold">
                        {stat.pass_rate.toFixed(0)}%
                      </span>
                    </div>
                    <CardDescription>Taxa de aprovação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Alunos</span>
                        <span className="font-medium">{stat.total_students}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Exames realizados</span>
                        <span className="font-medium">{stat.exams_taken}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Aprovações</span>
                        <span className="font-medium text-green-600">{stat.exams_passed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Nota média</span>
                        <span className="font-medium">{stat.average_score.toFixed(1)}%</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="pt-2">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${stat.pass_rate}%`,
                              backgroundColor: CERTIFICATION_COLORS[stat.certification]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {(!certStats || certStats.length === 0) && (
              <Card className="col-span-full p-8 text-center">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Sem dados ainda</h3>
                <p className="text-muted-foreground">
                  Os dados de certificações aparecerão aqui quando houver atividade
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="b2b">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Parcerias Corporativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{overview?.activePartners || 0}</p>
                      <p className="text-sm text-muted-foreground">Parceiros ativos</p>
                    </div>
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{overview?.b2bStudents || 0}</p>
                      <p className="text-sm text-muted-foreground">Colaboradores treinados</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setores Atendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: 'Bancos e Corretoras', percent: 45 },
                    { name: 'Consultorias', percent: 25 },
                    { name: 'Fintechs', percent: 20 },
                    { name: 'Outros', percent: 10 },
                  ].map(sector => (
                    <div key={sector.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{sector.name}</span>
                        <span className="text-muted-foreground">{sector.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${sector.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Impacto Social - SKY Finance nas Escolas
              </CardTitle>
              <CardDescription>
                Programa de educação financeira gratuito para comunidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 bg-pink-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-pink-600">1.200+</p>
                  <p className="text-sm text-muted-foreground">Alunos impactados</p>
                </div>
                
                <div className="p-6 bg-pink-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-pink-600">15</p>
                  <p className="text-sm text-muted-foreground">Escolas parceiras</p>
                </div>
                
                <div className="p-6 bg-pink-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-pink-600">3</p>
                  <p className="text-sm text-muted-foreground">Estados atendidos</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Cursos Gratuitos Oferecidos</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">HP 12c para Iniciantes</Badge>
                  <Badge variant="outline">Educação Financeira Básica</Badge>
                  <Badge variant="outline">Investimentos para Jovens</Badge>
                  <Badge variant="outline">Planejamento Financeiro Pessoal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
