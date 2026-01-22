import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth';
import { useRealtimeProfile } from '@/hooks/useRealtimeProfile';
import { useRealtimeTier } from '@/hooks/useRealtimeTier';
import { useStudyStreak } from '@/hooks/useStudyStreak';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Award, 
  Clock, 
  Play,
  TrendingUp,
  CheckCircle,
  FileText,
  Target,
  Brain,
  GraduationCap,
  Crown,
  Star,
  User,
  MapPin,
  BarChart3,
  Sparkles,
  Flame
} from 'lucide-react';

interface Enrollment {
  id: string;
  product_id: string;
  progress_percent: number;
  enrolled_at: string;
  expires_at: string | null;
  status: string;
  product: {
    name: string;
    cover_image_url: string | null;
    slug: string;
  };
}

const tierColors: Record<string, { gradient: string; bg: string; text: string; icon: React.ReactNode }> = {
  bronze: { gradient: 'from-amber-600 to-amber-800', bg: 'bg-amber-500/10', text: 'text-amber-500', icon: <Star className="h-4 w-4" /> },
  silver: { gradient: 'from-slate-400 to-slate-600', bg: 'bg-slate-400/10', text: 'text-slate-400', icon: <Star className="h-4 w-4" /> },
  gold: { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: <Crown className="h-4 w-4" /> },
  ouro: { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: <Crown className="h-4 w-4" /> },
  diamond: { gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-400/10', text: 'text-cyan-400', icon: <Sparkles className="h-4 w-4" /> },
  platinum: { gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-400/10', text: 'text-violet-400', icon: <Sparkles className="h-4 w-4" /> },
  platina: { gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-400/10', text: 'text-violet-400', icon: <Sparkles className="h-4 w-4" /> },
};

const MemberDashboard = () => {
  const { user } = useAuth();
  const { profile, displayName, isLoading: profileLoading } = useRealtimeProfile();
  const { effectiveTier, isGoldOrHigher, isLoading: tierLoading } = useRealtimeTier();
  const { currentStreak, longestStreak, calculateHoursWatched } = useStudyStreak();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalCertificates: 0,
    hoursWatched: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch exam stats
  const { data: examStats } = useQuery({
    queryKey: ['member-exam-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('id, score, passed, status')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      const { data: certProgress } = await supabase
        .from('certification_progress')
        .select('*')
        .eq('user_id', user.id);
      
      return {
        totalAttempts: attempts?.length || 0,
        passedExams: attempts?.filter(a => a.passed)?.length || 0,
        avgScore: attempts?.length ? Math.round(attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length) : 0,
        certifications: certProgress || []
      };
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  // Fetch real hours watched
  useEffect(() => {
    const fetchHours = async () => {
      const hours = await calculateHoursWatched();
      setStats(prev => ({ ...prev, hoursWatched: hours }));
    };
    if (user) fetchHours();
  }, [user, calculateHoursWatched]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          progress_percent,
          enrolled_at,
          expires_at,
          status,
          product:products(name, cover_image_url, slug)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      const enrollmentData = (data || []).map(e => ({
        ...e,
        product: Array.isArray(e.product) ? e.product[0] : e.product
      })) as Enrollment[];

      setEnrollments(enrollmentData);
      
      setStats(prev => ({
        ...prev,
        totalCourses: enrollmentData.length,
        completedCourses: enrollmentData.filter(e => e.progress_percent >= 100).length,
        totalCertificates: enrollmentData.filter(e => e.progress_percent >= 100).length
      }));
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCertLabel = (cert: string) => {
    const labels: Record<string, string> = {
      'ancord': 'ANCORD',
      'cea': 'CEA',
      'cfp': 'CFP',
      'cpa10': 'CPA-10',
      'cpa20': 'CPA-20'
    };
    return labels[cert] || cert.toUpperCase();
  };

  const tierStyle = tierColors[effectiveTier?.toLowerCase() || 'bronze'] || tierColors.bronze;

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      {/* Enhanced Welcome Section with Profile Info */}
      <Card className="bg-gradient-to-r from-primary/5 via-background to-primary/5 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            {/* Avatar */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/50 ring-2 ring-primary/20">
              <AvatarImage src={profile.avatarUrl || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl sm:text-2xl">
                {displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  Olá, {displayName}! 👋
                </h1>
                {/* Tier Badge */}
                <Badge className={`bg-gradient-to-r ${tierStyle.gradient} text-white capitalize flex items-center gap-1`}>
                  {tierStyle.icon}
                  {effectiveTier || 'Bronze'}
                </Badge>
              </div>
              
              {profile.headline && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                  {profile.headline}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {stats.totalCourses} cursos
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {examStats?.passedExams || 0} aprovações
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 sm:flex-col">
              <Link to="/members/profile">
                <Button variant="outline" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </Button>
              </Link>
              <Link to="/members/performance">
                <Button variant="outline" size="sm" className="gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatório</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.completedCourses}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-yellow-500/10">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{examStats?.passedExams || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Simulados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-blue-500/10">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{examStats?.avgScore || 0}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Expanded */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <Link to="/members/courses">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Meus Cursos</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/members/exams">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <FileText className="h-8 w-8 text-orange-500 mb-2" />
              <span className="text-sm font-medium">Simulados</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/members/certificates">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Award className="h-8 w-8 text-yellow-500 mb-2" />
              <span className="text-sm font-medium">Certificados</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/members/transcript">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <GraduationCap className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-sm font-medium">Histórico</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/members/progress">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm font-medium">Progresso</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/members/performance">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Brain className="h-8 w-8 text-cyan-500 mb-2" />
              <span className="text-sm font-medium">Relatório IA</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Certification Progress */}
      {examStats?.certifications && examStats.certifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Progresso de Certificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examStats.certifications.map((cert: any) => (
              <div key={cert.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getCertLabel(cert.certification)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {cert.exams_passed}/{cert.exams_completed} aprovados
                    </span>
                  </div>
                  <span className="text-sm font-medium">{Math.round(cert.estimated_readiness || 0)}% preparo</span>
                </div>
                <Progress value={cert.estimated_readiness || 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Continue Learning */}
      {enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Continue Aprendendo</h2>
            <Link to="/members/courses">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {enrollments.slice(0, 3).map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {enrollment.product?.cover_image_url ? (
                    <img 
                      src={enrollment.product.cover_image_url} 
                      alt={enrollment.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {enrollment.progress_percent > 0 && enrollment.progress_percent < 100 && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      {enrollment.progress_percent}% concluído
                    </Badge>
                  )}
                  {enrollment.progress_percent >= 100 && (
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      Concluído
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">
                    {enrollment.product?.name || 'Curso'}
                  </h3>
                  <Progress value={enrollment.progress_percent || 0} className="mb-4" />
                  <Link to={`/members/courses/${enrollment.product_id}`}>
                    <Button className="w-full" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      {enrollment.progress_percent > 0 ? 'Continuar' : 'Começar'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {enrollments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum curso ainda</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não está matriculado em nenhum curso.
            </p>
            <Link to="/loja">
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Explorar Cursos
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberDashboard;
