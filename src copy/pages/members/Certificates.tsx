import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Award, BookOpen, Calendar, ExternalLink, CheckCircle, Clock, 
  FileText, Sparkles, RefreshCw, GraduationCap, Trophy, Target,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRealtimeCompanySettings } from '@/hooks/useRealtimeCompanySettings';
import { useCertificationSystem } from '@/hooks/useCertificationSystem';
import { cn } from '@/lib/utils';
import { CertificateCard } from '@/components/certificates/CertificateCard';

interface Certificate {
  id: string;
  certificate_number: string;
  validation_code: string;
  course_name: string;
  student_name: string;
  course_hours: number | null;
  final_score: number | null;
  issued_at: string;
  product_id: string;
}

interface EligibleCourse {
  id: string;
  product_id: string;
  product_name: string;
  progress: number;
  avgScore: number;
  examsCompleted: number;
}

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligibleCourses, setEligibleCourses] = useState<EligibleCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  
  const { settings: companySettings, loading: settingsLoading, refresh: refreshSettings } = useRealtimeCompanySettings();
  const { progress: certProgress, generateCertificate } = useCertificationSystem();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch issued certificates
      const { data: certsData } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false });

      setCertificates(certsData || []);

      // Fetch enrollments with 100% progress that don't have certificates
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          progress_percent,
          product:products(name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .gte('progress_percent', 100);

      const certificateProductIds = new Set((certsData || []).map(c => c.product_id));
      
      // Get exam attempts for each eligible course
      const eligible: EligibleCourse[] = [];
      
      for (const enrollment of (enrollmentsData || [])) {
        if (certificateProductIds.has(enrollment.product_id)) continue;
        
        const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;
        
        // Get exam attempts for this user
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('score, passed')
          .eq('user_id', user?.id)
          .eq('status', 'completed');
        
        const passedAttempts = (attempts || []).filter(a => a.passed);
        const avgScore = passedAttempts.length > 0
          ? Math.round(passedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / passedAttempts.length)
          : 100;
        
        eligible.push({
          id: enrollment.id,
          product_id: enrollment.product_id,
          product_name: product?.name || 'Curso',
          progress: enrollment.progress_percent || 100,
          avgScore,
          examsCompleted: passedAttempts.length
        });
      }
      
      setEligibleCourses(eligible);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (course: EligibleCourse) => {
    setGenerating(course.product_id);
    try {
      const certId = await generateCertificate(course.product_id);
      if (certId) {
        fetchData();
      }
    } finally {
      setGenerating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                Meus Certificados
              </h1>
              <p className="text-muted-foreground">
                Certificados verificáveis dos cursos concluídos
                {companySettings?.company_name && ` • ${companySettings.company_name}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">{certificates.length}</span>
              <span className="text-muted-foreground text-sm">conquistados</span>
            </div>
            {eligibleCourses.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                <Sparkles className="h-5 w-5 text-green-500" />
                <span className="font-semibold">{eligibleCourses.length}</span>
                <span className="text-muted-foreground text-sm">disponíveis</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshSettings();
                fetchData();
              }}
              disabled={settingsLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", settingsLoading && "animate-spin")} />
              Sincronizar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Progress Overview */}
      {certProgress.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {certProgress.slice(0, 3).map((item, idx) => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${item.hasCertificate ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                    {item.hasCertificate ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Target className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.courseProgress}% concluído
                    </p>
                  </div>
                </div>
                <Progress value={item.courseProgress} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Média: {item.averageScore}%</span>
                  <span>{item.examsCompleted} provas</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Tabs defaultValue="issued" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="issued" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Emitidos ({certificates.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Disponíveis ({eligibleCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issued" className="mt-6">
          {certificates.length > 0 ? (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {certificates.map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CertificateCard certificate={cert} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum certificado emitido</h3>
                <p className="text-muted-foreground mb-4">
                  Complete seus cursos para receber certificados verificáveis.
                </p>
                <Link to="/members/courses">
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver Meus Cursos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {eligibleCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibleCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-teal-500/20 border-b relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <motion.div 
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="h-8 w-8 text-white" />
                        </motion.div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                          Curso Concluído
                        </p>
                        <h3 className="font-semibold line-clamp-2">{course.product_name}</h3>
                      </div>
                      <Badge className="absolute top-3 right-3 bg-green-500/90 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        100%
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span>Média: {course.avgScore}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>{course.examsCompleted} provas</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                        onClick={() => handleGenerateCertificate(course)}
                        disabled={generating === course.product_id}
                      >
                        {generating === course.product_id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Gerar Certificado
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tudo em dia!</h3>
                <p className="text-muted-foreground">
                  {certificates.length > 0 
                    ? 'Todos os certificados dos cursos concluídos foram emitidos.'
                    : 'Complete um curso para ter seu primeiro certificado disponível.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Certificates;
